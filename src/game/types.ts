export interface BoardCellCoordinate {
  column: number;
  id: string;
  row: number;
}

export interface BoardBounds {
  maxColumn: number;
  maxRow: number;
  minColumn: number;
  minRow: number;
}

export interface BoardExpansionCounts {
  bottom: number;
  left: number;
  right: number;
  top: number;
}

export interface BoardCellDefinition extends BoardCellCoordinate {
  blocked: boolean;
}

export type ExpansionSide = "bottom" | "left" | "right" | "top";

export type SpeedMultiplier = 0 | 0.5 | 1 | 2 | 3;
export type OutputDirection = "down" | "left" | "none" | "right" | "up";
export type ReleaseSeconds = 2 | 5 | 10 | 20 | 40 | 80;

export type TileId =
  | "anchor"
  | "bank"
  | "booster"
  | "chain"
  | "cleaner"
  | "corner"
  | "decay"
  | "doubler"
  | "edge"
  | "investment"
  | "miner"
  | "relay"
  | "rich_miner"
  | "risk"
  | "splitter"
  | "tripler"
  | "vault";

export type PlacedTiles = Partial<Record<string, TileId>>;
export type PlacedTileCosts = Partial<Record<string, number>>;
export type TileTiersByCell = Partial<Record<string, number>>;
export type StoredCoinsByCell = Partial<Record<string, number>>;
export type DecayValuesByCell = Partial<Record<string, number>>;
export type TilePriceMap = Record<TileId, number>;

export interface TileInstanceProperties {
  direction: OutputDirection;
  releaseSeconds?: ReleaseSeconds;
}

export type TilePropertiesByCell = Partial<Record<string, TileInstanceProperties>>;

export interface TileDefinition {
  accentClass: string;
  badge: string;
  cost: number;
  description: string;
  id: TileId;
  name: string;
  releaseOptions?: ReleaseSeconds[];
  supportsDirection?: boolean;
  supportsRelease?: boolean;
  tagline: string;
}
