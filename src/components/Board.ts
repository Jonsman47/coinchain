import type { AppSettingsBridge } from "../app/settings";
import type { AppSnapshot, AppStore } from "../app/store";
import {
  BASE_BOARD_COLUMNS,
  BASE_BOARD_ROWS,
  MAX_EXPANSIONS_PER_SIDE,
  getBoardCellLabel,
  getBoardDimensions,
  getBoardLayout,
  getDisplayRowLabel
} from "../game/boardLayout";
import { formatCoins } from "../game/formatting";
import { getTileUnlockDay } from "../game/levels";
import { isEdgeCell } from "../game/boardMath";
import { canAffordTile, getTileShortfall, supportsDirectionalOutput } from "../game/tileCatalog";
import type {
  BoardBounds,
  ExpansionSide,
  OutputDirection,
  TileId,
  PlacedTiles,
  TileTiersByCell
} from "../game/types";
import { createTileVisual } from "./tileVisual";

const MIN_ZOOM = 0.7;
const MAX_ZOOM = 1.9;
const DRAG_THRESHOLD = 12;
const expansionSides: ExpansionSide[] = ["top", "right", "bottom", "left"];

function getBoardCellSize(boardRows: number, boardColumns: number): number {
  const maxDimension = Math.max(boardRows, boardColumns);
  return Math.max(34, 58 - Math.max(0, maxDimension - Math.max(BASE_BOARD_ROWS, BASE_BOARD_COLUMNS)) * 1.4);
}

function getDirectionBadge(direction: OutputDirection): string {
  switch (direction) {
    case "up":
      return "^";
    case "right":
      return ">";
    case "down":
      return "v";
    case "left":
      return "<";
    case "none":
      return "$";
  }
}

function shouldShowStorage(tileId: TileId): boolean {
  return tileId === "bank" || tileId === "investment" || tileId === "vault";
}

function getExpansionButtonText(
  side: ExpansionSide,
  nextExpansionCost: number | null,
  expansionCount: number
): string {
  const arrow = side === "top" ? "▲" : side === "right" ? "▶" : side === "bottom" ? "▼" : "◀";

  if (expansionCount >= MAX_EXPANSIONS_PER_SIDE || nextExpansionCost === null) {
    return `${arrow} Max`;
  }

  return `${arrow} ${formatCoins(nextExpansionCost)}`;
}

function getBoundsKey(bounds: BoardBounds): string {
  return `${bounds.minRow}:${bounds.maxRow}:${bounds.minColumn}:${bounds.maxColumn}`;
}

