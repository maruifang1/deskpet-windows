const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("deskpet", {
  getWindowPosition: () => ipcRenderer.invoke("get-window-position"),
  moveWindowTo: (x, y) => ipcRenderer.send("move-window-to", x, y),
});
