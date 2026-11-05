const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  platform: process.platform,
  // Ventana
  close: () => ipcRenderer.send("win:close"),
  minimize: () => ipcRenderer.send("win:min"),
  getState: () => ipcRenderer.invoke("win:getState"),
  setMode: (mode, petX, petY) => ipcRenderer.invoke("win:mode", { mode, petX, petY }),
  anchor: (petX, petY) => ipcRenderer.send("win:anchor", { petX, petY }),
  moveBy: (dx, dy) => ipcRenderer.send("win:moveBy", { dx, dy }),
  togglePin: () => ipcRenderer.invoke("win:pin"),
  onCursor: (cb) => ipcRenderer.on("cursor", (_e, p) => cb(p)),
  // Avisos, portapapeles, inicio automático y actividad del sistema
  notify: (title, body) => ipcRenderer.send("app:notify", { title, body }),
  readClipboard: () => ipcRenderer.invoke("clipboard:read"),
  getAutostart: () => ipcRenderer.invoke("app:getAutostart"),
  setAutostart: (on) => ipcRenderer.invoke("app:setAutostart", !!on),
  onIdle: (cb) => ipcRenderer.on("sys:idle", (_e, sec) => cb(Number(sec) || 0)),
  // Ollama
  openDownloadPage: () => ipcRenderer.send("open:ollama-page"),
  ollamaStatus: () => ipcRenderer.invoke("ollama:status"),
  ollamaStart: () => ipcRenderer.invoke("ollama:start"),
  ollamaInstall: () => ipcRenderer.invoke("ollama:install"),
  onSetupProgress: (cb) => ipcRenderer.on("setup:progress", (_e, data) => cb(data)),
});
