import { createBoard } from "../components/Board";
import { createControlsPanel } from "../components/ControlsPanel";
import { createHud } from "../components/Hud";
import { createMainMenu } from "../components/MainMenu";
import { createTileInfo } from "../components/TileInfo";
import { createTileTray } from "../components/TileTray";
import type { AppSnapshot } from "./store";
import { createAppStore } from "./store";

const SAVE_KEY = "coin-chain-saved-run";
const AUTOSAVE_DELAY_MS = 180;

function readSavedSnapshot(): unknown | null {
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);

    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as AppSnapshot;
  } catch {
    return null;
  }
}

function clearSavedSnapshot() {
  try {
    window.localStorage.removeItem(SAVE_KEY);
  } catch {
    // Ignore local storage failures and keep the session live.
  }
}

function writeSavedSnapshot(snapshot: AppSnapshot) {
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(snapshot));
  } catch {
    // Ignore local storage failures and keep the session live.
  }
}

export function createGameShell(): HTMLElement {
  const store = createAppStore();
  const shell = document.createElement("main");
  shell.className = "app-shell";
  let autosaveArmed = false;
  let autosaveTimeout: ReturnType<typeof setTimeout> | null = null;

  const runScreen = document.createElement("section");
  runScreen.className = "run-screen";

  const showMenu = () => {
    store.setTimeActive(false);
    shell.dataset.screen = "menu";
  };

  const showRun = () => {
    store.setTimeActive(true);
    shell.dataset.screen = "run";
  };

  const flushAutosave = () => {
    if (!autosaveArmed) {
      return;
    }

    if (autosaveTimeout) {
      clearTimeout(autosaveTimeout);
      autosaveTimeout = null;
    }

    writeSavedSnapshot(store.getSnapshot());
    menu.setSavedRunAvailable(true);
  };

  const scheduleAutosave = () => {
    if (!autosaveArmed) {
      return;
    }

    if (autosaveTimeout) {
      clearTimeout(autosaveTimeout);
    }

    autosaveTimeout = setTimeout(() => {
      autosaveTimeout = null;
      writeSavedSnapshot(store.getSnapshot());
      menu.setSavedRunAvailable(true);
    }, AUTOSAVE_DELAY_MS);
  };

  const armAutosave = () => {
    autosaveArmed = true;
    flushAutosave();
  };

  const handleBackToMenu = () => {
    flushAutosave();
    menu.showRootView();
    showMenu();
  };

  const hud = createHud(store, handleBackToMenu);
  const board = createBoard(store);
  const tileTray = createTileTray(store);
  const tileInfo = createTileInfo(store);
  const controls = createControlsPanel(store);

  const runLayout = document.createElement("div");
  runLayout.className = "run-layout";

  const leftSpacer = document.createElement("div");
  leftSpacer.className = "run-layout__spacer";

  const boardColumn = document.createElement("div");
  boardColumn.className = "run-layout__board";
  boardColumn.append(board, tileTray);

  const sideRail = document.createElement("aside");
  sideRail.className = "run-layout__side";
  sideRail.append(tileInfo, controls);

  runLayout.append(leftSpacer, boardColumn, sideRail);
  runScreen.append(hud, runLayout);

  const menu = createMainMenu({
    onContinue: () => {
      const savedSnapshot = readSavedSnapshot();

      if (!savedSnapshot) {
        menu.setSavedRunAvailable(false);
        return;
      }

      if (!store.loadSnapshot(savedSnapshot)) {
        clearSavedSnapshot();
        menu.setSavedRunAvailable(false);
        return;
      }

      armAutosave();
      showRun();
    },
    onStartCampaign: (difficulty) => {
      store.startMode("campaign", difficulty);
      armAutosave();
      showRun();
    },
    onStartEndless: () => {
      store.startMode("endless");
      armAutosave();
      showRun();
    }
  });

  store.subscribe(() => {
    if (!autosaveArmed) {
      return;
    }

    scheduleAutosave();
  });

  menu.setSavedRunAvailable(Boolean(readSavedSnapshot()));

  shell.append(menu.element, runScreen);
  showMenu();

  return shell;
}
