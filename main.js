const { app, BrowserWindow, ipcMain, shell, screen, globalShortcut, powerMonitor, clipboard, Notification } = require("electron");
const path = require("path");
const fs = require("fs");
const setup = require("./ollama-setup");
const { startStaticServer } = require("./static-server");

const PREFERRED_PORT = 47321; // puerto fijo para que localStorage (historial, ajustes) se conserve
const SIZES = {
  full: { width: 300, height: 460 }, // ventana con chat
  mini: { width: 170, height: 190 }, // solo la mascota
};
const SHORTCUT = "CommandOrControl+Shift+M";

let win = null;
let server = null;
let installing = false;
let anchor = null;
let cursorTimer = null;
let idleTimer = null;
const state = { mode: "full", pinned: true, x: null, y: null };

/* ---------- Estado de la ventana (posición, modo) ---------- */
const statePath = () => path.join(app.getPath("userData"), "window-state.json");
function loadState() {
  try {
    const s = JSON.parse(fs.readFileSync(statePath(), "utf8"));
    if (SIZES[s.mode]) state.mode = s.mode;
    if (typeof s.pinned === "boolean") state.pinned = s.pinned;
    if (Number.isFinite(s.x) && Number.isFinite(s.y)) { state.x = s.x; state.y = s.y; }
  } catch {}
}
let saveTimer = null;
function saveState() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { fs.writeFileSync(statePath(), JSON.stringify(state)); } catch {}
  }, 400);
}
function clampToScreen(x, y) {
  const size = SIZES[state.mode];
  const area = screen.getDisplayMatching({ x: Math.round(x), y: Math.round(y), ...size }).workArea;
  return {
    x: Math.round(Math.min(Math.max(x, area.x - size.width + 60), area.x + area.width - 60)),
    y: Math.round(Math.min(Math.max(y, area.y), area.y + area.height - 50)),
  };
}
function place(x, y, clamp = false) {
  if (!win || win.isDestroyed()) return;
  const p = clamp ? clampToScreen(x, y) : { x: Math.round(x), y: Math.round(y) };
  // setBounds con tamaño explícito evita que la ventana "crezca" con escalado de pantalla
  win.setBounds({ ...p, ...SIZES[state.mode] });
  state.x = p.x; state.y = p.y;
  saveState();
}

/* ---------- Arranque ---------- */
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => showWindow());
  app.whenReady().then(start);
}

app.on("window-all-closed", () => app.quit());
app.on("will-quit", () => {
  globalShortcut.unregisterAll();
  clearInterval(cursorTimer);
  clearInterval(idleTimer);
  if (server) server.close();
});

function send(channel, payload) {
  if (win && !win.isDestroyed()) win.webContents.send(channel, payload);
}

function showWindow() {
  if (!win) return;
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
}

async function start() {
  loadState();
  server = await startStaticServer(path.join(__dirname, "index.html"), PREFERRED_PORT);
  registerIpc();
  createWindow();
  globalShortcut.register(SHORTCUT, () => {
    if (!win) return;
    if (win.isVisible() && !win.isMinimized() && win.isFocused()) win.minimize();
    else showWindow();
  });
}

