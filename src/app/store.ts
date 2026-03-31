import {
  allBoardCells,
  BASE_BOARD_COLUMNS,
  BASE_BOARD_ROWS,
  MAX_EXPANSIONS_PER_SIDE,
  MAX_TOTAL_EXPANSIONS,
  createBoardBounds,
  createBoardExpansionCounts,
  createCellId,
  defaultFocusCellId,
  getBoardCellLabel,
  getBoardDimensions,
  getBoardLayout,
  getExpansionCountsFromBounds,
  getTotalExpansions,
  isCellWithinBounds,
  normalizeBoardCellId
} from "../game/boardLayout";
import {
  DAY_DURATION_SECONDS,
  formatElapsedDayClock,
  formatRemainingDayClock,
  getRemainingDaySeconds,
  isDayComplete
} from "../game/dayClock";
import {
  applyDifficultyPriceMultiplier,
  getCampaignDifficulty,
  scaleGoalsForDifficulty,
  type CampaignDifficultyId
} from "../game/campaignDifficulties";
import {
  endlessDefinition,
  getEndlessPressureCost,
  getEndlessScore,
  type EndlessDefinition,
  type GameMode
} from "../game/endless";
import { formatCoins, formatCompactNumber } from "../game/formatting";
import {
  areGoalsMet,
  describeGoals,
  formatGoalPace,
  formatGoalProgress,
  formatGoalSummaryShort,
  getTileUnlockDay,
  levels,
  type LevelDefinition,
  type LevelRunState
} from "../game/levels";
import {
  canAffordTile,
  getDefaultTileProperties,
  getReleaseOptions,
  getScaledTilePrice,
  getTileDefinition,
  getTilePrices,
  getTileShortfall,
  supportsDirectionalOutput,
  supportsReleaseSetting
} from "../game/tileCatalog";
import {
  DEFAULT_TILE_TIER,
  getDecayTierConfig,
  getReleaseOptionsForTier,
  getTileUpgradeCost,
  MAX_TILE_TIER,
  normalizeTileTier
} from "../game/tileTiers";
import {
  resolveProductionCycle,
  type ProductionCycleResult
} from "../game/resolveProductionCycle";
import type {
  BoardBounds,
  BoardExpansionCounts,
  DecayValuesByCell,
  ExpansionSide,
  OutputDirection,
  PlacedTileCosts,
  PlacedTiles,
  ReleaseSeconds,
  SpeedMultiplier,
  StoredCoinsByCell,
  TileId,
  TilePriceMap,
  TileTiersByCell,
  TilePropertiesByCell
} from "../game/types";

type RunDefinition = EndlessDefinition | LevelDefinition;
type LevelFailReason = "goal_missed" | "stalled" | null;

export interface AppSnapshot {
  activeCycleFeedback: ProductionCycleResult | null;
  bestCycleIncome: number;
  boardBounds: BoardBounds;
  boardColumns: number;
  boardRows: number;
  campaignDifficultyId: CampaignDifficultyId | null;
  campaignDifficultyName: string | null;
  coins: number;
  completedCycles: number;
  currentLevel: RunDefinition;
  currentLevelIndex: number;
  cycle: number;
  dayClockLabel: string;
  dayGoalShortLabel: string;
  dayRemainingLabel: string;
  decayValues: DecayValuesByCell;
  endlessScore: number;
  expansionCounts: BoardExpansionCounts;
  focusedCellId: string | null;
  goalLabel: string;
  goalPaceLabel: string;
  goalProgressLabel: string;
  hasNextLevel: boolean;
  hoveredTileId: TileId | null;
  inspectedCellId: string | null;
  lastCycleIncome: number | null;
  lastCycleResult: ProductionCycleResult | null;
  lastResolvedCycle: number | null;
  levelFailReason: LevelFailReason;
  levelRunState: LevelRunState;
  mode: GameMode;
  nextExpansionCost: number | null;
  placedTileCosts: PlacedTileCosts;
  placedTiles: PlacedTiles;
  pressureCost: number;
  projectedIncome: number;
  rememberedSpeedMultiplier: Exclude<SpeedMultiplier, 0>;
  selectedTileId: TileId | null;
  showGoalPrediction: boolean;
  skipDayAvailable: boolean;
  speedMultiplier: SpeedMultiplier;
  statusMessage: string;
  storedCoins: StoredCoinsByCell;
  tilePrices: TilePriceMap;
  tileTiersByCell: TileTiersByCell;
  tilePropertiesByCell: TilePropertiesByCell;
  totalCoinsEarned: number;
}

export interface AppStore {
  buyExpansion: (side: ExpansionSide) => void;
  focusCell: (cellId: string) => void;
  getSnapshot: () => AppSnapshot;
  hoverTile: (tileId: TileId | null) => void;
  loadSnapshot: (snapshot: unknown) => boolean;
  nextLevel: () => void;
  placeSelectedTile: (cellId: string) => void;
  reset: () => void;
  retryLevel: () => void;
  sellTile: (cellId: string) => void;
  selectTile: (tileId: TileId) => void;
  setFocusedTileDirection: (direction: OutputDirection) => void;
  setFocusedTileReleaseSeconds: (releaseSeconds: ReleaseSeconds) => void;
  skipDay: () => void;
  upgradeFocusedTile: () => void;
  setSpeed: (speed: SpeedMultiplier) => void;
  setTimeActive: (active: boolean) => void;
  startMode: (mode: GameMode, difficultyId?: CampaignDifficultyId) => void;
  subscribe: (listener: (snapshot: AppSnapshot) => void) => () => void;
  togglePause: () => void;
}

const FEEDBACK_DURATION_MS = 1050;
const LEVEL_ADVANCE_DELAY_MS = 900;
const BASE_TICK_MS = 1000;
const boardCellIds = new Set(allBoardCells.map((cell) => cell.id));

function isCampaignRun(run: RunDefinition): run is LevelDefinition {
  return run.kind === "campaign";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isTileId(value: unknown): value is TileId {
  return (
    value === "anchor" ||
    value === "bank" ||
    value === "booster" ||
    value === "chain" ||
    value === "cleaner" ||
    value === "corner" ||
    value === "decay" ||
    value === "doubler" ||
    value === "edge" ||
    value === "investment" ||
    value === "miner" ||
    value === "relay" ||
    value === "rich_miner" ||
    value === "risk" ||
    value === "splitter" ||
    value === "tripler" ||
    value === "vault"
  );
}

function isSpeedMultiplier(value: unknown): value is SpeedMultiplier {
  return value === 0 || value === 0.5 || value === 1 || value === 2 || value === 3;
}

function isOutputDirection(value: unknown): value is OutputDirection {
  return value === "up" || value === "right" || value === "down" || value === "left" || value === "none";
}

function isReleaseSeconds(value: unknown): value is ReleaseSeconds {
  return value === 10 || value === 20 || value === 40 || value === 80;
}

function toNonNegativeInt(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.floor(value))
    : fallback;
}

function toNullableNonNegativeInt(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.floor(value))
    : null;
}

function toCycleNumber(value: unknown, fallback = 1): number {
  return Math.max(1, toNonNegativeInt(value, fallback));
}

function getCompletedCycles(snapshot: AppSnapshot): number {
  return snapshot.lastResolvedCycle ?? 0;
}

function getProjectedMetrics(
  snapshot: AppSnapshot,
  completedCycles: number,
  projectedIncome: number
) {
  return {
    coins: snapshot.coins,
    completedCycles,
    incomePerSecond: projectedIncome,
    remainingCycles: getRemainingDaySeconds(completedCycles)
  };
}

