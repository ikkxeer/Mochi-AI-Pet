"use strict";
// Mini servidor local que sirve SOLO index.html en 127.0.0.1.
// Así la página tiene un origen http://127.0.0.1:PUERTO, que Ollama acepta por defecto
// (con file:// el origen es "null" y Ollama lo rechaza).

const http = require("http");
const fs = require("fs");

function listen(server, port) {
  return new Promise((resolve, reject) => {
    const onError = (err) => reject(err);
    server.once("error", onError);
    server.listen(port, "127.0.0.1", () => {
      server.removeListener("error", onError);
      resolve(server.address().port);
    });
  });
}

/** Sirve htmlPath en "/" . Intenta el puerto preferido y, si está ocupado, usa uno libre. */
async function startStaticServer(htmlPath, preferredPort = 0) {
  const server = http.createServer((req, res) => {
    const url = (req.url || "/").split("?")[0];
    const okMethod = req.method === "GET" || req.method === "HEAD";
    if (okMethod && (url === "/" || url === "/index.html")) {
      fs.readFile(htmlPath, (err, data) => {
        if (err) {
          res.writeHead(500);
          return res.end("error");
        }
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
        res.end(req.method === "HEAD" ? undefined : data);
      });
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  let port;
  try {
    port = await listen(server, preferredPort);
  } catch (e) {
    if (e.code !== "EADDRINUSE" || !preferredPort) throw e;
    port = await listen(server, 0);
  }
  return { port, close: () => server.close() };
}

module.exports = { startStaticServer };