function createWindow() {
  const size = SIZES[state.mode];
  let pos;
  if (state.x !== null) {
    pos = clampToScreen(state.x, state.y);
  } else {
    const area = screen.getPrimaryDisplay().workArea;
    pos = { x: area.x + area.width - size.width - 24, y: area.y + area.height - size.height - 24 };
  }

  win = new BrowserWindow({
    ...size,
    ...pos,
    title: "Mochi",
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    hasShadow: false,
    alwaysOnTop: state.pinned,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  const origin = `http://127.0.0.1:${server.port}/`;
  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  win.webContents.on("will-navigate", (e, url) => {
    if (!url.startsWith(origin)) e.preventDefault();
  });
  win.on("moved", () => {
    const b = win.getBounds();
    state.x = b.x; state.y = b.y;
    saveState();
  });
  win.loadURL(origin);

  // Tiempo que lleva el usuario sin tocar el ordenador (para dormirse, saludar al volver y avisar de descansos)
  idleTimer = setInterval(() => {
    if (!win || win.isDestroyed()) return;
    try { send("sys:idle", powerMonitor.getSystemIdleTime()); } catch {}
  }, 5000);

  // Posición del cursor en todo el escritorio, para que Mochi lo siga con la mirada
  let last = "";
  cursorTimer = setInterval(() => {
    if (!win || win.isDestroyed() || !win.isVisible() || win.isMinimized()) return;
    const p = screen.getCursorScreenPoint();
    const b = win.getContentBounds();
    const key = `${p.x},${p.y},${b.x},${b.y}`;
    if (key === last) return;
    last = key;
    send("cursor", { x: p.x - b.x, y: p.y - b.y });
  }, 50);
}

function registerIpc() {
  const origin = `http://127.0.0.1:${server.port}/`;
  const trusted = (e) => !!e.senderFrame && e.senderFrame.url.startsWith(origin);
  const num = (v) => Number.isFinite(v) && Math.abs(v) < 10000;

  ipcMain.on("win:close", (e) => trusted(e) && app.quit());
  ipcMain.on("win:min", (e) => trusted(e) && win && win.minimize());
  ipcMain.on("open:ollama-page", (e) => trusted(e) && shell.openExternal("https://ollama.com/download"));

  ipcMain.handle("win:getState", (e) => (trusted(e) ? { mode: state.mode, pinned: state.pinned } : null));

  ipcMain.handle("win:mode", (e, p) => {
    if (!trusted(e) || !p || !SIZES[p.mode] || !win) return state.mode;
    const b = win.getBounds();
    // Recuerda dónde está la mascota en pantalla para que no "salte" al cambiar de tamaño
    anchor = num(p.petX) && num(p.petY) ? { x: b.x + p.petX, y: b.y + p.petY } : null;
    state.mode = p.mode;
    place(b.x, b.y);
    return state.mode;
  });

  ipcMain.on("win:anchor", (e, p) => {
    if (!trusted(e) || !anchor || !p || !num(p.petX) || !num(p.petY)) return;
    place(anchor.x - p.petX, anchor.y - p.petY, true);
    anchor = null;
  });

  ipcMain.on("win:moveBy", (e, p) => {
    if (!trusted(e) || !win || !p || !num(p.dx) || !num(p.dy)) return;
    const b = win.getBounds();
    place(b.x + p.dx, b.y + p.dy);
  });

  ipcMain.handle("win:pin", (e) => {
    if (!trusted(e) || !win) return state.pinned;
    state.pinned = !state.pinned;
    win.setAlwaysOnTop(state.pinned);
    saveState();
    return state.pinned;
  });

  // Avisos (temporizadores, descansos): muestra la ventana sin robar el foco y parpadea en la barra
  ipcMain.on("app:notify", (e, p) => {
    if (!trusted(e) || !win || win.isDestroyed() || !p) return;
    const title = String(p.title || "Mochi").slice(0, 60), body = String(p.body || "").slice(0, 200);
    try { if (Notification.isSupported()) new Notification({ title, body, silent: true }).show(); } catch {}
    if (win.isMinimized()) win.restore();
    win.showInactive();
    win.flashFrame(true);
    setTimeout(() => { if (win && !win.isDestroyed()) win.flashFrame(false); }, 4000);
  });

  ipcMain.handle("clipboard:read", (e) => {
    if (!trusted(e)) return "";
    try { return clipboard.readText().slice(0, 20000); } catch { return ""; }
  });

  // Abrir Mochi al iniciar sesión (Windows/macOS)
  const loginOpts = () => ({ path: process.execPath, args: [app.getAppPath()] });
  ipcMain.handle("app:getAutostart", (e) => {
    if (!trusted(e)) return false;
    try { return app.getLoginItemSettings(loginOpts()).openAtLogin; } catch { return false; }
  });
  ipcMain.handle("app:setAutostart", (e, on) => {
    if (!trusted(e)) return false;
    try {
      app.setLoginItemSettings({ openAtLogin: !!on, ...loginOpts() });
      return app.getLoginItemSettings(loginOpts()).openAtLogin;
    } catch { return false; }
  });

  ipcMain.handle("ollama:status", async (e) => {
    if (!trusted(e)) return null;
    const running = await setup.ping();
    return {
      running,
      installed: running || !!setup.findOllamaExe(),
      canAutoInstall: process.platform === "win32",
    };
  });

  ipcMain.handle("ollama:start", (e) => (trusted(e) ? setup.startServer() : { ok: false, error: "No permitido" }));

  ipcMain.handle("ollama:install", async (e) => {
    if (!trusted(e)) return { ok: false, error: "No permitido" };
    if (installing) return { ok: false, error: "Ya se está instalando." };
    installing = true;
    try {
      await setup.installOllama(app.getPath("temp"), (p) => send("setup:progress", p));
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    } finally {
      installing = false;
    }
  });
}