function getGoalLabel(snapshot: AppSnapshot): string {
  if (snapshot.mode === "endless" || !isCampaignRun(snapshot.currentLevel)) {
    return "Keep scaling before upkeep catches up.";
  }

  return describeGoals(snapshot.currentLevel.goals);
}

function getDayGoalShortLabel(snapshot: AppSnapshot): string {
  if (snapshot.mode === "endless" || !isCampaignRun(snapshot.currentLevel)) {
    return "Outlast upkeep";
  }

  return formatGoalSummaryShort(snapshot.currentLevel.goals);
}

function getGoalProgressLabel(
  snapshot: AppSnapshot,
  completedCycles: number,
  projectedIncome: number
): string {
  if (snapshot.mode === "endless" || !isCampaignRun(snapshot.currentLevel)) {
    return `Score ${formatCompactNumber(snapshot.endlessScore)} / Earned ${formatCompactNumber(snapshot.totalCoinsEarned)} / Upkeep ${formatCompactNumber(snapshot.pressureCost)}`;
  }

  return formatGoalProgress(
    snapshot.currentLevel.goals,
    getProjectedMetrics(snapshot, completedCycles, projectedIncome)
  );
}

function getGoalPaceLabel(
  snapshot: AppSnapshot,
  completedCycles: number,
  projectedIncome: number
): string {
  if (snapshot.mode === "endless" || !isCampaignRun(snapshot.currentLevel)) {
    return `Best +${formatCompactNumber(snapshot.bestCycleIncome)} / Upkeep -${formatCompactNumber(snapshot.pressureCost)}`;
  }

  if (!getCampaignDifficultyState(snapshot).showPrediction) {
    return "";
  }

  return formatGoalPace(
    snapshot.currentLevel.goals,
    getProjectedMetrics(snapshot, completedCycles, projectedIncome)
  );
}

function getInitialBoardBounds(run: RunDefinition): BoardBounds {
  return createBoardBounds(
    createBoardExpansionCounts(),
    run.startingRows,
    run.startingColumns
  );
}

function getInitialFocusCell(run: RunDefinition, boardBounds: BoardBounds): string {
  if (
    !run.blockedCellIds.includes(defaultFocusCellId) &&
    getBoardLayout(boardBounds).some((cell) => cell.id === defaultFocusCellId)
  ) {
    return defaultFocusCellId;
  }

  return (
    getBoardLayout(boardBounds).find((cell) => !run.blockedCellIds.includes(cell.id))?.id ??
    defaultFocusCellId
  );
}

function getPlacementFocusCell(
  run: RunDefinition,
  boardBounds: BoardBounds,
  placedTiles: PlacedTiles,
  preferredCellId: string | null
): string | null {
  const visibleCells = getBoardLayout(boardBounds);

  if (
    preferredCellId !== null &&
    isCellWithinBounds(preferredCellId, boardBounds) &&
    !run.blockedCellIds.includes(preferredCellId) &&
    !placedTiles[preferredCellId]
  ) {
    return preferredCellId;
  }

  return (
    visibleCells.find(
      (cell) => !run.blockedCellIds.includes(cell.id) && !placedTiles[cell.id]
    )?.id ?? null
  );
}

function getExpandedBounds(
  boardBounds: BoardBounds,
  side: ExpansionSide
): BoardBounds {
  switch (side) {
    case "top":
      return { ...boardBounds, minRow: boardBounds.minRow - 1 };
    case "right":
      return { ...boardBounds, maxColumn: boardBounds.maxColumn + 1 };
    case "bottom":
      return { ...boardBounds, maxRow: boardBounds.maxRow + 1 };
    case "left":
      return { ...boardBounds, minColumn: boardBounds.minColumn - 1 };
  }
}

function getExpansionEdgeCellIds(
  boardBounds: BoardBounds,
  side: ExpansionSide
): string[] {
  switch (side) {
    case "top":
      return Array.from(
        { length: boardBounds.maxColumn - boardBounds.minColumn + 1 },
        (_, index) => createCellId(boardBounds.minRow, boardBounds.minColumn + index)
      );
    case "right":
      return Array.from(
        { length: boardBounds.maxRow - boardBounds.minRow + 1 },
        (_, index) => createCellId(boardBounds.minRow + index, boardBounds.maxColumn)
      );
    case "bottom":
      return Array.from(
        { length: boardBounds.maxColumn - boardBounds.minColumn + 1 },
        (_, index) => createCellId(boardBounds.maxRow, boardBounds.minColumn + index)
      );
    case "left":
      return Array.from(
        { length: boardBounds.maxRow - boardBounds.minRow + 1 },
        (_, index) => createCellId(boardBounds.minRow + index, boardBounds.minColumn)
      );
  }
}

function getNewExpansionFocusCell(
  run: RunDefinition,
  boardBounds: BoardBounds,
  placedTiles: PlacedTiles,
  side: ExpansionSide
): string {
  const expandedBounds = getExpandedBounds(boardBounds, side);
  const newEdgeCells = getExpansionEdgeCellIds(expandedBounds, side);

  return (
    newEdgeCells.find(
      (cellId) => !run.blockedCellIds.includes(cellId) && !placedTiles[cellId]
    ) ?? getInitialFocusCell(run, expandedBounds)
  );
}

function getNextExpansionCost(
  run: RunDefinition,
  expansionCounts: BoardExpansionCounts
): number | null {
  if (getTotalExpansions(expansionCounts) >= MAX_TOTAL_EXPANSIONS) {
    return null;
  }

  return run.rowExpansionBaseCost * 2 ** getTotalExpansions(expansionCounts);
}

function canExpandSide(
  expansionCounts: BoardExpansionCounts,
  side: ExpansionSide
): boolean {
  return (
    expansionCounts[side] < MAX_EXPANSIONS_PER_SIDE &&
    getTotalExpansions(expansionCounts) < MAX_TOTAL_EXPANSIONS
  );
}

function getExpandedCounts(
  expansionCounts: BoardExpansionCounts,
  side: ExpansionSide
): BoardExpansionCounts {
  return {
    ...expansionCounts,
    [side]: expansionCounts[side] + 1
  };
}

function getSellableTileCount(placedTileCosts: PlacedTileCosts): number {
  return Object.keys(placedTileCosts).length;
}

function buildCampaignIntroMessage(levelIndex: number, level: LevelDefinition): string {
  return `Day ${levelIndex + 1} / ${level.title} / ${describeGoals(level.goals)} by 12:00.`;
}

function buildEndlessIntroMessage(): string {
  return "Endless / Build a board that can outrun upkeep.";
}

function getCampaignDifficultyId(snapshot: AppSnapshot): CampaignDifficultyId {
  return snapshot.campaignDifficultyId ?? "easy";
}

function getCampaignDifficultyState(snapshot: AppSnapshot) {
  return getCampaignDifficulty(getCampaignDifficultyId(snapshot));
}

function getEffectiveCampaignLevel(
  levelIndex: number,
  difficultyId: CampaignDifficultyId
): LevelDefinition {
  const baselineLevel = levels[levelIndex];
  const difficulty = getCampaignDifficulty(difficultyId);

  return {
    ...baselineLevel,
    goals: scaleGoalsForDifficulty(
      baselineLevel.goals,
      difficultyId,
      levelIndex + 1
    ),
    rowExpansionBaseCost: applyDifficultyPriceMultiplier(
      baselineLevel.rowExpansionBaseCost,
      difficulty.expansionCostMultiplier
    )
  };
}

