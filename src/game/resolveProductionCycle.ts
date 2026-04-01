import { BASE_BOARD_COLUMNS, BASE_BOARD_ROWS, createBoardBounds, getBoardLayout } from "./boardLayout";
import {
  getCellsWithinRadius,
  getDirectionalNeighborId,
  getOrthogonalNeighborIds,
  isEdgeCell
} from "./boardMath";
import {
  acceptsRoutedValue,
  getDefaultRelease,
  normalizeDirectionForTile,
  supportsDirectionalOutput
} from "./tileCatalog";
import {
  DEFAULT_TILE_TIER,
  getAnchorTierConfig,
  getBankTierConfig,
  getBoosterTierConfig,
  getChainTierConfig,
  getCleanerTierConfig,
  getDecayTierConfig,
  getDoublerTierConfig,
  getInvestmentTierConfig,
  getRelayTierConfig,
  getReleaseOptionsForTier,
  getSplitterTierConfig,
  getTileOutput,
  getTriplerTierConfig,
  getVaultTierConfig,
  normalizeTileTier
} from "./tileTiers";
import type {
  BoardBounds,
  DecayValuesByCell,
  OutputDirection,
  StoredCoinsByCell,
  TileId,
  TilePropertiesByCell,
  TileTiersByCell
} from "./types";

export interface TileOutputDetail {
  cellId: string;
  label: string;
  tileId: TileId;
  totalOutput: number;
}

export interface StorageCycleDetail {
  cellId: string;
  depositedCoins: number;
  interestCoins: number;
  releasedCoins: number;
  storedAfter: number;
  tileId: "bank" | "investment" | "vault";
}

export interface ProductionCycleResult {
  activeCellIds: string[];
  activeSupportCellIds: string[];
  directCoins: number;
  earnedCoins: number;
  nextDecayValues: DecayValuesByCell;
  nextStoredCoins: StoredCoinsByCell;
  outputDetails: TileOutputDetail[];
  storageDetails: StorageCycleDetail[];
  tileTotals: Partial<Record<TileId, number>>;
}

interface ResolveCycleOptions {
  boardBounds: BoardBounds;
  coins: number;
  decayValues: DecayValuesByCell;
  tilePropertiesByCell: TilePropertiesByCell;
  tileTiersByCell: TileTiersByCell;
}

interface EmittedOutput {
  amount: number;
  cellId: string;
  tileId: TileId;
}

interface RoutePacket {
  amount: number;
  sourceCellId: string;
  sourceTileId: TileId;
  targetCellId: string | null;
  visitedCellIds: string[];
}

interface MineSupportState {
  additiveBoost: number;
  focusedMultiplier: number;
}

const supportableMineTiles = new Set<TileId>(["miner", "rich_miner"]);
const directionalArrow: Record<Exclude<OutputDirection, "none">, string> = {
  down: "v",
  left: "<",
  right: ">",
  up: "^"
};

function isCornerCell(cellId: string, boardBounds: BoardBounds): boolean {
  const edge = isEdgeCell(cellId, boardBounds);

  if (!edge) {
    return false;
  }

  return getOrthogonalNeighborIds(cellId, boardBounds).length === 2;
}

function addTotal(
  tileTotals: Partial<Record<TileId, number>>,
  tileId: TileId,
  amount: number
) {
  if (amount <= 0) {
    return;
  }

  tileTotals[tileId] = (tileTotals[tileId] ?? 0) + amount;
}

function pushOutputDetail(
  outputDetails: TileOutputDetail[],
  cellId: string,
  tileId: TileId,
  totalOutput: number,
  label: string
) {
  outputDetails.push({
    cellId,
    label,
    tileId,
    totalOutput
  });
}

function getTileTier(cellId: string, tileTiersByCell: TileTiersByCell): number {
  return normalizeTileTier(tileTiersByCell[cellId] ?? DEFAULT_TILE_TIER);
}

function getDirectionForTile(
  cellId: string,
  tileId: TileId,
  tilePropertiesByCell: TilePropertiesByCell
): OutputDirection {
  const properties = tilePropertiesByCell[cellId];
  return normalizeDirectionForTile(tileId, properties?.direction ?? "none");
}

