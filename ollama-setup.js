"use strict";
// Utilidades para detectar, descargar, instalar y arrancar Ollama.
// No depende de Electron, así que se puede probar con Node a secas.

const fs = require("fs");
const path = require("path");
const http = require("http");
const https = require("https");
const { spawn, execFile } = require("child_process");

const OLLAMA_URL = "http://127.0.0.1:11434";
const INSTALLER_URL = "https://ollama.com/download/OllamaSetup.exe";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** ¿Está el servidor de Ollama respondiendo? */
async function ping(base = OLLAMA_URL) {
  try {
    const r = await fetch(base + "/api/version", { signal: AbortSignal.timeout(1500) });
    return r.ok;
  } catch {
    return false;
  }
}

/** Busca el ejecutable de Ollama en las rutas habituales y en el PATH. */
function findOllamaExe() {
  const exeName = process.platform === "win32" ? "ollama.exe" : "ollama";
  const candidates = [];
  if (process.platform === "win32") {
    if (process.env.LOCALAPPDATA) candidates.push(path.join(process.env.LOCALAPPDATA, "Programs", "Ollama", exeName));
    if (process.env.ProgramFiles) candidates.push(path.join(process.env.ProgramFiles, "Ollama", exeName));
  } else {
    candidates.push(
      "/usr/local/bin/ollama",
      "/usr/bin/ollama",
      "/opt/homebrew/bin/ollama",
      "/Applications/Ollama.app/Contents/Resources/ollama"
    );
  }
  for (const dir of (process.env.PATH || "").split(path.delimiter)) {
    if (dir) candidates.push(path.join(dir, exeName));
  }
  return (
    candidates.find((p) => {
      try {
        return fs.statSync(p).isFile();
      } catch {
        return false;
      }
    }) || null
  );
}

/** Arranca `ollama serve` en segundo plano (si no está ya en marcha). */
async function startServer() {
  if (await ping()) return { ok: true };
  const exe = findOllamaExe();
  if (!exe) return { ok: false, error: "No encuentro el programa de Ollama." };
  try {
    const child = spawn(exe, ["serve"], { detached: true, stdio: "ignore", windowsHide: true });
    child.on("error", () => {});
    child.unref();
  } catch (e) {
    return { ok: false, error: e.message };
  }
  for (let i = 0; i < 40; i++) {
    await sleep(500);
    if (await ping()) return { ok: true };
  }
  return { ok: false, error: "Ollama no ha arrancado a tiempo." };
}

/**
 * Descarga una URL a un fichero siguiendo redirecciones.
 * Solo https (salvo allowHttp, pensado para tests). Comprueba que llega completo.
 */
function download(url, dest, onProgress = () => {}, opts = {}, redirects = 0) {
  const { allowHttp = false } = opts;
  return new Promise((resolve, reject) => {
    if (redirects > 6) return reject(new Error("Demasiadas redirecciones."));
    let u;
    try {
      u = new URL(url);
    } catch {
      return reject(new Error("URL no válida."));
    }
    if (u.protocol !== "https:" && !(allowHttp && u.protocol === "http:")) {
      return reject(new Error("Solo se permiten descargas seguras (https)."));
    }
    const lib = u.protocol === "https:" ? https : http;

    const req = lib.get(u, { headers: { "User-Agent": "mochi-pixel-pet" } }, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        res.resume();
        const next = new URL(res.headers.location, u).toString();
        return download(next, dest, onProgress, opts, redirects + 1).then(resolve, reject);
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`La descarga falló (HTTP ${res.statusCode}).`));
      }

      const total = Number(res.headers["content-length"] || 0);
      let done = 0;
      let last = 0;
      let settled = false;
      const file = fs.createWriteStream(dest);

      const finish = (err) => {
        if (settled) return;
        settled = true;
        if (err) {
          file.destroy();
          fs.rm(dest, { force: true }, () => reject(err));
        } else {
          onProgress(done, total);
          resolve();
        }
      };

      res.on("data", (chunk) => {
        done += chunk.length;
        const now = Date.now();
        if (now - last > 100) {
          last = now;
          onProgress(done, total);
        }
      });
      res.on("error", finish);
      res.on("aborted", () => finish(new Error("La conexión se cortó durante la descarga.")));
      file.on("error", finish);
      file.on("close", () => {
        if (total && done !== total) return finish(new Error("La descarga quedó incompleta."));
        finish();
      });
      res.pipe(file);
    });
    req.on("error", reject);
    req.setTimeout(30000, () => req.destroy(new Error("Tiempo de espera agotado.")));
  });
}

/** Estado de la firma digital (Authenticode) de un fichero en Windows. */
function signatureStatus(file) {
  return new Promise((resolve) => {
    execFile(
      "powershell.exe",
      [
        "-NoProfile",
        "-NonInteractive",
        "-Command",
        "(Get-AuthenticodeSignature -LiteralPath $env:MOCHI_FILE).Status.ToString()",
      ],
      { windowsHide: true, timeout: 60000, env: { ...process.env, MOCHI_FILE: file } },
      (err, out) => resolve(err ? "Error" : String(out).trim())
    );
  });
}

function runInstaller(exe) {
  return new Promise((resolve, reject) => {
    const child = spawn(exe, ["/VERYSILENT", "/SUPPRESSMSGBOXES", "/NORESTART"], {
      windowsHide: true,
      stdio: "ignore",
    });
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error("El instalador tardó demasiado."));
    }, 15 * 60 * 1000);
    child.on("error", (e) => {
      clearTimeout(timer);
      reject(e);
    });
    child.on("exit", (code) => {
      clearTimeout(timer);
      code === 0 ? resolve() : reject(new Error(`El instalador terminó con código ${code}.`));
    });
  });
}

/** Descarga, verifica e instala Ollama (solo Windows). */
async function installOllama(tempDir, onProgress = () => {}) {
  if (process.platform !== "win32") {
    throw new Error("La instalación automática solo está disponible en Windows.");
  }
  const dest = path.join(tempDir, "OllamaSetup.exe");
  try {
    await download(INSTALLER_URL, dest, (done, total) => onProgress({ phase: "download", done, total }));
    onProgress({ phase: "verify" });
    const sig = await signatureStatus(dest);
    if (sig !== "Valid") {
      throw new Error(`La firma digital del instalador no es válida (${sig}). Por seguridad no lo ejecuto.`);
    }
    onProgress({ phase: "install" });
    await runInstaller(dest);
  } finally {
    fs.rm(dest, { force: true }, () => {});
  }
}

module.exports = { OLLAMA_URL, INSTALLER_URL, ping, findOllamaExe, startServer, download, installOllama };
