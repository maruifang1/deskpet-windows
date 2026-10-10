const { app, BrowserWindow, screen, ipcMain, Tray, Menu, nativeImage } = require("electron");
const { execFile } = require("child_process");
const path = require("path");

const WINDOW_WIDTH = 260;
const WINDOW_HEIGHT = 320;
const WINDOW_POLL_MS = 10000;
const WEATHER_POLL_MS = 30 * 60 * 1000;
const WEATHER_CITY = "";

let lastWindowInfo = null;
let windowInfoBusy = false;
let tray = null;

function createTray() {
  const icon = nativeImage.createFromPath(path.join(__dirname, "assets", "frame.morning.png"));
  if (icon.isEmpty()) return;
  tray = new Tray(icon.resize({ width: 16, height: 16 }));
  tray.setToolTip("DeskPet");
  tray.setContextMenu(
    Menu.buildFromTemplate([{ label: "退出桌宠", click: () => app.quit() }])
  );
}

function sendToWindow(channel, payload) {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) win.webContents.send(channel, payload);
  }
}

function isFullscreenRect(info) {
  const width = info.right - info.left;
  const height = info.bottom - info.top;
  if (width <= 0 || height <= 0) return false;
  const display = screen.getDisplayMatching({ x: info.left, y: info.top, width, height });
  const area = display.workArea;
  const areaSize = area.width * area.height;
  const windowSize = width * height;
  return areaSize > 0 && windowSize / areaSize >= 0.95;
}

function pollForegroundWindow() {
  if (windowInfoBusy) return;
  windowInfoBusy = true;
  const script = path.join(__dirname, "tools", "window-info.ps1");
  execFile(
    "powershell.exe",
    ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File", script],
    { timeout: 3000, windowsHide: true, maxBuffer: 1024 * 1024 },
    (error, stdout) => {
      windowInfoBusy = false;
      if (error) return;
      try {
        const info = JSON.parse(stdout.trim());
        const next = {
          process: info.process || "",
          title: info.title || "",
          isFullscreen: isFullscreenRect(info),
        };
        const changed =
          !lastWindowInfo ||
          lastWindowInfo.process !== next.process ||
          lastWindowInfo.title !== next.title;
        lastWindowInfo = next;
        if (changed) sendToWindow("foreground-window", next);
      } catch {}
    }
  );
}

async function fetchWeather() {
  try {
    const url = `https://wttr.in/${encodeURIComponent(WEATHER_CITY)}?format=j1&lang=zh`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const data = await res.json();
    const current = data.current_condition && data.current_condition[0];
    if (!current) return null;
    return {
      weatherCode: Number(current.weatherCode),
      tempC: Number(current.temp_C),
      desc: (current.weatherDesc && current.weatherDesc[0] && current.weatherDesc[0].value) || "",
    };
  } catch {
    return null;
  }
}

async function refreshWeather() {
  const info = await fetchWeather();
  if (info) sendToWindow("weather-update", info);
}

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
  createTray();
  pollForegroundWindow();
  setInterval(pollForegroundWindow, WINDOW_POLL_MS);
  refreshWeather();
  setInterval(refreshWeather, WEATHER_POLL_MS);
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

ipcMain.handle("get-work-area", (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return null;
  const { workArea } = screen.getDisplayMatching(win.getBounds());
  return {
    x: workArea.x,
    y: workArea.y,
    width: workArea.width,
    height: workArea.height,
    windowWidth: WINDOW_WIDTH,
    windowHeight: WINDOW_HEIGHT,
  };
});

if (process.argv.includes("--smoke-test")) {
  app.whenReady().then(() => {
    setTimeout(() => app.quit(), 3000);
  });
}