function getTargetCellsForSupport(
  cellId: string,
  boardBounds: BoardBounds,
  radius: number,
  includeDiagonals: boolean
): string[] {
  if (radius <= 1 && !includeDiagonals) {
    return getOrthogonalNeighborIds(cellId, boardBounds);
  }

  return getCellsWithinRadius(cellId, radius, boardBounds, includeDiagonals).sort((left, right) =>
    left.localeCompare(right)
  );
}

function roundOutput(value: number): number {
  return Math.max(0, Math.round(value));
}

function floorOutput(value: number): number {
  return Math.max(0, Math.floor(value));
}

function getReadablePercentBoostedOutput(baseOutput: number, additiveBoost: number): number {
  if (baseOutput <= 0 || additiveBoost <= 0) {
    return baseOutput;
  }

  const roundedBoostedOutput = Math.ceil(baseOutput * (1 + additiveBoost));
  return Math.max(baseOutput + 1, roundedBoostedOutput);
}

function getReleaseSeconds(
  cellId: string,
  tileId: "bank" | "vault",
  tileTier: number,
  tilePropertiesByCell: TilePropertiesByCell
) {
  const validOptions = getReleaseOptionsForTier(tileId, tileTier);
  const configuredRelease =
    tilePropertiesByCell[cellId]?.releaseSeconds ?? getDefaultRelease(tileId, tileTier);

  return configuredRelease !== undefined && validOptions.includes(configuredRelease)
    ? configuredRelease
    : validOptions[0];
}