function getTileCostMultiplier(snapshot: AppSnapshot): number {
  if (snapshot.mode !== "campaign") {
    return 1;
  }

  return getCampaignDifficultyState(snapshot).tileCostMultiplier;
}

function getUpgradeCostMultiplier(snapshot: AppSnapshot): number {
  if (snapshot.mode !== "campaign") {
    return 1;
  }

  return getCampaignDifficultyState(snapshot).upgradeCostMultiplier;
}

function canSkipDay(snapshot: AppSnapshot, completedCycles = getCompletedCycles(snapshot)): boolean {
  return (
    snapshot.mode === "campaign" &&
    snapshot.levelRunState === "playing" &&
    getRemainingDaySeconds(completedCycles) <= 10
  );
}

function buildWinMessage(snapshot: AppSnapshot): string {
  if (snapshot.levelRunState === "set_complete") {
    return "Day 25 clear / Normal mode finished.";
  }

  return `Day ${snapshot.currentLevelIndex + 1} clear / Loading day ${snapshot.currentLevelIndex + 2}...`;
}

function buildFailMessage(snapshot: AppSnapshot): string {
  if (snapshot.mode === "endless") {
    return `Endless over / Score ${formatCompactNumber(snapshot.endlessScore)} / Cycles ${snapshot.completedCycles} / Best +${formatCompactNumber(snapshot.bestCycleIncome)}`;
  }

  if (snapshot.levelFailReason === "goal_missed") {
    return `Day ${snapshot.currentLevelIndex + 1} failed / Goals missed at 12:00.`;
  }

  return `Day ${snapshot.currentLevelIndex + 1} failed / Retry this board.`;
}

function buildCycleStatusMessage(
  mode: GameMode,
  cycleNumber: number,
  result: ProductionCycleResult,
  nextCoins: number,
  pressureCost: number
): string {
  const orderedTiles: TileId[] = [
    "miner",
    "rich_miner",
    "chain",
    "edge",
    "corner",
    "risk",
    "decay",
    "splitter",
    "investment",
    "bank",
    "vault",
    "relay",
    "anchor"
  ];
  const shortLabels: Record<TileId, string> = {
    anchor: "Anchor",
    bank: "Bank",
    booster: "Boost",
    chain: "Chain",
    cleaner: "Clean",
    corner: "Corner",
    decay: "Decay",
    doubler: "Double",
    edge: "Edge",
    investment: "Invest",
    miner: "Miner",
    relay: "Relay",
    rich_miner: "Rich",
    risk: "Risk",
    splitter: "Split",
    tripler: "Triple",
    vault: "Vault"
  };

  const detailParts = orderedTiles
    .map((tileId) => {
      const total = result.tileTotals[tileId] ?? 0;
      return total > 0 ? `${shortLabels[tileId]} ${formatCompactNumber(total)}` : "";
    })
    .filter(Boolean)
    .slice(0, 4);

  const storedParts = result.storageDetails
    .flatMap((detail) => {
      if (detail.releasedCoins > 0) {
        return [
          `${detail.tileId === "vault" ? "Vault" : "Bank"} out ${formatCompactNumber(detail.releasedCoins)}`
        ];
      }

      if (detail.depositedCoins > 0 || detail.interestCoins > 0) {
        return [
          `${detail.tileId === "investment" ? "Invest" : detail.tileId === "vault" ? "Vault" : "Bank"} ${formatCompactNumber(detail.storedAfter)} stored`
        ];
      }

      return [];
    })
    .slice(0, 2);

  const parts = [
    `Cycle ${cycleNumber} / +${formatCompactNumber(result.earnedCoins)}`,
    [...detailParts, ...storedParts].join(", "),
    mode === "endless" && pressureCost > 0 ? `Upkeep -${formatCompactNumber(pressureCost)}` : "",
    `${formatCoins(nextCoins)} total`
  ].filter(Boolean);

  return parts.join(" / ");
}

function createBaseSnapshot(
  mode: GameMode,
  currentLevel: RunDefinition,
  currentLevelIndex: number,
  statusMessage: string,
  campaignDifficultyId: CampaignDifficultyId | null = null
): AppSnapshot {
  const boardBounds = getInitialBoardBounds(currentLevel);
  const expansionCounts = createBoardExpansionCounts();
  const boardDimensions = getBoardDimensions(boardBounds);
  const campaignDifficulty =
    mode === "campaign" && campaignDifficultyId
      ? getCampaignDifficulty(campaignDifficultyId)
      : null;

  return withDerivedLevelState({
    activeCycleFeedback: null,
    bestCycleIncome: 0,
    boardBounds,
    boardColumns: boardDimensions.columns,
    boardRows: boardDimensions.rows,
    campaignDifficultyId,
    campaignDifficultyName: campaignDifficulty?.name ?? null,
    coins: currentLevel.startingCoins,
    completedCycles: 0,
    currentLevel,
    currentLevelIndex,
    cycle: 1,
    dayClockLabel: "0:00",
    dayGoalShortLabel: "",
    dayRemainingLabel: "12:00",
    decayValues: {},
    endlessScore: 0,
    expansionCounts,
    focusedCellId: getInitialFocusCell(currentLevel, boardBounds),
    goalLabel: "",
    goalPaceLabel: "",
    goalProgressLabel: "",
    hasNextLevel: false,
    hoveredTileId: null,
    inspectedCellId: null,
    lastCycleIncome: null,
    lastCycleResult: null,
    lastResolvedCycle: null,
    levelFailReason: null,
    levelRunState: "playing",
    mode,
    nextExpansionCost: getNextExpansionCost(currentLevel, expansionCounts),
    placedTileCosts: {},
    placedTiles: {},
    pressureCost: mode === "endless" ? getEndlessPressureCost(1) : 0,
    projectedIncome: 0,
    rememberedSpeedMultiplier: 1,
    selectedTileId: null,
    showGoalPrediction: campaignDifficulty?.showPrediction ?? false,
    skipDayAvailable: false,
    speedMultiplier: 1,
    statusMessage,
    storedCoins: {},
    tilePrices: getTilePrices({}, campaignDifficulty?.tileCostMultiplier ?? 1),
    tileTiersByCell: {},
    tilePropertiesByCell: {},
    totalCoinsEarned: 0
  });
}

function buildCampaignSnapshot(
  levelIndex: number,
  difficultyId: CampaignDifficultyId = "easy"
): AppSnapshot {
  const level = getEffectiveCampaignLevel(levelIndex, difficultyId);
  const difficulty = getCampaignDifficulty(difficultyId);

  return createBaseSnapshot(
    "campaign",
    level,
    levelIndex,
    `${difficulty.name} / ${buildCampaignIntroMessage(levelIndex, level)}`,
    difficultyId
  );
}

function buildEndlessSnapshot(): AppSnapshot {
  return createBaseSnapshot("endless", endlessDefinition, 0, buildEndlessIntroMessage());
}

function isTileUnlockedForRun(run: RunDefinition, tileId: TileId): boolean {
  return run.availableTileIds.includes(tileId);
}