export interface BoardController {
  centerView: () => void;
  element: HTMLElement;
  panBy: (deltaX: number, deltaY: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
}

export function createBoard(
  store: AppStore,
  settingsBridge: AppSettingsBridge
): BoardController {
  const stage = document.createElement("section");
  stage.className = "board-stage";

  const viewport = document.createElement("div");
  viewport.className = "board-viewport";

  const camera = document.createElement("div");
  camera.className = "board-camera";

  const shell = document.createElement("div");
  shell.className = "board-shell";

  const topExpandButton = document.createElement("button");
  topExpandButton.type = "button";
  topExpandButton.className = "board-expander board-expander--top";
  topExpandButton.addEventListener("click", () => {
    store.buyExpansion("top");
  });

  const middleRow = document.createElement("div");
  middleRow.className = "board-shell__middle";

  const leftExpandButton = document.createElement("button");
  leftExpandButton.type = "button";
  leftExpandButton.className = "board-expander board-expander--left";
  leftExpandButton.addEventListener("click", () => {
    store.buyExpansion("left");
  });

  const frame = document.createElement("div");
  frame.className = "board-frame";

  const surface = document.createElement("div");
  surface.className = "board-surface";

  const rightExpandButton = document.createElement("button");
  rightExpandButton.type = "button";
  rightExpandButton.className = "board-expander board-expander--right";
  rightExpandButton.addEventListener("click", () => {
    store.buyExpansion("right");
  });

  const bottomExpandButton = document.createElement("button");
  bottomExpandButton.type = "button";
  bottomExpandButton.className = "board-expander board-expander--bottom";
  bottomExpandButton.addEventListener("click", () => {
    store.buyExpansion("bottom");
  });

  middleRow.append(leftExpandButton, frame, rightExpandButton);
  shell.append(topExpandButton, middleRow, bottomExpandButton);
  camera.append(shell);
  viewport.append(camera);

  const placementHint = document.createElement("p");
  placementHint.className = "board-stage__hint";
  placementHint.textContent = "Pick a tile and place it on an open cell.";

  stage.append(viewport, placementHint);

  let renderedBoundsKey = "";
  const cellButtons = new Map<string, HTMLButtonElement>();
  const cellContents = new Map<string, HTMLDivElement>();
  let scale = 1;
  let panX = 0;
  let panY = 0;
  let activePointerId: number | null = null;
  let pointerStartX = 0;
  let pointerStartY = 0;
  let panStartX = 0;
  let panStartY = 0;
  let isDragging = false;
  let suppressNextClick = false;
  let hasRenderedBoardState = false;
  let previousPlacedTiles: PlacedTiles = {};
  let previousTileTiers: TileTiersByCell = {};
  let latestSnapshot: AppSnapshot = store.getSnapshot();
  let runtimeSettings = settingsBridge.get();

  const triggerCellPulse = (
    button: HTMLButtonElement,
    className: "is-placement-pop" | "is-tier-pop",
    durationMs: number
  ) => {
    button.classList.remove(className);
    void button.offsetWidth;
    button.classList.add(className);
    window.setTimeout(() => {
      button.classList.remove(className);
    }, durationMs);
  };

  const handleBoardCellAction = (cellId: string) => {
    const snapshot = store.getSnapshot();

    if (snapshot.currentLevel.blockedCellIds.includes(cellId)) {
      return;
    }

    if (snapshot.placedTiles[cellId]) {
      store.focusCell(cellId);
      return;
    }

    store.placeSelectedTile(cellId);
  };

  const applyCameraTransform = () => {
    const viewportWidth = viewport.clientWidth || 1;
    const viewportHeight = viewport.clientHeight || 1;
    const shellWidth = shell.offsetWidth || 1;
    const shellHeight = shell.offsetHeight || 1;
    const centeredX = (viewportWidth - shellWidth * scale) / 2;
    const centeredY = (viewportHeight - shellHeight * scale) / 2;
    const maxOverflowX = Math.max(viewportWidth * 0.35, 80);
    const maxOverflowY = Math.max(viewportHeight * 0.35, 80);
    const minTotalX = viewportWidth - shellWidth * scale - maxOverflowX;
    const maxTotalX = maxOverflowX;
    const minTotalY = viewportHeight - shellHeight * scale - maxOverflowY;
    const maxTotalY = maxOverflowY;
    const totalX = Math.min(maxTotalX, Math.max(minTotalX, centeredX + panX));
    const totalY = Math.min(maxTotalY, Math.max(minTotalY, centeredY + panY));

    panX = totalX - centeredX;
    panY = totalY - centeredY;
    camera.style.transform = `translate(${totalX}px, ${totalY}px) scale(${scale})`;
  };

  const applyZoom = (nextScale: number) => {
    const clampedScale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, nextScale));

    if (clampedScale === scale) {
      return;
    }

    const viewportWidth = viewport.clientWidth || 1;
    const viewportHeight = viewport.clientHeight || 1;
    const shellWidth = shell.offsetWidth || 1;
    const shellHeight = shell.offsetHeight || 1;
    const centeredX = (viewportWidth - shellWidth * scale) / 2;
    const centeredY = (viewportHeight - shellHeight * scale) / 2;
    const totalX = centeredX + panX;
    const totalY = centeredY + panY;
    const pointerX = viewportWidth / 2;
    const pointerY = viewportHeight / 2;
    const boardX = (pointerX - totalX) / scale;
    const boardY = (pointerY - totalY) / scale;
    const nextCenteredX = (viewportWidth - shellWidth * clampedScale) / 2;
    const nextCenteredY = (viewportHeight - shellHeight * clampedScale) / 2;