export function resolveProductionCycle(
  placedTiles: Partial<Record<string, TileId>>,
  storedCoins: StoredCoinsByCell = {},
  cycleNumber = 1,
  options: ResolveCycleOptions = {
    boardBounds: createBoardBounds(undefined, BASE_BOARD_ROWS, BASE_BOARD_COLUMNS),
    coins: 0,
    decayValues: {},
    tilePropertiesByCell: {},
    tileTiersByCell: {}
  }
): ProductionCycleResult {
  const { boardBounds, decayValues, tilePropertiesByCell, tileTiersByCell } = options;
  const boardCells = getBoardLayout(boardBounds);
  const activeCellIds = new Set<string>();
  const activeSupportCellIds = new Set<string>();
  const outputDetails: TileOutputDetail[] = [];
  const storageDetails: StorageCycleDetail[] = [];
  const tileTotals: Partial<Record<TileId, number>> = {};
  const baseOutputs = new Map<string, number>();
  const nextStoredCoins: StoredCoinsByCell = {};
  const nextDecayValues: DecayValuesByCell = {};
  const receivedDeposits = new Map<string, number>();
  let directCoins = 0;

  const cleanerCells = boardCells
    .filter((cell) => placedTiles[cell.id] === "cleaner")
    .map((cell) => cell.id);

  const mineSupportStates = new Map<string, MineSupportState>();

  boardCells.forEach((cell) => {
    const tileId = placedTiles[cell.id];

    if (!tileId || !supportableMineTiles.has(tileId)) {
      return;
    }

    mineSupportStates.set(cell.id, {
      additiveBoost: 0,
      focusedMultiplier: 1
    });
  });

  boardCells.forEach((cell) => {
    if (placedTiles[cell.id] !== "booster") {
      return;
    }

    const config = getBoosterTierConfig(getTileTier(cell.id, tileTiersByCell));
    const targetIds = getTargetCellsForSupport(
      cell.id,
      boardBounds,
      config.radius,
      config.includeDiagonals
    ).filter((neighborId) => {
      const neighborTileId = placedTiles[neighborId];
      return neighborTileId !== undefined && supportableMineTiles.has(neighborTileId);
    });

    if (targetIds.length === 0) {
      return;
    }

    activeSupportCellIds.add(cell.id);

    targetIds.forEach((targetId) => {
      const supportState = mineSupportStates.get(targetId);

      if (!supportState) {
        return;
      }

      supportState.additiveBoost += config.bonusPercent;
    });
  });

  boardCells.forEach((cell) => {
    const tileId = placedTiles[cell.id];

    if (tileId !== "doubler" && tileId !== "tripler") {
      return;
    }

    const config =
      tileId === "doubler"
        ? getDoublerTierConfig(getTileTier(cell.id, tileTiersByCell))
        : getTriplerTierConfig(getTileTier(cell.id, tileTiersByCell));
    const targetIds = getOrthogonalNeighborIds(cell.id, boardBounds)
      .filter((neighborId) => {
        const neighborTileId = placedTiles[neighborId];
        return neighborTileId !== undefined && supportableMineTiles.has(neighborTileId);
      })
      .slice(0, config.maxTargets);

    if (targetIds.length === 0) {
      return;
    }

    activeSupportCellIds.add(cell.id);

    targetIds.forEach((targetId) => {
      const supportState = mineSupportStates.get(targetId);

      if (!supportState) {
        return;
      }

      supportState.focusedMultiplier = Math.max(
        supportState.focusedMultiplier,
        config.multiplier
      );
    });
  });

  boardCells.forEach((cell) => {
    const tileId = placedTiles[cell.id];

    if (!tileId) {
      return;
    }

    const tileTier = getTileTier(cell.id, tileTiersByCell);

    if (tileId === "miner" || tileId === "rich_miner") {
      const baseOutput = getTileOutput(tileId, tileTier);
      const supportState = mineSupportStates.get(cell.id);
      // Keep support stacking readable and stable:
      // booster percentages add together and round up to a visible gain,
      // then only the single strongest focused support (Doubler/Tripler)
      // applies to that mine.
      const percentBoostedOutput = getReadablePercentBoostedOutput(
        baseOutput,
        supportState?.additiveBoost ?? 0
      );
      const focusedMultiplier = supportState?.focusedMultiplier ?? 1;
      baseOutputs.set(cell.id, roundOutput(percentBoostedOutput * focusedMultiplier));
      return;
    }

    if (tileId === "chain") {
      const linkedNeighbors = getOrthogonalNeighborIds(cell.id, boardBounds).filter(
        (neighborId) => placedTiles[neighborId] !== undefined
      ).length;
      const config = getChainTierConfig(tileTier);
      baseOutputs.set(cell.id, config.baseOutput + linkedNeighbors * config.perNeighborOutput);
      return;
    }

    if (tileId === "edge") {
      baseOutputs.set(cell.id, isEdgeCell(cell.id, boardBounds) ? getTileOutput("edge", tileTier) : 0);
      return;
    }

    if (tileId === "corner") {
      baseOutputs.set(
        cell.id,
        isCornerCell(cell.id, boardBounds) ? getTileOutput("corner", tileTier) : 0
      );
      return;
    }

    if (tileId === "risk") {
      const adjacentCount = getOrthogonalNeighborIds(cell.id, boardBounds).filter(
        (neighborId) => placedTiles[neighborId] !== undefined
      ).length;
      baseOutputs.set(cell.id, adjacentCount === 2 ? getTileOutput("risk", tileTier) : 0);
      return;
    }

    if (tileId === "decay") {
      const config = getDecayTierConfig(tileTier);
      const cleanerApplied = cleanerCells.some((cleanerCellId) => {
        const cleanerConfig = getCleanerTierConfig(getTileTier(cleanerCellId, tileTiersByCell));
        const isResetCycle = cycleNumber % cleanerConfig.resetIntervalSeconds === 0;

        if (!isResetCycle) {
          return false;
        }

        return getTargetCellsForSupport(
          cleanerCellId,
          boardBounds,
          cleanerConfig.radius,
          cleanerConfig.includeDiagonals
        ).includes(cell.id);
      });
      const currentValue = cleanerApplied
        ? config.startingOutput
        : decayValues[cell.id] ?? config.startingOutput;

      if (cleanerApplied) {
        cleanerCells.forEach((cleanerCellId) => {
          const cleanerConfig = getCleanerTierConfig(getTileTier(cleanerCellId, tileTiersByCell));

          if (
            cycleNumber % cleanerConfig.resetIntervalSeconds === 0 &&
            getTargetCellsForSupport(
              cleanerCellId,
              boardBounds,
              cleanerConfig.radius,
              cleanerConfig.includeDiagonals
            ).includes(cell.id)
          ) {
            activeSupportCellIds.add(cleanerCellId);
          }
        });
      }

      nextDecayValues[cell.id] =
        cleanerApplied || cycleNumber % config.decayIntervalSeconds !== 0
          ? currentValue
          : Math.max(0, currentValue - 1);
      baseOutputs.set(cell.id, currentValue);
      return;
    }

    if (tileId === "investment") {
      const config = getInvestmentTierConfig(tileTier);
      baseOutputs.set(cell.id, floorOutput((storedCoins[cell.id] ?? 0) * config.payoutRate));
    }
  });

  boardCells.forEach((cell) => {
    if (placedTiles[cell.id] !== "splitter") {
      return;
    }

    const config = getSplitterTierConfig(getTileTier(cell.id, tileTiersByCell));
    const sourceCellIds = getOrthogonalNeighborIds(cell.id, boardBounds)
      .filter((neighborId) => (baseOutputs.get(neighborId) ?? 0) > 0)
      .slice(0, config.maxTargets);

    if (sourceCellIds.length === 0) {
      return;
    }

    const copiedOutput = sourceCellIds.reduce((sum, sourceCellId) => {
      return sum + roundOutput((baseOutputs.get(sourceCellId) ?? 0) * config.copyMultiplier);
    }, 0);

    if (copiedOutput <= 0) {
      return;
    }

    activeSupportCellIds.add(cell.id);
    baseOutputs.set(cell.id, copiedOutput);
  });

  const emittedOutputs: EmittedOutput[] = [];

  boardCells.forEach((cell) => {
    const tileId = placedTiles[cell.id];

    if (!tileId) {
      return;
    }

    const amount = baseOutputs.get(cell.id) ?? 0;

    if (amount <= 0) {
      return;
    }

    emittedOutputs.push({
      amount,
      cellId: cell.id,
      tileId
    });
  });

  const routeQueue: RoutePacket[] = [];

  const cashOut = (cellId: string, tileId: TileId, amount: number, label = `+${amount}`) => {
    if (amount <= 0) {
      return;
    }

    activeCellIds.add(cellId);
    directCoins += amount;
    addTotal(tileTotals, tileId, amount);
    pushOutputDetail(outputDetails, cellId, tileId, amount, label);
  };

  const routeOutput = (
    cellId: string,
    tileId: TileId,
    amount: number,
    direction: OutputDirection,
    visitedCellIds: string[] = [cellId]
  ) => {
    if (amount <= 0) {
      return;
    }

    if (!supportsDirectionalOutput(tileId) || direction === "none") {
      cashOut(cellId, tileId, amount);
      return;
    }

    activeCellIds.add(cellId);
    addTotal(tileTotals, tileId, amount);
    pushOutputDetail(
      outputDetails,
      cellId,
      tileId,
      amount,
      `${directionalArrow[direction]}${amount}`
    );

    routeQueue.push({
      amount,
      sourceCellId: cellId,
      sourceTileId: tileId,
      targetCellId: getDirectionalNeighborId(cellId, direction, boardBounds),
      visitedCellIds
    });
  };

  emittedOutputs.forEach((output) => {
    const direction = getDirectionForTile(output.cellId, output.tileId, tilePropertiesByCell);
    routeOutput(output.cellId, output.tileId, output.amount, direction);
  });

  const drainRouteQueue = () => {
    while (routeQueue.length > 0) {
      const packet = routeQueue.shift();

      if (!packet || packet.targetCellId === null) {
        continue;
      }

      const targetTileId = placedTiles[packet.targetCellId];

      if (!targetTileId || packet.visitedCellIds.includes(packet.targetCellId)) {
        continue;
      }

      if (targetTileId === "relay") {
        const relayDirection = getDirectionForTile(
          packet.targetCellId,
          targetTileId,
          tilePropertiesByCell
        );
        const relayConfig = getRelayTierConfig(getTileTier(packet.targetCellId, tileTiersByCell));
        const forwardedAmount = roundOutput(packet.amount * relayConfig.forwardMultiplier);

        if (forwardedAmount <= 0) {
          continue;
        }

        activeSupportCellIds.add(packet.targetCellId);

        if (relayDirection === "none") {
          cashOut(packet.targetCellId, "relay", forwardedAmount);
        } else {
          addTotal(tileTotals, "relay", forwardedAmount);
          pushOutputDetail(
            outputDetails,
            packet.targetCellId,
            "relay",
            forwardedAmount,
            `${directionalArrow[relayDirection]}${forwardedAmount}`
          );
          routeQueue.push({
            amount: forwardedAmount,
            sourceCellId: packet.targetCellId,
            sourceTileId: "relay",
            targetCellId: getDirectionalNeighborId(packet.targetCellId, relayDirection, boardBounds),
            visitedCellIds: [...packet.visitedCellIds, packet.targetCellId]
          });
        }

        continue;
      }

      if (targetTileId === "anchor") {
        const anchorConfig = getAnchorTierConfig(getTileTier(packet.targetCellId, tileTiersByCell));
        activeSupportCellIds.add(packet.targetCellId);
        cashOut(
          packet.targetCellId,
          "anchor",
          floorOutput(packet.amount * anchorConfig.bonusMultiplier)
        );
        continue;
      }

      if (acceptsRoutedValue(targetTileId)) {
        receivedDeposits.set(
          packet.targetCellId,
          (receivedDeposits.get(packet.targetCellId) ?? 0) + packet.amount
        );
        activeSupportCellIds.add(packet.targetCellId);
        pushOutputDetail(
          outputDetails,
          packet.targetCellId,
          targetTileId,
          packet.amount,
          `S+${packet.amount}`
        );
      }
    }
  };

  drainRouteQueue();

  boardCells.forEach((cell) => {
    const tileId = placedTiles[cell.id];

    if (!tileId) {
      return;
    }

    const tileTier = getTileTier(cell.id, tileTiersByCell);

    if (tileId === "investment") {
      const depositedCoins = receivedDeposits.get(cell.id) ?? 0;
      const storedAfter = (storedCoins[cell.id] ?? 0) + depositedCoins;

      if (storedAfter > 0) {
        nextStoredCoins[cell.id] = storedAfter;
      }

      if (depositedCoins > 0 || storedAfter > 0) {
        storageDetails.push({
          cellId: cell.id,
          depositedCoins,
          interestCoins: 0,
          releasedCoins: 0,
          storedAfter,
          tileId: "investment"
        });
      }

      return;
    }

    if (tileId !== "bank" && tileId !== "vault") {
      return;
    }

    const storageConfig = tileId === "bank" ? getBankTierConfig(tileTier) : getVaultTierConfig(tileTier);
    const depositedCoins = receivedDeposits.get(cell.id) ?? 0;
    const storedBefore = storedCoins[cell.id] ?? 0;
    const direction = getDirectionForTile(cell.id, tileId, tilePropertiesByCell);
    const releaseSeconds = getReleaseSeconds(cell.id, tileId, tileTier, tilePropertiesByCell);
    const storedWithDeposits = Math.min(
      storageConfig.storageCap,
      storedBefore + depositedCoins
    );
    const interestCoins =
      cycleNumber % 10 === 0 ? floorOutput(storedWithDeposits * storageConfig.interestRate) : 0;
    const storedWithInterest = Math.min(
      storageConfig.storageCap,
      storedWithDeposits + interestCoins
    );
    const shouldRelease =
      (storageConfig.allowInstantDirectRelease && direction === "none") ||
      cycleNumber % releaseSeconds === 0;
    const releasedCoins = shouldRelease ? storedWithInterest : 0;
    const storedAfter = shouldRelease ? 0 : storedWithInterest;

    if (storedAfter > 0) {
      nextStoredCoins[cell.id] = storedAfter;
    }

    if (depositedCoins > 0 || interestCoins > 0 || releasedCoins > 0) {
      activeSupportCellIds.add(cell.id);
    }

    if (releasedCoins > 0) {
      if (direction === "none") {
        cashOut(cell.id, tileId, releasedCoins);
      } else {
        routeOutput(cell.id, tileId, releasedCoins, direction, [cell.id]);
      }
    }

    storageDetails.push({
      cellId: cell.id,
      depositedCoins,
      interestCoins,
      releasedCoins,
      storedAfter,
      tileId
    });
  });

  drainRouteQueue();

  return {
    activeCellIds: Array.from(activeCellIds),
    activeSupportCellIds: Array.from(activeSupportCellIds),
    directCoins,
    earnedCoins: directCoins,
    nextDecayValues,
    nextStoredCoins,
    outputDetails,
    storageDetails,
    tileTotals
  };
}
