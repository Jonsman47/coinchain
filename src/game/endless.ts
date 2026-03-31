import {
  BASE_BOARD_COLUMNS,
  BASE_BOARD_ROWS,
  MAX_BOARD_ROWS,
  defaultBlockedCellIds,
  normalizeBoardCellId
} from "./boardLayout";
import type { BoardExpansionCounts, TileId } from "./types";

export type GameMode = "campaign" | "endless";

export interface EndlessDefinition {
  availableTileIds: TileId[];
  blockedCellIds: string[];
  id: "endless";
  kind: "endless";
  maxRows: number;
  rowExpansionBaseCost: number;
  startingCoins: number;
  startingColumns: number;
  startingRows: number;
  title: string;
}

const endlessTiles: TileId[] = [
  "miner",
  "rich_miner",
  "booster",
  "doubler",
  "tripler",
  "bank",
  "vault",
  "investment",
  "splitter",
  "relay",
  "chain",
  "edge",
  "corner",
  "risk",
  "decay",
  "cleaner",
  "anchor"
];

export const endlessDefinition: EndlessDefinition = {
  availableTileIds: endlessTiles,
  blockedCellIds: defaultBlockedCellIds
    .map((cellId) => normalizeBoardCellId(cellId))
    .filter((cellId): cellId is string => cellId !== null),
  id: "endless",
  kind: "endless",
  maxRows: MAX_BOARD_ROWS,
  rowExpansionBaseCost: 140,
  startingCoins: 44,
  startingColumns: BASE_BOARD_COLUMNS,
  startingRows: BASE_BOARD_ROWS,
  title: "Endless"
};

export function getEndlessPressureCost(cycleNumber: number): number {
  return Math.max(0, Math.floor((cycleNumber - 1) / 3));
}

export function getEndlessScore(
  totalCoinsEarned: number,
  bestCycleIncome: number,
  completedCycles: number,
  expansionCounts: BoardExpansionCounts
): number {
  const totalExpansions =
    expansionCounts.top +
    expansionCounts.right +
    expansionCounts.bottom +
    expansionCounts.left;

  return totalCoinsEarned + bestCycleIncome * 4 + completedCycles * 2 + totalExpansions * 20;
}
