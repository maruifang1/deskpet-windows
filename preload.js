const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("deskpet", {
  getWindowPosition: () => ipcRenderer.invoke("get-window-position"),
  moveWindowTo: (x, y) => ipcRenderer.send("move-window-to", x, y),
  getWorkArea: () => ipcRenderer.invoke("get-work-area"),
  dockWindow: (edge) => ipcRenderer.send("dock-window", edge),
  onForegroundWindow: (callback) => {
    ipcRenderer.on("foreground-window", (_event, info) => callback(info));
  },
  onWeather: (callback) => {
    ipcRenderer.on("weather-update", (_event, info) => callback(info));
  },
  speakText: (text) => ipcRenderer.send("speak-text", text),
  onTtsAudio: (callback) => {
    ipcRenderer.on("tts-audio", (_event, payload) => callback(payload));
  },
  onTtsFailed: (callback) => {
    ipcRenderer.on("tts-failed", () => callback());
  },
  onTtsSkipped: (callback) => {
    ipcRenderer.on("tts-skipped", () => callback());
  },
  onWakeUp: (callback) => {
    ipcRenderer.on("wake-up", () => callback());
  },
});