function buildNextCampaignDaySnapshot(currentSnapshot: AppSnapshot): AppSnapshot {
  const difficultyId = getCampaignDifficultyId(currentSnapshot);
  const difficulty = getCampaignDifficulty(difficultyId);
  const nextLevelIndex = Math.min(levels.length - 1, currentSnapshot.currentLevelIndex + 1);
  const nextLevel = getEffectiveCampaignLevel(nextLevelIndex, difficultyId);

  return withDerivedLevelState({
    ...currentSnapshot,
    activeCycleFeedback: null,
    coins: difficulty.keepMoneyBetweenDays ? currentSnapshot.coins : 0,
    campaignDifficultyId: difficultyId,
    campaignDifficultyName: difficulty.name,
    currentLevel: nextLevel,
    currentLevelIndex: nextLevelIndex,
    cycle: 1,
    focusedCellId: getPlacementFocusCell(
      nextLevel,
      currentSnapshot.boardBounds,
      currentSnapshot.placedTiles,
      currentSnapshot.focusedCellId
    ),
    hoveredTileId: null,
    inspectedCellId: null,
    lastCycleIncome: null,
    lastCycleResult: null,
    lastResolvedCycle: null,
    levelFailReason: null,
    selectedTileId: null,
    statusMessage: `${difficulty.name} / ${buildCampaignIntroMessage(nextLevelIndex, nextLevel)}`
  });
}

function withDerivedLevelState(snapshot: AppSnapshot): AppSnapshot {
  const completedCycles = getCompletedCycles(snapshot);
  const boardCells = getBoardLayout(snapshot.boardBounds);
  const boardDimensions = getBoardDimensions(snapshot.boardBounds);
  const blockedCellIds = new Set(snapshot.currentLevel.blockedCellIds);
  const difficultyState =
    snapshot.mode === "campaign" ? getCampaignDifficultyState(snapshot) : null;
  const expansionCounts = getExpansionCountsFromBounds(
    snapshot.boardBounds,
    snapshot.currentLevel.startingRows,
    snapshot.currentLevel.startingColumns
  );
  const tilePrices = getTilePrices(
    snapshot.placedTiles,
    difficultyState?.tileCostMultiplier ?? 1
  );
  const hasOpenPlacement = boardCells.some((cell) => {
    return !blockedCellIds.has(cell.id) && !snapshot.placedTiles[cell.id];
  });
  const hasAffordableTile = snapshot.currentLevel.availableTileIds.some((tileId) =>
    tilePrices[tileId] <= snapshot.coins
  );
  const canPlaceAnyTileNow = hasOpenPlacement && hasAffordableTile;
  const hasSellableTile = getSellableTileCount(snapshot.placedTileCosts) > 0;
  const pressureCost =
    snapshot.mode === "endless" ? getEndlessPressureCost(snapshot.cycle) : 0;
  const projectedCycle = resolveProductionCycle(
    snapshot.placedTiles,
    snapshot.storedCoins,
    snapshot.cycle,
    {
      boardBounds: snapshot.boardBounds,
      coins: snapshot.coins,
      decayValues: snapshot.decayValues,
      tileTiersByCell: snapshot.tileTiersByCell,
      tilePropertiesByCell: snapshot.tilePropertiesByCell
    }
  );
  const projectedNetPerCycle =
    snapshot.mode === "endless"
      ? projectedCycle.earnedCoins - pressureCost
      : projectedCycle.earnedCoins;
  const projectedIncome = projectedNetPerCycle;
  const isCampaignDayOver =
    snapshot.mode === "campaign" &&
    isCampaignRun(snapshot.currentLevel) &&
    isDayComplete(completedCycles);

  let levelRunState: LevelRunState = "playing";
  let levelFailReason: LevelFailReason = null;

  if (snapshot.mode === "campaign" && isCampaignRun(snapshot.currentLevel)) {
    const goalReached = areGoalsMet(
      snapshot.currentLevel.goals,
      getProjectedMetrics(snapshot, completedCycles, projectedIncome)
    );

    if (isCampaignDayOver && goalReached) {
      levelRunState =
        snapshot.currentLevelIndex === levels.length - 1 ? "set_complete" : "won";
    } else if (isCampaignDayOver) {
      levelRunState = "failed";
      levelFailReason = "goal_missed";
    }
  } else if (!canPlaceAnyTileNow && !hasSellableTile && projectedNetPerCycle <= 0) {
    levelRunState = "failed";
    levelFailReason = "stalled";
  }

  const endlessScore = getEndlessScore(
    snapshot.totalCoinsEarned,
    snapshot.bestCycleIncome,
    completedCycles,
    expansionCounts
  );
  const nextExpansionCost = getNextExpansionCost(snapshot.currentLevel, expansionCounts);
  const selectedTileId = snapshot.selectedTileId;
  const inspectedCellId =
    snapshot.inspectedCellId !== null &&
    isCellWithinBounds(snapshot.inspectedCellId, snapshot.boardBounds) &&
    snapshot.placedTiles[snapshot.inspectedCellId]
      ? snapshot.inspectedCellId
      : null;

  return {
    ...snapshot,
    boardColumns: boardDimensions.columns,
    boardRows: boardDimensions.rows,
    campaignDifficultyId:
      snapshot.mode === "campaign" ? getCampaignDifficultyId(snapshot) : null,
    campaignDifficultyName: difficultyState?.name ?? null,
    completedCycles,
    dayClockLabel:
      snapshot.mode === "campaign"
        ? formatElapsedDayClock(completedCycles)
        : `Cycle ${completedCycles}`,
    dayGoalShortLabel: getDayGoalShortLabel(snapshot),
    dayRemainingLabel:
      snapshot.mode === "campaign" ? formatRemainingDayClock(completedCycles) : "",
    endlessScore,
    goalLabel: getGoalLabel({ ...snapshot, completedCycles, endlessScore }),
    goalPaceLabel: getGoalPaceLabel(
      { ...snapshot, completedCycles, endlessScore, pressureCost },
      completedCycles,
      projectedIncome
    ),
    goalProgressLabel: getGoalProgressLabel(
      { ...snapshot, completedCycles, endlessScore, pressureCost },
      completedCycles,
      projectedIncome
    ),
    expansionCounts,
    hasNextLevel:
      snapshot.mode === "campaign" && snapshot.currentLevelIndex < levels.length - 1,
    inspectedCellId,
    levelFailReason,
    levelRunState,
    nextExpansionCost,
    pressureCost,
    projectedIncome,
    selectedTileId,
    showGoalPrediction: difficultyState?.showPrediction ?? false,
    skipDayAvailable: canSkipDay(snapshot, completedCycles),
    tilePrices
  };
}

function sanitizePlacedTiles(
  value: unknown,
  currentLevel: RunDefinition,
  boardBounds: BoardBounds
): PlacedTiles {
  if (!isRecord(value)) {
    return {};
  }

  const visibleCellIds = new Set(getBoardLayout(boardBounds).map((cell) => cell.id));
  const availableTileIds = new Set(currentLevel.availableTileIds);
  const placedTiles: PlacedTiles = {};

  Object.entries(value).forEach(([rawCellId, tileId]) => {
    const cellId = normalizeBoardCellId(rawCellId);

    if (!cellId || !visibleCellIds.has(cellId) || !isTileId(tileId) || !availableTileIds.has(tileId)) {
      return;
    }

    if (currentLevel.blockedCellIds.includes(cellId)) {
      return;
    }

    placedTiles[cellId] = tileId;
  });

  return placedTiles;
}

function sanitizePlacedTileCosts(value: unknown, placedTiles: PlacedTiles): PlacedTileCosts {
  if (!isRecord(value)) {
    return {};
  }

  const placedTileCosts: PlacedTileCosts = {};

  Object.entries(value).forEach(([rawCellId, paidPrice]) => {
    const cellId = normalizeBoardCellId(rawCellId);

    if (!cellId) {
      return;
    }

    if (!placedTiles[cellId]) {
      return;
    }

    placedTileCosts[cellId] = toNonNegativeInt(paidPrice);
  });

  return placedTileCosts;
}

