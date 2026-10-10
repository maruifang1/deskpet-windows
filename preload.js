const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("deskpet", {
  getWindowPosition: () => ipcRenderer.invoke("get-window-position"),
  moveWindowTo: (x, y) => ipcRenderer.send("move-window-to", x, y),
  getWorkArea: () => ipcRenderer.invoke("get-work-area"),
  onForegroundWindow: (callback) => {
    ipcRenderer.on("foreground-window", (_event, info) => callback(info));
  },
  onWeather: (callback) => {
    ipcRenderer.on("weather-update", (_event, info) => callback(info));
  },
});
