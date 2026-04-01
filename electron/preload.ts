import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("coinChainDesktop", {
  getFullscreen: () => ipcRenderer.invoke("coin-chain:get-fullscreen") as Promise<boolean>,
  onFullscreenChange: (listener: (isFullscreen: boolean) => void) => {
    const handler = (_event: unknown, isFullscreen: boolean) => {
      listener(isFullscreen);
    };

    ipcRenderer.on("coin-chain:fullscreen-changed", handler);

    return () => {
      ipcRenderer.removeListener("coin-chain:fullscreen-changed", handler);
    };
  },
  setFullscreen: (isFullscreen: boolean) =>
    ipcRenderer.invoke("coin-chain:set-fullscreen", isFullscreen) as Promise<boolean>
});