function sanitizeTileTiersByCell(value: unknown, placedTiles: PlacedTiles): TileTiersByCell {
  if (!isRecord(value)) {
    return {};
  }

  const nextTileTiers: TileTiersByCell = {};

  Object.entries(value).forEach(([rawCellId, tierValue]) => {
    const cellId = normalizeBoardCellId(rawCellId);

    if (!cellId || !placedTiles[cellId]) {
      return;
    }

    nextTileTiers[cellId] = normalizeTileTier(
      typeof tierValue === "number" ? tierValue : DEFAULT_TILE_TIER
    );
  });

  return nextTileTiers;
}

function sanitizeStoredCoins(value: unknown, placedTiles: PlacedTiles): StoredCoinsByCell {
  if (!isRecord(value)) {
    return {};
  }

  const nextStoredCoins: StoredCoinsByCell = {};

  Object.entries(value).forEach(([rawCellId, storedValue]) => {
    const cellId = normalizeBoardCellId(rawCellId);

    if (!cellId) {
      return;
    }

    const tileId = placedTiles[cellId];

    if (tileId !== "bank" && tileId !== "investment" && tileId !== "vault") {
      return;
    }

    nextStoredCoins[cellId] = toNonNegativeInt(storedValue);
  });

  return nextStoredCoins;
}

function sanitizeDecayValues(
  value: unknown,
  placedTiles: PlacedTiles,
  tileTiersByCell: TileTiersByCell
): DecayValuesByCell {
  if (!isRecord(value)) {
    return {};
  }

  const nextDecayValues: DecayValuesByCell = {};

  Object.entries(value).forEach(([rawCellId, decayValue]) => {
    const cellId = normalizeBoardCellId(rawCellId);

    if (!cellId) {
      return;
    }

    if (placedTiles[cellId] !== "decay") {
      return;
    }

    const tier = tileTiersByCell[cellId] ?? DEFAULT_TILE_TIER;
    nextDecayValues[cellId] = toNonNegativeInt(decayValue, getDecayTierConfig(tier).startingOutput);
  });

  return nextDecayValues;
}

function sanitizeTilePropertiesByCell(
  value: unknown,
  placedTiles: PlacedTiles,
  tileTiersByCell: TileTiersByCell
): TilePropertiesByCell {
  if (!isRecord(value)) {
    return {};
  }

  const nextTileProperties: TilePropertiesByCell = {};

  Object.entries(value).forEach(([rawCellId, rawProperties]) => {
    const cellId = normalizeBoardCellId(rawCellId);

    if (!cellId) {
      return;
    }

    const tileId = placedTiles[cellId];

    if (!tileId || !isRecord(rawProperties)) {
      return;
    }

    const tier = tileTiersByCell[cellId] ?? DEFAULT_TILE_TIER;
    const defaultProperties = getDefaultTileProperties(tileId, tier);
    const direction = isOutputDirection(rawProperties.direction)
      ? rawProperties.direction
      : defaultProperties.direction;
    const releaseSeconds = isReleaseSeconds(rawProperties.releaseSeconds)
      ? rawProperties.releaseSeconds
      : defaultProperties.releaseSeconds;
    const validReleaseOptions =
      tileId === "bank" || tileId === "vault"
        ? getReleaseOptionsForTier(tileId, tier)
        : getReleaseOptions(tileId, tier);

    nextTileProperties[cellId] = {
      direction: supportsDirectionalOutput(tileId) ? direction : "none",
      releaseSeconds:
        supportsReleaseSetting(tileId) && releaseSeconds !== undefined && validReleaseOptions.includes(releaseSeconds)
          ? releaseSeconds
          : supportsReleaseSetting(tileId)
            ? defaultProperties.releaseSeconds
            : undefined
    };
  });

  return nextTileProperties;
}

function sanitizeBoardBounds(
  value: unknown,
  currentLevel: RunDefinition
): BoardBounds {
  if (
    isRecord(value) &&
    typeof value.minRow === "number" &&
    typeof value.maxRow === "number" &&
    typeof value.minColumn === "number" &&
    typeof value.maxColumn === "number"
  ) {
    const rawBounds: BoardBounds = {
      maxColumn: Math.floor(value.maxColumn),
      maxRow: Math.floor(value.maxRow),
      minColumn: Math.floor(value.minColumn),
      minRow: Math.floor(value.minRow)
    };
    const expansionCounts = getExpansionCountsFromBounds(
      rawBounds,
      currentLevel.startingRows,
      currentLevel.startingColumns
    );
    const clampedCounts: BoardExpansionCounts = {
      bottom: Math.min(MAX_EXPANSIONS_PER_SIDE, Math.max(0, expansionCounts.bottom)),
      left: Math.min(MAX_EXPANSIONS_PER_SIDE, Math.max(0, expansionCounts.left)),
      right: Math.min(MAX_EXPANSIONS_PER_SIDE, Math.max(0, expansionCounts.right)),
      top: Math.min(MAX_EXPANSIONS_PER_SIDE, Math.max(0, expansionCounts.top))
    };

    return createBoardBounds(
      clampedCounts,
      currentLevel.startingRows,
      currentLevel.startingColumns
    );
  }

  return getInitialBoardBounds(currentLevel);
}

