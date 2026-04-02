import { app, BrowserWindow, Menu, ipcMain } from "electron";
import path from "node:path";

const WINDOW_WIDTH = 1440;
const WINDOW_HEIGHT = 980;

function getBrandingAssetPath(filename: string): string {
  return app.isPackaged
    ? path.join(__dirname, "../dist/branding", filename)
    : path.join(app.getAppPath(), "public/branding", filename);
}

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
    icon: getBrandingAssetPath("coin-chain-icon-256.png"),
    webPreferences: {
      backgroundThrottling: false,
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

  mainWindow.on("enter-full-screen", () => {
    mainWindow.webContents.send("coin-chain:fullscreen-changed", true);
  });
  mainWindow.on("leave-full-screen", () => {
    mainWindow.webContents.send("coin-chain:fullscreen-changed", false);
  });

  return mainWindow;
}

app.whenReady().then(() => {
  const mainWindow = createMainWindow();

  ipcMain.handle("coin-chain:get-fullscreen", () => {
    return mainWindow.isFullScreen();
  });

  ipcMain.handle("coin-chain:set-fullscreen", (_event, isFullscreen: boolean) => {
    mainWindow.setFullScreen(Boolean(isFullscreen));
    return mainWindow.isFullScreen();
  });
});

app.on("window-all-closed", () => {
  app.quit();
});
