import type {
  OutputDirection,
  PlacedTiles,
  ReleaseSeconds,
  TileDefinition,
  TileId,
  TileInstanceProperties,
  TilePriceMap
} from "./types";
import {
  DEFAULT_TILE_TIER,
  getBaseTileCost,
  getReleaseOptionsForTier,
  getTileEffectText
} from "./tileTiers";

export const tileCatalog: TileDefinition[] = [
  {
    accentClass: "tile-card--miner",
    badge: "MI",
    cost: getBaseTileCost("miner"),
    description: getTileEffectText("miner", DEFAULT_TILE_TIER),
    id: "miner",
    name: "Miner",
    supportsDirection: true,
    tagline: "Fast starter income."
  },
  {
    accentClass: "tile-card--rich-miner",
    badge: "RM",
    cost: getBaseTileCost("rich_miner"),
    description: getTileEffectText("rich_miner", DEFAULT_TILE_TIER),
    id: "rich_miner",
    name: "Rich Miner",
    supportsDirection: true,
    tagline: "Bigger base output."
  },
  {
    accentClass: "tile-card--booster",
    badge: "BO",
    cost: getBaseTileCost("booster"),
    description: getTileEffectText("booster", DEFAULT_TILE_TIER),
    id: "booster",
    name: "Booster",
    tagline: "Soft support for mines."
  },
  {
    accentClass: "tile-card--doubler",
    badge: "DB",
    cost: getBaseTileCost("doubler"),
    description: getTileEffectText("doubler", DEFAULT_TILE_TIER),
    id: "doubler",
    name: "Doubler",
    tagline: "Targets one strong vein."
  },
  {
    accentClass: "tile-card--tripler",
    badge: "TR",
    cost: getBaseTileCost("tripler"),
    description: getTileEffectText("tripler", DEFAULT_TILE_TIER),
    id: "tripler",
    name: "Tripler",
    tagline: "High-cost core support."
  },
  {
    accentClass: "tile-card--bank",
    badge: "BK",
    cost: getBaseTileCost("bank"),
    description: getTileEffectText("bank", DEFAULT_TILE_TIER),
    id: "bank",
    name: "Bank",
    releaseOptions: getReleaseOptionsForTier("bank", DEFAULT_TILE_TIER),
    supportsDirection: true,
    supportsRelease: true,
    tagline: "Short-cycle storage."
  },
  {
    accentClass: "tile-card--vault",
    badge: "VA",
    cost: getBaseTileCost("vault"),
    description: getTileEffectText("vault", DEFAULT_TILE_TIER),
    id: "vault",
    name: "Vault",
    releaseOptions: getReleaseOptionsForTier("vault", DEFAULT_TILE_TIER),
    supportsDirection: true,
    supportsRelease: true,
    tagline: "Late-game storage engine."
  },
  {
    accentClass: "tile-card--investment",
    badge: "IV",
    cost: getBaseTileCost("investment"),
    description: getTileEffectText("investment", DEFAULT_TILE_TIER),
    id: "investment",
    name: "Investment Tile",
    supportsDirection: true,
    tagline: "Turns deposits into scaling income."
  },
  {
    accentClass: "tile-card--splitter",
    badge: "SP",
    cost: getBaseTileCost("splitter"),
    description: getTileEffectText("splitter", DEFAULT_TILE_TIER),
    id: "splitter",
    name: "Splitter",
    supportsDirection: true,
    tagline: "Copies one nearby stream."
  },
  {
    accentClass: "tile-card--relay",
    badge: "RE",
    cost: getBaseTileCost("relay"),
    description: getTileEffectText("relay", DEFAULT_TILE_TIER),
    id: "relay",
    name: "Relay",
    supportsDirection: true,
    tagline: "Extends your routing path."
  },
  {
    accentClass: "tile-card--chain",
    badge: "CH",
    cost: getBaseTileCost("chain"),
    description: getTileEffectText("chain", DEFAULT_TILE_TIER),
    id: "chain",
    name: "Chain Tile",
    supportsDirection: true,
    tagline: "Rewards tight clusters."
  },
  {
    accentClass: "tile-card--edge",
    badge: "ED",
    cost: getBaseTileCost("edge"),
    description: getTileEffectText("edge", DEFAULT_TILE_TIER),
    id: "edge",
    name: "Edge Tile",
    supportsDirection: true,
    tagline: "Built for the outer ring."
  },
  {
    accentClass: "tile-card--corner",
    badge: "CO",
    cost: getBaseTileCost("corner"),
    description: getTileEffectText("corner", DEFAULT_TILE_TIER),
    id: "corner",
    name: "Corner Tile",
    supportsDirection: true,
    tagline: "Big payoff in tight corners."
  },
  {
    accentClass: "tile-card--risk",
    badge: "RK",
    cost: getBaseTileCost("risk"),
    description: getTileEffectText("risk", DEFAULT_TILE_TIER),
    id: "risk",
    name: "Risk Tile",
    supportsDirection: true,
    tagline: "Precise layout, huge burst."
  },
  {
    accentClass: "tile-card--decay",
    badge: "DE",
    cost: getBaseTileCost("decay"),
    description: getTileEffectText("decay", DEFAULT_TILE_TIER),
    id: "decay",
    name: "Decay Tile",
    supportsDirection: true,
    tagline: "Big output that fades."
  },
  {
    accentClass: "tile-card--cleaner",
    badge: "CL",
    cost: getBaseTileCost("cleaner"),
    description: getTileEffectText("cleaner", DEFAULT_TILE_TIER),
    id: "cleaner",
    name: "Cleaner",
    tagline: "Keeps fading tiles fresh."
  },
  {
    accentClass: "tile-card--anchor",
    badge: "AN",
    cost: getBaseTileCost("anchor"),
    description: getTileEffectText("anchor", DEFAULT_TILE_TIER),
    id: "anchor",
    name: "Anchor",
    tagline: "Safe endpoint for routed value."
  }
];