    scale = clampedScale;
    panX = pointerX - nextCenteredX - boardX * clampedScale;
    panY = pointerY - nextCenteredY - boardY * clampedScale;
    applyCameraTransform();
  };

  const centerView = () => {
    scale = 1;
    panX = 0;
    panY = 0;
    applyCameraTransform();
  };

  const panBy = (deltaX: number, deltaY: number) => {
    panX += deltaX;
    panY += deltaY;
    applyCameraTransform();
  };

  const queueCameraTransform = () => {
    requestAnimationFrame(() => {
      applyCameraTransform();
    });
  };

  const rebuildBoard = (boardBounds: BoardBounds) => {
    renderedBoundsKey = getBoundsKey(boardBounds);
    cellButtons.clear();
    cellContents.clear();

    const { columns, rows } = getBoardDimensions(boardBounds);
    const cellSize = getBoardCellSize(rows, columns);

    const columnAxis = document.createElement("div");
    columnAxis.className = "board-axis board-axis--columns";
    columnAxis.style.setProperty("--board-columns", String(columns));

    const cornerSpacer = document.createElement("span");
    cornerSpacer.className = "board-axis__corner";
    columnAxis.append(cornerSpacer);

    for (let column = 1; column <= columns; column += 1) {
      const label = document.createElement("span");
      label.className = "board-axis__label";
      label.textContent = String(column);
      columnAxis.append(label);
    }

    const body = document.createElement("div");
    body.className = "board-surface__body";

    const rowAxis = document.createElement("div");
    rowAxis.className = "board-axis board-axis--rows";
    rowAxis.style.setProperty("--board-rows", String(rows));

    for (let row = 0; row < rows; row += 1) {
      const label = document.createElement("span");
      label.className = "board-axis__label";
      label.textContent = getDisplayRowLabel(row);
      rowAxis.append(label);
    }

    const grid = document.createElement("div");
    grid.className = "board-grid";
    grid.style.setProperty("--board-columns", String(columns));
    grid.style.setProperty("--board-rows", String(rows));
    grid.style.setProperty("--board-cell-size", `${cellSize}px`);

    getBoardLayout(boardBounds).forEach((cell) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "board-cell";
      button.dataset.cellId = cell.id;
      button.setAttribute("aria-label", getBoardCellLabel(cell.id, boardBounds));

      const content = document.createElement("div");
      content.className = "board-cell__content";

      button.append(content);
      button.addEventListener("click", () => {
        if (suppressNextClick) {
          suppressNextClick = false;
          return;
        }

        handleBoardCellAction(cell.id);
      });
      button.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        store.sellTile(cell.id);
      });

      cellButtons.set(cell.id, button);
      cellContents.set(cell.id, content);
      grid.append(button);
    });

    body.append(rowAxis, grid);
    surface.replaceChildren(columnAxis, body);
    frame.style.setProperty("--board-cell-size", `${cellSize}px`);
    stage.style.setProperty("--board-cell-size", `${cellSize}px`);
    frame.replaceChildren(surface);
    queueCameraTransform();
  };

  viewport.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) {
      return;
    }

    if ((event.target as HTMLElement | null)?.closest(".board-expander")) {
      return;
    }

    activePointerId = event.pointerId;
    pointerStartX = event.clientX;
    pointerStartY = event.clientY;
    panStartX = panX;
    panStartY = panY;
    isDragging = false;
    viewport.classList.remove("is-dragging");
  });

  viewport.addEventListener("pointermove", (event) => {
    if (event.pointerId !== activePointerId) {
      return;
    }

    const deltaX = event.clientX - pointerStartX;
    const deltaY = event.clientY - pointerStartY;

    if (!isDragging && Math.hypot(deltaX, deltaY) >= DRAG_THRESHOLD) {
      isDragging = true;
      suppressNextClick = true;
      viewport.classList.add("is-dragging");

      if (!viewport.hasPointerCapture(event.pointerId)) {
        viewport.setPointerCapture(event.pointerId);
      }
    }

    if (!isDragging) {
      return;
    }

    panX = panStartX + deltaX * runtimeSettings.panSensitivity;
    panY = panStartY + deltaY * runtimeSettings.panSensitivity;
    applyCameraTransform();
  });

  const finishPointerInteraction = (event: PointerEvent) => {
    if (event.pointerId !== activePointerId) {
      return;
    }

    const releasedOverCell = (document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null)
      ?.closest<HTMLButtonElement>(".board-cell");
    const shouldActivateCell = !isDragging && Boolean(releasedOverCell?.dataset.cellId);

    if (viewport.hasPointerCapture(event.pointerId)) {
      viewport.releasePointerCapture(event.pointerId);
    }

    activePointerId = null;
    viewport.classList.remove("is-dragging");

    if (shouldActivateCell && releasedOverCell?.dataset.cellId) {
      handleBoardCellAction(releasedOverCell.dataset.cellId);
      suppressNextClick = true;
      window.setTimeout(() => {
        suppressNextClick = false;
      }, 0);
    } else if (isDragging) {
      window.setTimeout(() => {
        suppressNextClick = false;
      }, 0);
    }

    isDragging = false;
  };

  viewport.addEventListener("pointerup", (event) => {
    finishPointerInteraction(event);
  });
  viewport.addEventListener("pointercancel", (event) => {
    finishPointerInteraction(event);
  });
  viewport.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();

      const zoomStep = 1 + 0.12 * runtimeSettings.zoomSensitivity;

      const nextScale =
        event.deltaY < 0
          ? Math.min(MAX_ZOOM, scale * zoomStep)
          : Math.max(MIN_ZOOM, scale / zoomStep);

      if (nextScale === scale) {
        return;
      }

      const viewportRect = viewport.getBoundingClientRect();
      const shellWidth = shell.offsetWidth || 1;
      const shellHeight = shell.offsetHeight || 1;
      const centeredX = (viewport.clientWidth - shellWidth * scale) / 2;
      const centeredY = (viewport.clientHeight - shellHeight * scale) / 2;
      const totalX = centeredX + panX;
      const totalY = centeredY + panY;
      const pointerX = event.clientX - viewportRect.left;
      const pointerY = event.clientY - viewportRect.top;
      const boardX = (pointerX - totalX) / scale;
      const boardY = (pointerY - totalY) / scale;
      const nextCenteredX = (viewport.clientWidth - shellWidth * nextScale) / 2;
      const nextCenteredY = (viewport.clientHeight - shellHeight * nextScale) / 2;

      scale = nextScale;
      panX = pointerX - nextCenteredX - boardX * nextScale;
      panY = pointerY - nextCenteredY - boardY * nextScale;
      applyCameraTransform();
    },
    { passive: false }
  );

  const resizeObserver = new ResizeObserver(() => {
    applyCameraTransform();
  });
  resizeObserver.observe(viewport);
  resizeObserver.observe(shell);

  const expanderButtons = new Map<ExpansionSide, HTMLButtonElement>([
    ["top", topExpandButton],
    ["right", rightExpandButton],
    ["bottom", bottomExpandButton],
    ["left", leftExpandButton]
  ]);

  const updateBoardRuntimePresentation = () => {
    stage.dataset.floatingText = runtimeSettings.showFloatingGainText ? "on" : "off";
    stage.dataset.motion = runtimeSettings.reducedMotion ? "reduced" : "full";
    viewport.title = runtimeSettings.showTooltips
      ? "Drag to pan. Use the mouse wheel or hotkeys to zoom."
      : "";
  };

  updateBoardRuntimePresentation();

  settingsBridge.subscribe((nextSettings) => {
    runtimeSettings = nextSettings;
    updateBoardRuntimePresentation();

    getBoardLayout(latestSnapshot.boardBounds).forEach((cell) => {
      const button = cellButtons.get(cell.id);

      if (!button) {
        return;
      }

      const placedTileId = latestSnapshot.placedTiles[cell.id];
      const currentTier = latestSnapshot.tileTiersByCell[cell.id] ?? 1;

      button.title = runtimeSettings.showTooltips
        ? placedTileId
          ? `${getBoardCellLabel(cell.id, latestSnapshot.boardBounds)} / ${placedTileId.replace("_", " ")} / T${currentTier}`
          : getBoardCellLabel(cell.id, latestSnapshot.boardBounds)
        : "";
    });
  });

  store.subscribe(
    ({
      activeCycleFeedback,
      boardBounds,
      boardColumns,
      boardRows,
      coins,
      currentLevel,
      decayValues,
      expansionCounts,
      focusedCellId,
      levelRunState,
      nextExpansionCost,
      placedTiles,
      selectedTileId,
      statusMessage,
      storedCoins,
      tileTiersByCell,
      tilePropertiesByCell
    }) => {
      latestSnapshot = store.getSnapshot();
      stage.dataset.state = levelRunState;

      if (getBoundsKey(boardBounds) !== renderedBoundsKey) {
        rebuildBoard(boardBounds);
      }

      const blockedCellIds = new Set(currentLevel.blockedCellIds);
      const selectedTileUnlocked =
        selectedTileId !== null && currentLevel.availableTileIds.includes(selectedTileId);
      const selectedTileAffordable =
        selectedTileId !== null
          ? selectedTileUnlocked && canAffordTile(selectedTileId, coins, placedTiles)
          : false;
      const selectedTileShortfall =
        selectedTileId === null ? 0 : getTileShortfall(selectedTileId, coins, placedTiles);
      const focusedCellOpen =
        focusedCellId !== null &&
        !blockedCellIds.has(focusedCellId) &&
        !placedTiles[focusedCellId];
      const outputDetailsByCell = new Map(
        activeCycleFeedback?.outputDetails.map((detail) => [detail.cellId, detail]) ?? []
      );
      const activeCellIds = new Set(activeCycleFeedback?.activeCellIds ?? []);
      const activeSupportCellIds = new Set(activeCycleFeedback?.activeSupportCellIds ?? []);

      if (
        levelRunState === "failed" ||
        levelRunState === "won" ||
        levelRunState === "set_complete"
      ) {
        placementHint.textContent = statusMessage;
      } else if (!selectedTileId) {
        placementHint.textContent = "Pick a tile and place it on an open cell.";
      } else if (!selectedTileUnlocked) {
        placementHint.textContent = `Unlocks on Day ${getTileUnlockDay(selectedTileId)}.`;
      } else if (!selectedTileAffordable) {
        placementHint.textContent = `Need ${selectedTileShortfall} more coins.`;
      } else {
        placementHint.textContent =
          focusedCellOpen && focusedCellId
            ? `Drop on ${getBoardCellLabel(focusedCellId, boardBounds)}.`
            : "Pick an open cell.";
      }

      expansionSides.forEach((side) => {
        const button = expanderButtons.get(side);

        if (!button) {
          return;
        }

        const canAffordExpansion =
          nextExpansionCost !== null && coins >= nextExpansionCost;
        const canExpand =
          levelRunState === "playing" &&
          expansionCounts[side] < MAX_EXPANSIONS_PER_SIDE &&
          nextExpansionCost !== null;

        button.disabled = !canExpand || !canAffordExpansion;
        button.classList.toggle("is-blocked", expansionCounts[side] >= MAX_EXPANSIONS_PER_SIDE);
        button.classList.toggle(
          "is-unaffordable",
          canExpand && nextExpansionCost !== null && coins < nextExpansionCost
        );
        button.textContent = getExpansionButtonText(side, nextExpansionCost, expansionCounts[side]);
        button.setAttribute(
          "aria-label",
          nextExpansionCost === null || expansionCounts[side] >= MAX_EXPANSIONS_PER_SIDE
            ? `${side} edge maxed`
            : `Expand ${side} for ${nextExpansionCost}`
        );
      });

      const cellSize = getBoardCellSize(boardRows, boardColumns);
      frame.style.setProperty("--board-cell-size", `${cellSize}px`);
      stage.style.setProperty("--board-cell-size", `${cellSize}px`);

      getBoardLayout(boardBounds).forEach((cell) => {
        const button = cellButtons.get(cell.id);
        const content = cellContents.get(cell.id);

        if (!button || !content) {
          return;
        }

        const placedTileId = placedTiles[cell.id];
        const isBlocked = blockedCellIds.has(cell.id);
        const currentTier = tileTiersByCell[cell.id] ?? 1;

        button.disabled = false;
        button.title = runtimeSettings.showTooltips
          ? placedTileId
            ? `${getBoardCellLabel(cell.id, boardBounds)} / ${placedTileId.replace("_", " ")} / T${currentTier}`
            : getBoardCellLabel(cell.id, boardBounds)
          : "";
        button.classList.toggle("is-blocked", isBlocked);
        button.classList.toggle("is-focused", cell.id === focusedCellId);
        button.classList.toggle(
          "is-placeable",
          !isBlocked &&
            levelRunState === "playing" &&
            !placedTileId &&
            selectedTileId !== null &&
            selectedTileAffordable
        );
        button.classList.toggle(
          "is-unavailable",
          !isBlocked &&
            levelRunState === "playing" &&
            !placedTileId &&
            selectedTileId !== null &&
            (!selectedTileUnlocked || !selectedTileAffordable)
        );
        button.classList.toggle("is-occupied", Boolean(placedTileId));
        button.classList.toggle("is-cycle-active", activeCellIds.has(cell.id));
        button.classList.toggle("is-support-active", activeSupportCellIds.has(cell.id));

        if (!placedTileId) {
          const emptyWell = document.createElement("div");
          emptyWell.className = isBlocked ? "board-cell__blocker" : "board-cell__well";
          content.replaceChildren(emptyWell);
          return;
        }

        const tileWrap = document.createElement("div");
        tileWrap.className = "board-piece";
        tileWrap.dataset.tileId = placedTileId;

        const visual = createTileVisual(placedTileId, "board");

        if (placedTileId === "edge" && !isEdgeCell(cell.id, boardBounds)) {
          visual.classList.add("is-muted");
        }

        tileWrap.append(visual);

        const tierBadge = document.createElement("span");
        tierBadge.className = "board-piece__tier";
        tierBadge.dataset.tier = String(currentTier);
        tierBadge.textContent = `T${currentTier}`;
        tileWrap.append(tierBadge);

        if (supportsDirectionalOutput(placedTileId)) {
          const directionBadge = document.createElement("span");
          directionBadge.className = "board-piece__direction";
          directionBadge.textContent = getDirectionBadge(
            tilePropertiesByCell[cell.id]?.direction ?? "none"
          );
          tileWrap.append(directionBadge);
        }

        if (shouldShowStorage(placedTileId)) {
          const storedValue = document.createElement("span");
          storedValue.className = "board-piece__counter";
          storedValue.textContent = String(storedCoins[cell.id] ?? 0);
          tileWrap.append(storedValue);
        } else if (placedTileId === "decay") {
          const decayValue = document.createElement("span");
          decayValue.className = "board-piece__counter";
          decayValue.textContent = String(decayValues[cell.id] ?? 18);
          tileWrap.append(decayValue);
        }

        content.replaceChildren(tileWrap);

        const activeOutput = outputDetailsByCell.get(cell.id);

        if (activeOutput && runtimeSettings.showFloatingGainText) {
          const yieldLabel = document.createElement("span");
          yieldLabel.className = "board-cell__yield";
          yieldLabel.textContent = activeOutput.label;
          content.append(yieldLabel);
        }

        if (hasRenderedBoardState && !previousPlacedTiles[cell.id] && placedTileId) {
          triggerCellPulse(button, "is-placement-pop", 460);
        }

        const previousTier = previousTileTiers[cell.id] ?? 1;

        if (hasRenderedBoardState && currentTier > previousTier) {
          triggerCellPulse(button, "is-tier-pop", 620);
        }
      });

      previousPlacedTiles = { ...placedTiles };
      previousTileTiers = { ...tileTiersByCell };
      hasRenderedBoardState = true;

      applyCameraTransform();
    }
  );

  return {
    centerView,
    element: stage,
    panBy,
    zoomIn() {
      applyZoom(scale * (1 + 0.12 * runtimeSettings.zoomSensitivity));
    },
    zoomOut() {
      applyZoom(scale / (1 + 0.12 * runtimeSettings.zoomSensitivity));
    }
  };
}
