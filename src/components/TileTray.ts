import type { AppSettingsBridge } from "../app/settings";
import type { AppStore } from "../app/store";
import { formatCompactNumber } from "../game/formatting";
import { getTileUnlockDay, levels } from "../game/levels";
import { getTileDefinition, tileCatalog } from "../game/tileCatalog";
import type { TileId } from "../game/types";
import { createTileVisual } from "./tileVisual";

const unlockOrderByTile = tileCatalog.reduce<Map<TileId, number>>((orderMap, tile, tileIndex) => {
  const firstUnlockIndex = levels.findIndex((level) => level.availableTileIds.includes(tile.id));
  orderMap.set(tile.id, firstUnlockIndex === -1 ? levels.length + tileIndex : firstUnlockIndex);
  return orderMap;
}, new Map<TileId, number>());

const sortedTileCatalog = [...tileCatalog].sort((leftTile, rightTile) => {
  const leftUnlockIndex = unlockOrderByTile.get(leftTile.id) ?? Number.MAX_SAFE_INTEGER;
  const rightUnlockIndex = unlockOrderByTile.get(rightTile.id) ?? Number.MAX_SAFE_INTEGER;

  if (leftUnlockIndex !== rightUnlockIndex) {
    return leftUnlockIndex - rightUnlockIndex;
  }

  return tileCatalog.findIndex((tile) => tile.id === leftTile.id) - tileCatalog.findIndex((tile) => tile.id === rightTile.id);
});

export function createTileTray(
  store: AppStore,
  settingsBridge: AppSettingsBridge
): HTMLElement {
  const section = document.createElement("section");
  section.className = "shop-strip";

  const label = document.createElement("span");
  label.className = "shop-strip__label";
  label.textContent = "Shop";

  const list = document.createElement("div");
  list.className = "shop-strip__list";

  const tileButtons = new Map<TileId, HTMLButtonElement>();
  const tileCosts = new Map<TileId, HTMLSpanElement>();
  const tileOverlays = new Map<TileId, HTMLDivElement>();
  const tileOverlayLabels = new Map<TileId, HTMLSpanElement>();
  let runtimeSettings = settingsBridge.get();

  sortedTileCatalog.forEach((tile) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "shop-item";
    button.dataset.tileId = tile.id;
    button.addEventListener("click", () => {
      store.selectTile(tile.id);
    });
    button.addEventListener("mouseenter", () => {
      if (runtimeSettings.showTileDescriptionsOnHover) {
        store.hoverTile(tile.id);
      }
    });
    button.addEventListener("mouseleave", () => {
      store.hoverTile(null);
    });
    button.addEventListener("focus", () => {
      if (runtimeSettings.showTileDescriptionsOnHover) {
        store.hoverTile(tile.id);
      }
    });
    button.addEventListener("blur", () => {
      store.hoverTile(null);
    });

    const visual = createTileVisual(tile.id, "shop");

    const cost = document.createElement("span");
    cost.className = "shop-item__cost";

    const overlay = document.createElement("div");
    overlay.className = "shop-item__overlay";

    const overlayLabel = document.createElement("span");
    overlayLabel.className = "shop-item__overlay-label";
    overlay.append(overlayLabel);

    button.append(visual, cost, overlay);

    tileButtons.set(tile.id, button);
    tileCosts.set(tile.id, cost);
    tileOverlays.set(tile.id, overlay);
    tileOverlayLabels.set(tile.id, overlayLabel);
    list.append(button);
  });

  section.append(label, list);

  settingsBridge.subscribe((nextSettings) => {
    runtimeSettings = nextSettings;
  });

  store.subscribe(
    ({ coins, currentLevel, levelRunState, mode, placedTiles, selectedTileId, tilePrices }) => {
      const availableTileIds = new Set(currentLevel.availableTileIds);
      const isPlaying = levelRunState === "playing";

      label.textContent = mode === "endless" ? "Endless Shop" : "Shop";

      tileButtons.forEach((button, tileId) => {
        const tile = getTileDefinition(tileId);
        const price = tilePrices[tileId];
        const cost = tileCosts.get(tileId);
        const overlay = tileOverlays.get(tileId);
        const overlayLabel = tileOverlayLabels.get(tileId);
        const isAvailable = availableTileIds.has(tileId);
        const affordable = price <= coins;
        const isSelected = tileId === selectedTileId;
        const isDarkened = !isAvailable || !affordable || !isPlaying;
        const placedCount = Object.values(placedTiles).filter((placedTileId) => placedTileId === tileId).length;

        button.hidden = false;
        button.disabled = false;
        button.classList.toggle("is-locked", !isAvailable);
        button.classList.toggle("is-selected", isSelected);
        button.classList.toggle("is-unaffordable", isAvailable && (!affordable || !isPlaying));
        button.classList.toggle("is-darkened", isDarkened);
        button.title = runtimeSettings.showTooltips
          ? !isAvailable
            ? `${tile.name} unlocks on Day ${getTileUnlockDay(tileId)}.`
            : `${tile.name} / ${tile.description} / Cost ${price}`
          : "";
        button.dataset.state = !isAvailable
          ? "locked"
          : !isPlaying
            ? "inactive"
            : affordable
              ? "ready"
              : "unaffordable";
        button.setAttribute("aria-pressed", String(isSelected));
        button.setAttribute(
          "aria-label",
          !isAvailable
            ? `${tile.name}, locked until a later day`
            : affordable
              ? `${tile.name}, costs ${price}, ${placedCount} placed`
              : `${tile.name}, costs ${price}, need ${price - coins} more`
        );

        if (cost) {
          cost.textContent = formatCompactNumber(price);
        }

        if (overlay) {
          overlay.hidden = !isDarkened;
        }

        if (overlayLabel) {
          overlayLabel.textContent = !isDarkened
            ? ""
            : !isAvailable
              ? `Day ${getTileUnlockDay(tileId)}`
              : !isPlaying
                ? "Paused"
                : `Need ${formatCompactNumber(price - coins)}`;
        }
      });
    }
  );

  return section;
}