const directionalTiles = new Set(
  tileCatalog.filter((tile) => tile.supportsDirection).map((tile) => tile.id)
);
const releaseTiles = new Set(
  tileCatalog.filter((tile) => tile.supportsRelease).map((tile) => tile.id)
);
const storageTiles = new Set<TileId>(["bank", "investment", "vault"]);
const routingReceivers = new Set<TileId>(["anchor", "bank", "investment", "relay", "vault"]);

export function getTileDefinition(tileId: TileId): TileDefinition {
  const definition = tileCatalog.find((tile) => tile.id === tileId);

  if (!definition) {
    throw new Error(`Unknown tile requested: ${tileId}`);
  }

  return definition;
}

function getPlacedTileCount(placedTiles: PlacedTiles, tileId: TileId): number {
  return Object.values(placedTiles).filter((placedTileId) => placedTileId === tileId).length;
}

export function getScaledTilePrice(tileId: TileId, placedTiles: PlacedTiles): number {
  return getTileDefinition(tileId).cost * 2 ** getPlacedTileCount(placedTiles, tileId);
}

export function getTilePrices(
  placedTiles: PlacedTiles,
  costMultiplier = 1
): TilePriceMap {
  return tileCatalog.reduce<TilePriceMap>((prices, tile) => {
    prices[tile.id] = Math.max(
      1,
      Math.ceil(getScaledTilePrice(tile.id, placedTiles) * costMultiplier)
    );
    return prices;
  }, {} as TilePriceMap);
}

export function canAffordTile(
  tileId: TileId,
  coins: number,
  placedTiles: PlacedTiles,
  costMultiplier = 1
): boolean {
  return Math.max(
    1,
    Math.ceil(getScaledTilePrice(tileId, placedTiles) * costMultiplier)
  ) <= coins;
}

export function getTileShortfall(
  tileId: TileId,
  coins: number,
  placedTiles: PlacedTiles,
  costMultiplier = 1
): number {
  return Math.max(
    0,
    Math.max(1, Math.ceil(getScaledTilePrice(tileId, placedTiles) * costMultiplier)) - coins
  );
}

export function supportsDirectionalOutput(tileId: TileId): boolean {
  return directionalTiles.has(tileId);
}

export function supportsReleaseSetting(tileId: TileId): boolean {
  return releaseTiles.has(tileId);
}

export function isStorageTile(tileId: TileId): boolean {
  return storageTiles.has(tileId);
}

export function acceptsRoutedValue(tileId: TileId): boolean {
  return routingReceivers.has(tileId);
}

export function getDefaultTileProperties(
  tileId: TileId,
  tier = DEFAULT_TILE_TIER
): TileInstanceProperties {
  const releaseOptions =
    tileId === "bank" || tileId === "vault"
      ? getReleaseOptionsForTier(tileId, tier)
      : getTileDefinition(tileId).releaseOptions;

  return {
    direction: supportsDirectionalOutput(tileId) ? "none" : "none",
    releaseSeconds: releaseOptions?.[0]
  };
}

export function normalizeDirectionForTile(
  tileId: TileId,
  direction: OutputDirection
): OutputDirection {
  return supportsDirectionalOutput(tileId) ? direction : "none";
}

export function getReleaseOptions(tileId: TileId, tier = DEFAULT_TILE_TIER): ReleaseSeconds[] {
  if (tileId === "bank" || tileId === "vault") {
    return getReleaseOptionsForTier(tileId, tier);
  }

  return getTileDefinition(tileId).releaseOptions ?? [];
}

export function getDefaultRelease(
  tileId: TileId,
  tier = DEFAULT_TILE_TIER
): ReleaseSeconds | undefined {
  return getReleaseOptions(tileId, tier)[0];
}
