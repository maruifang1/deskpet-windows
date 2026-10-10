const { app, BrowserWindow, screen, ipcMain } = require("electron");
const path = require("path");

const WINDOW_WIDTH = 260;
const WINDOW_HEIGHT = 320;

function createWindow() {
  const primary = screen.getPrimaryDisplay();
  const { width: workWidth, height: workHeight } = primary.workArea;

  const win = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    x: workWidth - WINDOW_WIDTH - 24,
    y: workHeight - WINDOW_HEIGHT - 40,
    transparent: true,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    backgroundColor: "#00000000",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.setAlwaysOnTop(true, "screen-saver");
  win.loadFile(path.join(__dirname, "index.html"));
  return win;
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  app.quit();
});

ipcMain.handle("get-window-position", (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  return win ? win.getPosition() : [0, 0];
});

ipcMain.on("move-window-to", (event, x, y) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return;
  const { workArea } = screen.getDisplayMatching(win.getBounds());
  const nextX = Math.min(Math.max(Math.round(x), workArea.x), workArea.x + workArea.width - WINDOW_WIDTH);
  const nextY = Math.min(Math.max(Math.round(y), workArea.y), workArea.y + workArea.height - WINDOW_HEIGHT);
  win.setBounds({ x: nextX, y: nextY, width: WINDOW_WIDTH, height: WINDOW_HEIGHT });
});

if (process.argv.includes("--smoke-test")) {
  app.whenReady().then(() => {
    setTimeout(() => app.quit(), 3000);
  });
}
