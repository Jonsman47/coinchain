import {
  BASE_BOARD_COLUMNS,
  BASE_BOARD_ROWS,
  MAX_BOARD_ROWS
} from "./boardLayout";
import { formatCompactNumber } from "./formatting";
import type { TileId } from "./types";

export type DayGoal =
  | { target: number; type: "end_coins" }
  | { target: number; type: "end_income" };

export interface LevelDefinition {
  availableTileIds: TileId[];
  blockedCellIds: string[];
  goals: DayGoal[];
  id: string;
  kind: "campaign";
  maxRows: number;
  rowExpansionBaseCost: number;
  startingCoins: number;
  startingColumns: number;
  startingRows: number;
  title: string;
}

export type LevelRunState = "failed" | "playing" | "set_complete" | "won";

export interface LevelProgressMetrics {
  coins: number;
  completedCycles: number;
  incomePerSecond: number;
  remainingCycles: number;
}

const unlockDayByTile: Record<TileId, number> = {
  anchor: 23,
  bank: 8,
  booster: 1,
  chain: 12,
  cleaner: 22,
  corner: 16,
  decay: 24,
  doubler: 5,
  edge: 6,
  investment: 20,
  miner: 1,
  relay: 4,
  rich_miner: 3,
  risk: 18,
  splitter: 10,
  tripler: 14,
  vault: 19
};

const campaignTileOrder: TileId[] = [
  "miner",
  "booster",
  "rich_miner",
  "relay",
  "doubler",
  "edge",
  "bank",
  "splitter",
  "chain",
  "tripler",
  "corner",
  "risk",
  "vault",
  "investment",
  "cleaner",
  "anchor",
  "decay"
];

export function getTileUnlockDay(tileId: TileId): number {
  return unlockDayByTile[tileId];
}

export function getAvailableTileIdsForDay(dayNumber: number): TileId[] {
  return campaignTileOrder.filter((tileId) => getTileUnlockDay(tileId) <= dayNumber);
}

function mergeBlockedCellIds(extraBlockedCellIds: string[]): string[] {
  void extraBlockedCellIds;
  return [];
}

function level(data: Omit<LevelDefinition, "maxRows" | "rowExpansionBaseCost" | "startingColumns" | "startingRows"> & {
  maxRows?: number;
  rowExpansionBaseCost?: number;
  startingColumns?: number;
  startingRows?: number;
}): LevelDefinition {
  return {
    maxRows: BASE_BOARD_ROWS,
    rowExpansionBaseCost: 96,
    startingColumns: BASE_BOARD_COLUMNS,
    startingRows: BASE_BOARD_ROWS,
    ...data
  };
}

