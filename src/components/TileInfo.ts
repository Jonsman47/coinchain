import type { AppStore } from "../app/store";
import { getCampaignDifficulty } from "../game/campaignDifficulties";
import { formatCoins, formatCompactNumber } from "../game/formatting";
import { getTileUnlockDay } from "../game/levels";
import {
  getDefaultTileProperties,
  getReleaseOptions,
  getTileDefinition,
  supportsDirectionalOutput,
  supportsReleaseSetting
} from "../game/tileCatalog";
import {
  DEFAULT_TILE_TIER,
  getNextTileEffectText,
  getTileEffectText,
  getTileUpgradeCost,
  MAX_TILE_TIER
} from "../game/tileTiers";
import type { OutputDirection, ReleaseSeconds } from "../game/types";
import { createTileVisual } from "./tileVisual";

const directionOptions: OutputDirection[] = ["up", "right", "down", "left", "none"];

function getDirectionLabel(direction: OutputDirection): string {
  switch (direction) {
    case "up":
      return "Up";
    case "right":
      return "Right";
    case "down":
      return "Down";
    case "left":
      return "Left";
    case "none":
      return "Direct";
  }
}

export function createTileInfo(store: AppStore): HTMLElement {
  const section = document.createElement("section");
  section.className = "side-card tile-info";

  const title = document.createElement("span");
  title.className = "side-card__label";
  title.textContent = "Selected";

  const preview = document.createElement("div");
  preview.className = "tile-info__preview";

  const name = document.createElement("h2");
  name.className = "tile-info__name";

  const meta = document.createElement("p");
  meta.className = "tile-info__meta";

  const hint = document.createElement("p");
  hint.className = "tile-info__hint";

  const upgradeSection = document.createElement("div");
  upgradeSection.className = "tile-info__upgrade";

  const upgradeLabel = document.createElement("span");
  upgradeLabel.className = "tile-info__properties-label";
  upgradeLabel.textContent = "Tier";

  const currentTierLine = document.createElement("p");
  currentTierLine.className = "tile-info__detail";

  const currentEffectLine = document.createElement("p");
  currentEffectLine.className = "tile-info__detail";

  const nextEffectLine = document.createElement("p");
  nextEffectLine.className = "tile-info__detail";

  const upgradeButton = document.createElement("button");
  upgradeButton.type = "button";
  upgradeButton.className = "tile-info__upgrade-button";
  upgradeButton.addEventListener("click", () => {
    store.upgradeFocusedTile();
  });

  upgradeSection.append(
    upgradeLabel,
    currentTierLine,
    currentEffectLine,
    nextEffectLine,
    upgradeButton
  );

  const properties = document.createElement("div");
  properties.className = "tile-info__properties";

  const propertiesLabel = document.createElement("span");
  propertiesLabel.className = "tile-info__properties-label";
  propertiesLabel.textContent = "Properties";

  const directionRow = document.createElement("div");
  directionRow.className = "tile-info__property-group";

  const directionTitle = document.createElement("span");
  directionTitle.className = "tile-info__property-name";
  directionTitle.textContent = "Output";

  const directionButtons = new Map<OutputDirection, HTMLButtonElement>();
  const directionOptionsRow = document.createElement("div");
  directionOptionsRow.className = "tile-info__property-options";

  directionOptions.forEach((direction) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "tile-info__property-button";
    button.textContent = getDirectionLabel(direction);
    button.addEventListener("click", () => {
      store.setFocusedTileDirection(direction);
    });
    directionButtons.set(direction, button);
    directionOptionsRow.append(button);
  });

  directionRow.append(directionTitle, directionOptionsRow);

  const releaseRow = document.createElement("div");
  releaseRow.className = "tile-info__property-group";

  const releaseTitle = document.createElement("span");
  releaseTitle.className = "tile-info__property-name";
  releaseTitle.textContent = "Release";

  const releaseOptionsRow = document.createElement("div");
  releaseOptionsRow.className = "tile-info__property-options";
  const releaseButtons = new Map<ReleaseSeconds, HTMLButtonElement>();

  ([2, 5, 10, 20, 40, 80] as ReleaseSeconds[]).forEach((seconds) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "tile-info__property-button";
    button.textContent = `${seconds}s`;
    button.addEventListener("click", () => {
      store.setFocusedTileReleaseSeconds(seconds);
    });
    releaseButtons.set(seconds, button);
    releaseOptionsRow.append(button);
  });

  releaseRow.append(releaseTitle, releaseOptionsRow);
  properties.append(propertiesLabel, directionRow, releaseRow);
  section.append(title, preview, name, meta, hint, upgradeSection, properties);

  store.subscribe(
    ({
      campaignDifficultyId,
      coins,
      currentLevel,
      hoveredTileId,
      inspectedCellId,
      levelRunState,
      nextExpansionCost,
      placedTileCosts,
      placedTiles,
      selectedTileId,
      statusMessage,
      storedCoins,
      tilePrices,
      tileTiersByCell,
      tilePropertiesByCell,
      decayValues
    }) => {
      const inspectedTileId = inspectedCellId ? placedTiles[inspectedCellId] ?? null : null;
      const tileId = inspectedTileId ?? selectedTileId ?? hoveredTileId;
      const isInspectingFocusedTile = inspectedTileId !== null && tileId === inspectedTileId;
      const isShowingSelectedShopTile =
        !isInspectingFocusedTile && selectedTileId !== null && tileId === selectedTileId;

      preview.replaceChildren();
      section.dataset.selectedTile = tileId ?? "none";
      section.dataset.focusMode = isInspectingFocusedTile
        ? "placed"
        : isShowingSelectedShopTile
          ? "shop"
          : tileId
            ? "preview"
            : "none";

      if (!tileId) {
        name.textContent = "No tile";
        meta.textContent = "Hover the shop or inspect the board.";
        hint.textContent =
          levelRunState === "playing"
            ? nextExpansionCost === null
              ? "Board fully expanded."
              : `Next edge costs ${formatCoins(nextExpansionCost)}.`
            : statusMessage;
        upgradeSection.hidden = true;
        properties.hidden = true;
        return;
      }

      const tile = getTileDefinition(tileId);
      const tileUnlocked = currentLevel.availableTileIds.includes(tileId);
      const unlockDay = getTileUnlockDay(tileId);
      const tileTier =
        isInspectingFocusedTile && inspectedCellId !== null
          ? tileTiersByCell[inspectedCellId] ?? DEFAULT_TILE_TIER
          : DEFAULT_TILE_TIER;
      const activeTileProperties = isInspectingFocusedTile && inspectedCellId !== null
        ? tilePropertiesByCell[inspectedCellId] ?? getDefaultTileProperties(tileId, tileTier)
        : getDefaultTileProperties(tileId, tileTier);
      const showsProperties =
        supportsDirectionalOutput(tileId) || supportsReleaseSetting(tileId);
      const currentEffectText = getTileEffectText(tileId, tileTier);
      const nextEffectText = getNextTileEffectText(tileId, tileTier);
      const nextUpgradeCost = getTileUpgradeCost(
        tileId,
        tileTier,
        currentLevel.kind === "campaign"
          ? getCampaignDifficulty(campaignDifficultyId ?? "easy").upgradeCostMultiplier
          : 1
      );
      const canUpgrade =
        isInspectingFocusedTile &&
        nextUpgradeCost !== null &&
        tileTier < MAX_TILE_TIER &&
        coins >= nextUpgradeCost &&
        levelRunState === "playing";

      preview.append(createTileVisual(tileId, "shop"));
      name.textContent = tile.name;

      if (isInspectingFocusedTile && inspectedCellId) {
        const paidPrice = placedTileCosts[inspectedCellId] ?? tilePrices[tileId];
        meta.textContent = `Paid ${formatCoins(paidPrice)} / Sell ${formatCoins(Math.floor(paidPrice / 2))}`;
      } else if (!tileUnlocked) {
        meta.textContent = `Locked / Day ${unlockDay} / ${formatCoins(tilePrices[tileId])} / ${tile.description}`;
      } else {
        meta.textContent = `${formatCoins(tilePrices[tileId])} / ${tile.description}`;
      }

      upgradeSection.hidden = false;
      currentTierLine.textContent = `Tier ${tileTier}`;
      currentEffectLine.textContent = `Now: ${currentEffectText}`;

      if (nextEffectText && nextUpgradeCost !== null) {
        nextEffectLine.textContent = `Next: ${nextEffectText}`;
        upgradeButton.hidden = false;

        if (isInspectingFocusedTile) {
          upgradeButton.textContent = `Upgrade to Tier ${tileTier + 1} - ${formatCoins(nextUpgradeCost)}`;
          upgradeButton.disabled = !canUpgrade;
          upgradeButton.classList.toggle("is-disabled", !canUpgrade);
        } else {
          upgradeButton.textContent = `Place to upgrade - ${formatCoins(nextUpgradeCost)}`;
          upgradeButton.disabled = true;
          upgradeButton.classList.add("is-disabled");
        }
      } else {
        nextEffectLine.textContent = "Next: Max tier reached.";
        upgradeButton.textContent = "Max Tier";
        upgradeButton.disabled = true;
        upgradeButton.hidden = false;
        upgradeButton.classList.add("is-disabled");
      }

      if (!tileUnlocked && !isInspectingFocusedTile) {
        hint.textContent = `${tile.description} Unlocks on Day ${unlockDay}.`;
      } else if (tileId === "bank" || tileId === "vault" || tileId === "investment") {
        const stored = storedCoins[inspectedCellId ?? ""] ?? 0;
        const suffix = `Stored ${formatCompactNumber(stored)} / ${currentEffectText}.`;
        hint.textContent = suffix;
      } else if (tileId === "decay") {
        hint.textContent = `Current output ${formatCompactNumber(decayValues[inspectedCellId ?? ""] ?? 18)} / ${currentEffectText}.`;
      } else if (tileId === "relay") {
        hint.textContent = "Routes incoming value onward, or cashes out if set to Direct.";
      } else if (tileId === "anchor") {
        hint.textContent = "Routed value sent here becomes money right away.";
      } else if (tileId === "booster") {
        hint.textContent = "Boosters add their % bonuses together on nearby mines.";
      } else if (tileId === "doubler" || tileId === "tripler") {
        hint.textContent = "Only the single strongest Doubler or Tripler applies to each mine.";
      } else if (tileId === "edge") {
        hint.textContent = "Only shines on the outer edge.";
      } else if (tileId === "corner") {
        hint.textContent = "Only shines in a corner.";
      } else if (tileId === "risk") {
        hint.textContent = "Needs exactly two neighbors.";
      } else if (tileId === "cleaner") {
        hint.textContent = "Keeps adjacent Decay Tiles fresh.";
      } else if (tileId === "rich_miner") {
        hint.textContent = "A bigger stream than a normal Miner.";
      } else {
        hint.textContent = tile.tagline;
      }

      properties.hidden = !(isInspectingFocusedTile || isShowingSelectedShopTile) || !showsProperties;

      directionRow.hidden = !supportsDirectionalOutput(tileId);
      releaseRow.hidden = !supportsReleaseSetting(tileId);

      directionButtons.forEach((button, direction) => {
        button.disabled = !isInspectingFocusedTile;
        button.classList.toggle("is-active", activeTileProperties.direction === direction);
      });

      releaseButtons.forEach((button, seconds) => {
        const validOptions = getReleaseOptions(tileId, tileTier);
        button.hidden = !validOptions.includes(seconds);
        button.disabled = !isInspectingFocusedTile;
        button.classList.toggle(
          "is-active",
          (activeTileProperties.releaseSeconds ?? validOptions[0]) === seconds
        );
      });

      if (!isInspectingFocusedTile && !isShowingSelectedShopTile && properties.hidden) {
        return;
      }

      if (!isInspectingFocusedTile) {
        hint.textContent = `${hint.textContent} Click a placed tile to edit its settings.`;
      }
    }
  );

  return section;
}
