import { app, BrowserWindow, Menu } from "electron";
import path from "node:path";

const WINDOW_WIDTH = 1440;
const WINDOW_HEIGHT = 980;

function createMainWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    minWidth: 1180,
    minHeight: 820,
    show: false,
    backgroundColor: "#f2c96e",
    title: "Coin Chain",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  Menu.setApplicationMenu(null);

  mainWindow.webContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedURL) => {
    console.error(
      `[coin-chain] renderer failed to load (${errorCode}) ${errorDescription}: ${validatedURL}`
    );
  });

  const devServerUrl = process.env.COIN_CHAIN_DEV_SERVER_URL;

  if (devServerUrl) {
    void mainWindow.loadURL(devServerUrl).catch((error) => {
      console.error("[coin-chain] failed to load dev server:", error);
    });
  } else {
    void mainWindow.loadFile(path.join(__dirname, "../dist/index.html")).catch((error) => {
      console.error("[coin-chain] failed to load packaged index:", error);
    });
  }

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  return mainWindow;
}

app.whenReady().then(() => {
  createMainWindow();
});

app.on("window-all-closed", () => {
  app.quit();
});