export const levels: LevelDefinition[] = [
  level({
    availableTileIds: getAvailableTileIdsForDay(1),
    blockedCellIds: mergeBlockedCellIds([]),
    goals: [{ target: 2200, type: "end_coins" }],
    id: "day-01",
    kind: "campaign",
    startingCoins: 24,
    title: "First Shift"
  }),
  level({
    availableTileIds: getAvailableTileIdsForDay(2),
    blockedCellIds: mergeBlockedCellIds(["A5"]),
    goals: [{ target: 3200, type: "end_coins" }],
    id: "day-02",
    kind: "campaign",
    startingCoins: 24,
    title: "Cross Current"
  }),
  level({
    availableTileIds: getAvailableTileIdsForDay(3),
    blockedCellIds: mergeBlockedCellIds(["D2"]),
    goals: [{ target: 5200, type: "end_coins" }],
    id: "day-03",
    kind: "campaign",
    startingCoins: 30,
    title: "Rich Vein"
  }),
  level({
    availableTileIds: getAvailableTileIdsForDay(4),
    blockedCellIds: mergeBlockedCellIds(["A3", "F2"]),
    goals: [{ target: 8200, type: "end_coins" }],
    id: "day-04",
    kind: "campaign",
    startingCoins: 34,
    title: "Double Shift"
  }),
  level({
    availableTileIds: getAvailableTileIdsForDay(5),
    blockedCellIds: mergeBlockedCellIds(["B5", "D2", "E6"]),
    goals: [
      { target: 12000, type: "end_coins" },
      { target: 22, type: "end_income" }
    ],
    id: "day-05",
    kind: "campaign",
    maxRows: 8,
    rowExpansionBaseCost: 96,
    startingCoins: 42,
    title: "Triple Lane"
  }),
  level({
    availableTileIds: getAvailableTileIdsForDay(6),
    blockedCellIds: mergeBlockedCellIds(["A2", "F6"]),
    goals: [{ target: 18000, type: "end_coins" }],
    id: "day-06",
    kind: "campaign",
    maxRows: 8,
    rowExpansionBaseCost: 112,
    startingCoins: 48,
    title: "Stored Value"
  }),
  level({
    availableTileIds: getAvailableTileIdsForDay(7),
    blockedCellIds: mergeBlockedCellIds(["A6", "C2", "F4"]),
    goals: [{ target: 34, type: "end_income" }],
    id: "day-07",
    kind: "campaign",
    maxRows: 8,
    rowExpansionBaseCost: 128,
    startingCoins: 52,
    title: "Timed Release"
  }),
  level({
    availableTileIds: getAvailableTileIdsForDay(8),
    blockedCellIds: mergeBlockedCellIds(["A4", "D2", "E6"]),
    goals: [
      { target: 26000, type: "end_coins" },
      { target: 46, type: "end_income" }
    ],
    id: "day-08",
    kind: "campaign",
    maxRows: 8,
    rowExpansionBaseCost: 144,
    startingCoins: 56,
    title: "Routed Flow"
  }),
  level({
    availableTileIds: getAvailableTileIdsForDay(9),
    blockedCellIds: mergeBlockedCellIds(["A5", "C2", "F6"]),
    goals: [{ target: 38000, type: "end_coins" }],
    id: "day-09",
    kind: "campaign",
    maxRows: 8,
    rowExpansionBaseCost: 160,
    startingCoins: 60,
    title: "Forked Lines"
  }),
  level({
    availableTileIds: getAvailableTileIdsForDay(10),
    blockedCellIds: mergeBlockedCellIds(["A3", "C6", "E2", "F5"]),
    goals: [
      { target: 52000, type: "end_coins" },
      { target: 64, type: "end_income" }
    ],
    id: "day-10",
    kind: "campaign",
    maxRows: 8,
    rowExpansionBaseCost: 180,
    startingCoins: 64,
    title: "Cluster Debt"
  }),
  level({
    availableTileIds: getAvailableTileIdsForDay(11),
    blockedCellIds: mergeBlockedCellIds(["B6", "D2", "E5"]),
    goals: [{ target: 76000, type: "end_coins" }],
    id: "day-11",
    kind: "campaign",
    maxRows: 9,
    rowExpansionBaseCost: 210,
    startingCoins: 70,
    title: "Edge Rent"
  }),
  level({
    availableTileIds: getAvailableTileIdsForDay(12),
    blockedCellIds: mergeBlockedCellIds(["A4", "B2", "D5", "F6"]),
    goals: [{ target: 110, type: "end_income" }],
    id: "day-12",
    kind: "campaign",
    maxRows: 9,
    rowExpansionBaseCost: 240,
    startingCoins: 76,
    title: "Hard Corners"
  }),
  level({
    availableTileIds: getAvailableTileIdsForDay(13),
    blockedCellIds: mergeBlockedCellIds(["B6", "D3", "E5", "F2"]),
    goals: [{ target: 120000, type: "end_coins" }],
    id: "day-13",
    kind: "campaign",
    maxRows: 9,
    rowExpansionBaseCost: 280,
    startingCoins: 84,
    title: "Risk Rent"
  }),
  level({
    availableTileIds: getAvailableTileIdsForDay(14),
    blockedCellIds: mergeBlockedCellIds(["A2", "B5", "D2", "E6", "G3"]),
    goals: [{ target: 180, type: "end_income" }],
    id: "day-14",
    kind: "campaign",
    maxRows: 9,
    rowExpansionBaseCost: 320,
    startingCoins: 92,
    title: "Exact Layout"
  }),
  level({
    availableTileIds: getAvailableTileIdsForDay(15),
    blockedCellIds: mergeBlockedCellIds(["A3", "B5", "D2", "E6", "F4"]),
    goals: [
      { target: 220000, type: "end_coins" },
      { target: 260, type: "end_income" }
    ],
    id: "day-15",
    kind: "campaign",
    maxRows: 9,
    rowExpansionBaseCost: 380,
    startingCoins: 104,
    title: "Vault Door"
  }),
  level({
    availableTileIds: getAvailableTileIdsForDay(16),
    blockedCellIds: mergeBlockedCellIds(["A2", "B5", "D2", "E6"]),
    goals: [{ target: 340000, type: "end_coins" }],
    id: "day-16",
    kind: "campaign",
    maxRows: 10,
    rowExpansionBaseCost: 440,
    startingCoins: 116,
    title: "New Ground"
  }),
  level({
    availableTileIds: getAvailableTileIdsForDay(17),
    blockedCellIds: mergeBlockedCellIds(["A4", "B2", "D5", "F6", "G3"]),
    goals: [
      { target: 520000, type: "end_coins" },
      { target: 420, type: "end_income" }
    ],
    id: "day-17",
    kind: "campaign",
    maxRows: 10,
    rowExpansionBaseCost: 520,
    startingCoins: 128,
    title: "Broker Row"
  }),
  level({
    availableTileIds: getAvailableTileIdsForDay(18),
    blockedCellIds: mergeBlockedCellIds(["A5", "C2", "D6", "F3", "G5"]),
    goals: [{ target: 780, type: "end_income" }],
    id: "day-18",
    kind: "campaign",
    maxRows: 10,
    rowExpansionBaseCost: 620,
    startingCoins: 144,
    title: "Clean Sweep"
  }),
  level({
    availableTileIds: getAvailableTileIdsForDay(19),
    blockedCellIds: mergeBlockedCellIds(["B6", "C2", "E5", "F3"]),
    goals: [{ target: 900000, type: "end_coins" }],
    id: "day-19",
    kind: "campaign",
    maxRows: 11,
    rowExpansionBaseCost: 760,
    startingCoins: 160,
    title: "Slow Burn"
  }),
  level({
    availableTileIds: getAvailableTileIdsForDay(20),
    blockedCellIds: mergeBlockedCellIds(["A2", "B5", "D2", "F6", "G4"]),
    goals: [
      { target: 1500000, type: "end_coins" },
      { target: 1600, type: "end_income" }
    ],
    id: "day-20",
    kind: "campaign",
    maxRows: 11,
    rowExpansionBaseCost: 920,
    startingCoins: 176,
    title: "Maintenance Window"
  }),
  level({
    availableTileIds: getAvailableTileIdsForDay(21),
    blockedCellIds: mergeBlockedCellIds(["A4", "B2", "D5", "E3", "G6"]),
    goals: [{ target: 3200, type: "end_income" }],
    id: "day-21",
    kind: "campaign",
    maxRows: 11,
    rowExpansionBaseCost: 1120,
    startingCoins: 192,
    title: "Cash Tide"
  }),
  level({
    availableTileIds: getAvailableTileIdsForDay(22),
    blockedCellIds: mergeBlockedCellIds(["A3", "B6", "D2", "E5", "F4", "G2"]),
    goals: [
      { target: 2800000, type: "end_coins" },
      { target: 4800, type: "end_income" }
    ],
    id: "day-22",
    kind: "campaign",
    maxRows: 12,
    rowExpansionBaseCost: 1360,
    startingCoins: 208,
    title: "Anchor Point"
  }),
  level({
    availableTileIds: getAvailableTileIdsForDay(23),
    blockedCellIds: mergeBlockedCellIds(["A5", "B3", "D6", "E2", "F5", "G4"]),
    goals: [{ target: 5400000, type: "end_coins" }],
    id: "day-23",
    kind: "campaign",
    maxRows: 12,
    rowExpansionBaseCost: 1680,
    startingCoins: 228,
    title: "Wide Ledger"
  }),
  level({
    availableTileIds: getAvailableTileIdsForDay(24),
    blockedCellIds: mergeBlockedCellIds(["A2", "B5", "C3", "E6", "F2", "G5"]),
    goals: [{ target: 12000, type: "end_income" }],
    id: "day-24",
    kind: "campaign",
    maxRows: 12,
    rowExpansionBaseCost: 2040,
    startingCoins: 252,
    title: "Foundry Pace"
  }),
  level({
    availableTileIds: getAvailableTileIdsForDay(25),
    blockedCellIds: mergeBlockedCellIds(["A3", "B5", "C2", "D6", "E4", "F2", "G5"]),
    goals: [
      { target: 12000000, type: "end_coins" },
      { target: 22000, type: "end_income" }
    ],
    id: "day-25",
    kind: "campaign",
    maxRows: MAX_BOARD_ROWS,
    rowExpansionBaseCost: 2600,
    startingCoins: 280,
    title: "Last Bell"
  })
];