function rehydrateSnapshot(value: unknown): AppSnapshot | null {
  if (!isRecord(value)) {
    return null;
  }

  const mode: GameMode = value.mode === "endless" ? "endless" : "campaign";
  const campaignDifficultyId: CampaignDifficultyId =
    value.campaignDifficultyId === "normal" ||
    value.campaignDifficultyId === "medium" ||
    value.campaignDifficultyId === "hard" ||
    value.campaignDifficultyId === "insane" ||
    value.campaignDifficultyId === "extreme" ||
    value.campaignDifficultyId === "hardcore"
      ? value.campaignDifficultyId
      : "easy";
  const currentLevelIndex =
    mode === "campaign"
      ? Math.min(levels.length - 1, toNonNegativeInt(value.currentLevelIndex))
      : 0;
  const baseSnapshot =
    mode === "endless"
      ? buildEndlessSnapshot()
      : buildCampaignSnapshot(currentLevelIndex, campaignDifficultyId);
  const boardBounds = sanitizeBoardBounds(value.boardBounds, baseSnapshot.currentLevel);
  const legacyBoardRows = toNonNegativeInt(value.boardRows, baseSnapshot.boardRows);
  const legacyBottomExpansions = Math.max(
    0,
    Math.min(MAX_EXPANSIONS_PER_SIDE, legacyBoardRows - baseSnapshot.currentLevel.startingRows)
  );
  const fallbackBoardBounds =
    !isRecord(value.boardBounds) && legacyBottomExpansions > 0
      ? createBoardBounds(
          createBoardExpansionCounts({ bottom: legacyBottomExpansions }),
          baseSnapshot.currentLevel.startingRows,
          baseSnapshot.currentLevel.startingColumns
        )
      : boardBounds;
  const speedMultiplier = isSpeedMultiplier(value.speedMultiplier)
    ? value.speedMultiplier
    : baseSnapshot.speedMultiplier;
  const rememberedSpeedMultiplier =
    isSpeedMultiplier(value.rememberedSpeedMultiplier) && value.rememberedSpeedMultiplier !== 0
      ? value.rememberedSpeedMultiplier
      : speedMultiplier === 0
        ? baseSnapshot.rememberedSpeedMultiplier
        : speedMultiplier;
  const placedTiles = sanitizePlacedTiles(
    value.placedTiles,
    baseSnapshot.currentLevel,
    fallbackBoardBounds
  );
  const placedTileCosts = sanitizePlacedTileCosts(value.placedTileCosts, placedTiles);
  const normalizedFocusedCellId =
    typeof value.focusedCellId === "string" ? normalizeBoardCellId(value.focusedCellId) : null;
  const focusedCellId =
    normalizedFocusedCellId !== null &&
    boardCellIds.has(normalizedFocusedCellId) &&
    isCellWithinBounds(normalizedFocusedCellId, fallbackBoardBounds)
      ? normalizedFocusedCellId
      : getInitialFocusCell(baseSnapshot.currentLevel, fallbackBoardBounds);
  const selectedTileId =
    isTileId(value.selectedTileId) ? value.selectedTileId : null;
  const inspectedCellId =
    typeof value.inspectedCellId === "string"
      ? normalizeBoardCellId(value.inspectedCellId)
      : null;
  const tileTiersByCell = sanitizeTileTiersByCell(value.tileTiersByCell, placedTiles);
  const storedCoins = sanitizeStoredCoins(value.storedCoins, placedTiles);
  const decayValues = sanitizeDecayValues(value.decayValues, placedTiles, tileTiersByCell);
  const tilePropertiesByCell = sanitizeTilePropertiesByCell(
    value.tilePropertiesByCell,
    placedTiles,
    tileTiersByCell
  );

  return withDerivedLevelState({
    ...baseSnapshot,
    activeCycleFeedback: null,
    bestCycleIncome: toNonNegativeInt(value.bestCycleIncome),
    boardBounds: fallbackBoardBounds,
    coins: toNonNegativeInt(value.coins, baseSnapshot.coins),
    cycle: toCycleNumber(value.cycle, baseSnapshot.cycle),
    decayValues,
    focusedCellId,
    hoveredTileId: null,
    inspectedCellId,
    lastCycleIncome: toNullableNonNegativeInt(value.lastCycleIncome),
    lastCycleResult: null,
    lastResolvedCycle: toNullableNonNegativeInt(value.lastResolvedCycle),
    placedTileCosts,
    placedTiles,
    rememberedSpeedMultiplier,
    selectedTileId,
    speedMultiplier,
    statusMessage:
      typeof value.statusMessage === "string" && value.statusMessage.trim()
        ? value.statusMessage
        : baseSnapshot.statusMessage,
    storedCoins,
    tileTiersByCell,
    tilePropertiesByCell,
    totalCoinsEarned: toNonNegativeInt(value.totalCoinsEarned)
  });
}

