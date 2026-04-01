export interface CoinChainDesktopApi {
  getFullscreen: () => Promise<boolean>;
  onFullscreenChange: (listener: (isFullscreen: boolean) => void) => () => void;
  setFullscreen: (isFullscreen: boolean) => Promise<boolean>;
}

declare global {
  interface Window {
    coinChainDesktop?: CoinChainDesktopApi;
  }
}

export {};