export function describeGoal(goal: DayGoal): string {
  switch (goal.type) {
    case "end_coins":
      return `End with ${formatCompactNumber(goal.target)} coins`;
    case "end_income":
      return `End at ${formatCompactNumber(goal.target)}/s`;
  }
}

export function describeGoals(goals: DayGoal[]): string {
  return goals.map((goal) => describeGoal(goal)).join(" + ");
}

export function formatGoalSummaryShort(goals: DayGoal[]): string {
  return goals
    .map((goal) => {
      switch (goal.type) {
        case "end_coins":
          return formatCompactNumber(goal.target);
        case "end_income":
          return `${formatCompactNumber(goal.target)}/s`;
      }
    })
    .join(" + ");
}

export function formatGoalProgress(goals: DayGoal[], metrics: LevelProgressMetrics): string {
  return goals
    .map((goal) => {
      switch (goal.type) {
        case "end_coins":
          return `Coins ${formatCompactNumber(metrics.coins)}/${formatCompactNumber(goal.target)}`;
        case "end_income":
          return `Pace ${formatCompactNumber(metrics.incomePerSecond)}/${formatCompactNumber(goal.target)}/s`;
      }
    })
    .join(" / ");
}

export function formatGoalPace(goals: DayGoal[], metrics: LevelProgressMetrics): string {
  const paceNotes = goals.flatMap((goal) => {
    switch (goal.type) {
      case "end_coins": {
        const projectedEndCoins =
          metrics.coins + Math.max(0, metrics.incomePerSecond) * metrics.remainingCycles;
        const shortfall = goal.target - projectedEndCoins;

        if (shortfall <= 0) {
          return ["On pace for cash."];
        }

        return [`Need ${formatCompactNumber(shortfall)} more by dusk.`];
      }
      case "end_income": {
        const shortfall = goal.target - metrics.incomePerSecond;

        if (shortfall <= 0) {
          return ["Income target locked."];
        }

        return [`Need +${formatCompactNumber(shortfall)}/s.`];
      }
    }
  });

  return paceNotes.join(" ");
}

export function areGoalsMet(goals: DayGoal[], metrics: LevelProgressMetrics): boolean {
  return goals.every((goal) => {
    switch (goal.type) {
      case "end_coins":
        return metrics.coins >= goal.target;
      case "end_income":
        return metrics.incomePerSecond >= goal.target;
    }
  });
}