export function createAppStore(): AppStore {
  let snapshot: AppSnapshot = buildCampaignSnapshot(0);
  const listeners = new Set<(snapshot: AppSnapshot) => void>();
  let feedbackTimeout: ReturnType<typeof setTimeout> | null = null;
  let levelAdvanceTimeout: ReturnType<typeof setTimeout> | null = null;
  let tickTimeout: ReturnType<typeof setTimeout> | null = null;
  let timingActive = false;

  const clearFeedbackTimer = () => {
    if (!feedbackTimeout) {
      return;
    }

    clearTimeout(feedbackTimeout);
    feedbackTimeout = null;
  };

  const clearLevelAdvanceTimer = () => {
    if (!levelAdvanceTimeout) {
      return;
    }

    clearTimeout(levelAdvanceTimeout);
    levelAdvanceTimeout = null;
  };

  const clearTickTimer = () => {
    if (!tickTimeout) {
      return;
    }

    clearTimeout(tickTimeout);
    tickTimeout = null;
  };

  const scheduleTick = () => {
    clearTickTimer();

    if (!timingActive || snapshot.levelRunState !== "playing" || snapshot.speedMultiplier === 0) {
      return;
    }

    tickTimeout = setTimeout(() => {
      tickTimeout = null;
      runCycleNow();
    }, BASE_TICK_MS / snapshot.speedMultiplier);
  };

  const emit = () => {
    scheduleTick();
    listeners.forEach((listener) => listener(snapshot));
  };

  const loadCampaignLevel = (
    levelIndex: number,
    difficultyId: CampaignDifficultyId = getCampaignDifficultyId(snapshot),
    preserveSpeed = true
  ) => {
    const currentSpeed = snapshot.speedMultiplier;
    const rememberedSpeedMultiplier = snapshot.rememberedSpeedMultiplier;

    clearFeedbackTimer();
    clearLevelAdvanceTimer();
    snapshot = buildCampaignSnapshot(levelIndex, difficultyId);

    if (preserveSpeed) {
      snapshot = withDerivedLevelState({
        ...snapshot,
        rememberedSpeedMultiplier,
        speedMultiplier: currentSpeed
      });
    }

    emit();
  };

  const loadEndlessRun = () => {
    clearFeedbackTimer();
    clearLevelAdvanceTimer();
    snapshot = buildEndlessSnapshot();
    emit();
  };

  const retryCurrentRun = () => {
    if (snapshot.mode === "endless") {
      loadEndlessRun();
      return;
    }

    loadCampaignLevel(snapshot.currentLevelIndex);
  };

  const scheduleLevelAdvance = () => {
    clearLevelAdvanceTimer();

    if (snapshot.mode !== "campaign" || snapshot.levelRunState !== "won") {
      return;
    }

    levelAdvanceTimeout = setTimeout(() => {
      levelAdvanceTimeout = null;
      snapshot = buildNextCampaignDaySnapshot(snapshot);
      emit();
    }, LEVEL_ADVANCE_DELAY_MS);
  };

  const applyRunStatePresentation = (nextSnapshot: AppSnapshot): AppSnapshot => {
    if (
      nextSnapshot.mode === "campaign" &&
      (nextSnapshot.levelRunState === "won" || nextSnapshot.levelRunState === "set_complete")
    ) {
      return {
        ...nextSnapshot,
        statusMessage: buildWinMessage(nextSnapshot)
      };
    }

    if (nextSnapshot.levelRunState === "failed") {
      return {
        ...nextSnapshot,
        statusMessage: buildFailMessage(nextSnapshot)
      };
    }

    return nextSnapshot;
  };

  const runCycleNow = () => {
    if (snapshot.levelRunState !== "playing") {
      return;
    }

    clearFeedbackTimer();

    const resolvedCycle = snapshot.cycle;
    const result = resolveProductionCycle(
      snapshot.placedTiles,
      snapshot.storedCoins,
      resolvedCycle,
      {
        boardBounds: snapshot.boardBounds,
        coins: snapshot.coins,
        decayValues: snapshot.decayValues,
        tileTiersByCell: snapshot.tileTiersByCell,
        tilePropertiesByCell: snapshot.tilePropertiesByCell
      }
    );
    const pressureCost =
      snapshot.mode === "endless" ? getEndlessPressureCost(resolvedCycle) : 0;
    const nextCoins = Math.max(0, snapshot.coins + result.earnedCoins - pressureCost);
    const nextSnapshot = withDerivedLevelState({
      ...snapshot,
      activeCycleFeedback: result,
      bestCycleIncome: Math.max(snapshot.bestCycleIncome, result.earnedCoins),
      coins: nextCoins,
      cycle: snapshot.cycle + 1,
      decayValues: result.nextDecayValues,
      lastCycleIncome: result.earnedCoins,
      lastCycleResult: result,
      lastResolvedCycle: resolvedCycle,
      statusMessage: buildCycleStatusMessage(
        snapshot.mode,
        resolvedCycle,
        result,
        nextCoins,
        pressureCost
      ),
      storedCoins: result.nextStoredCoins,
      totalCoinsEarned: snapshot.totalCoinsEarned + result.earnedCoins
    });

    snapshot = applyRunStatePresentation(nextSnapshot);

    emit();
    scheduleLevelAdvance();

    feedbackTimeout = setTimeout(() => {
      snapshot = {
        ...snapshot,
        activeCycleFeedback: null
      };
      feedbackTimeout = null;
      emit();
    }, FEEDBACK_DURATION_MS);
  };

  const store: AppStore = {
    buyExpansion(side) {
      if (
        snapshot.levelRunState !== "playing" ||
        snapshot.nextExpansionCost === null ||
        !canExpandSide(snapshot.expansionCounts, side)
      ) {
        return;
      }

      if (snapshot.coins < snapshot.nextExpansionCost) {
        snapshot = {
          ...snapshot,
          statusMessage: `Need ${formatCompactNumber(snapshot.nextExpansionCost - snapshot.coins)} more coins to expand ${side}.`
        };
        emit();
        return;
      }

      const nextCounts = getExpandedCounts(snapshot.expansionCounts, side);
      const nextBounds = createBoardBounds(
        nextCounts,
        snapshot.currentLevel.startingRows,
        snapshot.currentLevel.startingColumns
      );
      snapshot = withDerivedLevelState({
        ...snapshot,
        boardBounds: nextBounds,
        coins: snapshot.coins - snapshot.nextExpansionCost,
        focusedCellId: getNewExpansionFocusCell(
          snapshot.currentLevel,
          snapshot.boardBounds,
          snapshot.placedTiles,
          side
        ),
        inspectedCellId: null,
        statusMessage: `${side[0].toUpperCase()}${side.slice(1)} edge expanded.`
      });
      emit();
    },
    focusCell(cellId) {
      if (!isCellWithinBounds(cellId, snapshot.boardBounds)) {
        return;
      }

      const tileId = snapshot.placedTiles[cellId];

      if (snapshot.inspectedCellId === cellId && tileId) {
        return;
      }

      snapshot = {
        ...snapshot,
        focusedCellId: cellId,
        hoveredTileId: null,
        inspectedCellId: tileId ? cellId : null,
        selectedTileId: tileId ? null : snapshot.selectedTileId,
        statusMessage: tileId ? `Inspecting ${getTileDefinition(tileId).name}.` : snapshot.statusMessage
      };
      emit();
    },
    getSnapshot() {
      return snapshot;
    },
    hoverTile(tileId) {
      if (snapshot.hoveredTileId === tileId) {
        return;
      }

      snapshot = {
        ...snapshot,
        hoveredTileId: tileId
      };
      emit();
    },
    loadSnapshot(nextSnapshot) {
      const restoredSnapshot = rehydrateSnapshot(nextSnapshot);

      if (!restoredSnapshot) {
        return false;
      }

      clearFeedbackTimer();
      clearLevelAdvanceTimer();
      snapshot = restoredSnapshot;
      emit();
      scheduleLevelAdvance();
      return true;
    },
    nextLevel() {
      if (snapshot.mode !== "campaign" || snapshot.levelRunState !== "set_complete") {
        return;
      }

      loadCampaignLevel(0, getCampaignDifficultyId(snapshot), false);
    },
    placeSelectedTile(cellId) {
      if (snapshot.levelRunState !== "playing") {
        return;
      }

      if (!isCellWithinBounds(cellId, snapshot.boardBounds)) {
        return;
      }

      if (snapshot.currentLevel.blockedCellIds.includes(cellId)) {
        snapshot = {
          ...snapshot,
          focusedCellId: cellId,
          inspectedCellId: null,
          statusMessage: `${getBoardCellLabel(cellId, snapshot.boardBounds)} is blocked on this run.`
        };
        emit();
        return;
      }

      if (snapshot.placedTiles[cellId]) {
        return;
      }

      if (!snapshot.selectedTileId) {
        snapshot = {
          ...snapshot,
          focusedCellId: cellId,
          inspectedCellId: null,
          statusMessage: `Select a tile first, then place it on ${getBoardCellLabel(cellId, snapshot.boardBounds)}.`
        };
        emit();
        return;
      }

      const tile = getTileDefinition(snapshot.selectedTileId);
      const tileUnlockDay = getTileUnlockDay(snapshot.selectedTileId);
      const tileUnlocked = isTileUnlockedForRun(snapshot.currentLevel, snapshot.selectedTileId);
      const price = snapshot.tilePrices[snapshot.selectedTileId];

      if (!tileUnlocked) {
        snapshot = {
          ...snapshot,
          focusedCellId: cellId,
          inspectedCellId: null,
          statusMessage: `${tile.name} unlocks on Day ${tileUnlockDay}.`
        };
        emit();
        return;
      }

      if (
        !canAffordTile(
          snapshot.selectedTileId,
          snapshot.coins,
          snapshot.placedTiles,
          getTileCostMultiplier(snapshot)
        )
      ) {
        const shortfall = getTileShortfall(
          snapshot.selectedTileId,
          snapshot.coins,
          snapshot.placedTiles,
          getTileCostMultiplier(snapshot)
        );

        snapshot = {
          ...snapshot,
          focusedCellId: cellId,
          inspectedCellId: null,
          statusMessage: `Need ${formatCompactNumber(shortfall)} more coins for ${tile.name}.`
        };
        emit();
        return;
      }

      const nextTileProperties = {
        ...snapshot.tilePropertiesByCell,
        [cellId]: getDefaultTileProperties(snapshot.selectedTileId, DEFAULT_TILE_TIER)
      };
      const nextDecayValues = {
        ...snapshot.decayValues
      };
      const nextTileTiers = {
        ...snapshot.tileTiersByCell,
        [cellId]: DEFAULT_TILE_TIER
      };

      if (snapshot.selectedTileId === "decay") {
        nextDecayValues[cellId] = getDecayTierConfig(DEFAULT_TILE_TIER).startingOutput;
      }

      const nextSnapshot = withDerivedLevelState({
        ...snapshot,
        coins: snapshot.coins - price,
        decayValues: nextDecayValues,
        focusedCellId: cellId,
        inspectedCellId: null,
        placedTileCosts: {
          ...snapshot.placedTileCosts,
          [cellId]: price
        },
        placedTiles: {
          ...snapshot.placedTiles,
          [cellId]: snapshot.selectedTileId
        },
        statusMessage: `${tile.name} placed for ${formatCoins(price)}.`,
        tileTiersByCell: nextTileTiers,
        tilePropertiesByCell: nextTileProperties
      });

      snapshot =
        nextSnapshot.levelRunState === "failed"
          ? {
              ...nextSnapshot,
              statusMessage: buildFailMessage(nextSnapshot)
            }
          : nextSnapshot;
      emit();
    },
    reset() {
      retryCurrentRun();
    },
    retryLevel() {
      retryCurrentRun();
    },
    sellTile(cellId) {
      if (snapshot.levelRunState !== "playing") {
        return;
      }

      const tileId = snapshot.placedTiles[cellId];

      if (!tileId) {
        return;
      }

      const refund = Math.floor((snapshot.placedTileCosts[cellId] ?? 0) / 2);
      const nextPlacedTiles = { ...snapshot.placedTiles };
      const nextPlacedTileCosts = { ...snapshot.placedTileCosts };
      const nextStoredCoins = { ...snapshot.storedCoins };
      const nextTileProperties = { ...snapshot.tilePropertiesByCell };
      const nextTileTiers = { ...snapshot.tileTiersByCell };
      const nextDecayValues = { ...snapshot.decayValues };

      delete nextPlacedTiles[cellId];
      delete nextPlacedTileCosts[cellId];
      delete nextStoredCoins[cellId];
      delete nextTileProperties[cellId];
      delete nextTileTiers[cellId];
      delete nextDecayValues[cellId];

      snapshot = withDerivedLevelState({
        ...snapshot,
        coins: snapshot.coins + refund,
        decayValues: nextDecayValues,
        focusedCellId: cellId,
        inspectedCellId:
          snapshot.inspectedCellId === cellId ? null : snapshot.inspectedCellId,
        placedTileCosts: nextPlacedTileCosts,
        placedTiles: nextPlacedTiles,
        statusMessage: `${getTileDefinition(tileId).name} sold for ${formatCoins(refund)}.`,
        storedCoins: nextStoredCoins,
        tileTiersByCell: nextTileTiers,
        tilePropertiesByCell: nextTileProperties
      });
      emit();
    },
    selectTile(tileId) {
      const tile = getTileDefinition(tileId);
      const price = snapshot.tilePrices[tileId];
      const shortfall = getTileShortfall(
        tileId,
        snapshot.coins,
        snapshot.placedTiles,
        getTileCostMultiplier(snapshot)
      );
      const unlockDay = getTileUnlockDay(tileId);
      const tileUnlocked = isTileUnlockedForRun(snapshot.currentLevel, tileId);

      snapshot = {
        ...snapshot,
        focusedCellId: getPlacementFocusCell(
          snapshot.currentLevel,
          snapshot.boardBounds,
          snapshot.placedTiles,
          snapshot.focusedCellId
        ),
        hoveredTileId: null,
        inspectedCellId: null,
        selectedTileId: tileId,
        statusMessage:
          snapshot.levelRunState !== "playing"
            ? snapshot.statusMessage
            : !tileUnlocked
              ? `${tile.name} unlocks on Day ${unlockDay}.`
            : shortfall === 0
            ? `${tile.name} selected / ${formatCoins(price)}`
            : `${tile.name} costs ${formatCoins(price)} / Need ${formatCompactNumber(shortfall)} more`
      };
      emit();
    },
    setFocusedTileDirection(direction) {
      const focusedCellId = snapshot.inspectedCellId;

      if (!focusedCellId) {
        return;
      }

      const tileId = snapshot.placedTiles[focusedCellId];

      if (!tileId || !supportsDirectionalOutput(tileId)) {
        return;
      }

      const currentTier = snapshot.tileTiersByCell[focusedCellId] ?? DEFAULT_TILE_TIER;
      const currentProperties =
        snapshot.tilePropertiesByCell[focusedCellId] ?? getDefaultTileProperties(tileId, currentTier);
      snapshot = withDerivedLevelState({
        ...snapshot,
        tilePropertiesByCell: {
          ...snapshot.tilePropertiesByCell,
          [focusedCellId]: {
            ...currentProperties,
            direction
          }
        },
        statusMessage: `${getTileDefinition(tileId).name} now points ${direction}.`
      });
      emit();
    },
    setFocusedTileReleaseSeconds(releaseSeconds) {
      const focusedCellId = snapshot.inspectedCellId;

      if (!focusedCellId) {
        return;
      }

      const tileId = snapshot.placedTiles[focusedCellId];

      const currentTier = snapshot.tileTiersByCell[focusedCellId] ?? DEFAULT_TILE_TIER;

      if (
        !tileId ||
        !supportsReleaseSetting(tileId) ||
        !getReleaseOptions(tileId, currentTier).includes(releaseSeconds)
      ) {
        return;
      }

      const currentProperties =
        snapshot.tilePropertiesByCell[focusedCellId] ?? getDefaultTileProperties(tileId, currentTier);
      snapshot = withDerivedLevelState({
        ...snapshot,
        tilePropertiesByCell: {
          ...snapshot.tilePropertiesByCell,
          [focusedCellId]: {
            ...currentProperties,
            releaseSeconds
          }
        },
        statusMessage: `${getTileDefinition(tileId).name} releases every ${releaseSeconds}s.`
      });
      emit();
    },
    upgradeFocusedTile() {
      if (snapshot.levelRunState !== "playing" || !snapshot.inspectedCellId) {
        return;
      }

      const cellId = snapshot.inspectedCellId;
      const tileId = snapshot.placedTiles[cellId];

      if (!tileId) {
        return;
      }

      const currentTier = snapshot.tileTiersByCell[cellId] ?? DEFAULT_TILE_TIER;
      const nextTier = currentTier + 1;
      const upgradeCost = getTileUpgradeCost(
        tileId,
        currentTier,
        getUpgradeCostMultiplier(snapshot)
      );

      if (currentTier >= MAX_TILE_TIER || upgradeCost === null) {
        snapshot = {
          ...snapshot,
          statusMessage: `${getTileDefinition(tileId).name} is already max tier.`
        };
        emit();
        return;
      }

      if (snapshot.coins < upgradeCost) {
        snapshot = {
          ...snapshot,
          statusMessage: `Need ${formatCompactNumber(upgradeCost - snapshot.coins)} more coins to upgrade ${getTileDefinition(tileId).name}.`
        };
        emit();
        return;
      }

      const nextDecayValues = { ...snapshot.decayValues };

      if (tileId === "decay") {
        nextDecayValues[cellId] = getDecayTierConfig(nextTier).startingOutput;
      }

      snapshot = withDerivedLevelState({
        ...snapshot,
        coins: snapshot.coins - upgradeCost,
        decayValues: nextDecayValues,
        statusMessage: `${getTileDefinition(tileId).name} upgraded to Tier ${nextTier}.`,
        tileTiersByCell: {
          ...snapshot.tileTiersByCell,
          [cellId]: nextTier
        }
      });
      emit();
    },
    skipDay() {
      if (!canSkipDay(snapshot)) {
        return;
      }

      clearFeedbackTimer();

      snapshot = applyRunStatePresentation(
        withDerivedLevelState({
          ...snapshot,
          lastResolvedCycle: DAY_DURATION_SECONDS,
          statusMessage: `Day ${snapshot.currentLevelIndex + 1} skipped at the buzzer.`
        })
      );
      emit();
      scheduleLevelAdvance();
    },
    setSpeed(speed) {
      const rememberedSpeedMultiplier =
        speed === 0 ? snapshot.rememberedSpeedMultiplier : speed;

      snapshot = withDerivedLevelState({
        ...snapshot,
        rememberedSpeedMultiplier,
        speedMultiplier: speed,
        statusMessage: speed === 0 ? "Game paused." : `Speed set to ${speed}x.`
      });
      emit();
    },
    setTimeActive(active) {
      timingActive = active;
      emit();
    },
    startMode(mode, difficultyId = "easy") {
      if (mode === "endless") {
        loadEndlessRun();
        return;
      }

      loadCampaignLevel(0, difficultyId, false);
    },
    subscribe(listener) {
      listeners.add(listener);
      listener(snapshot);

      return () => {
        listeners.delete(listener);
      };
    },
    togglePause() {
      const nextSpeed =
        snapshot.speedMultiplier === 0 ? snapshot.rememberedSpeedMultiplier : 0;

      store.setSpeed(nextSpeed);
    }
  };

  return store;
}
