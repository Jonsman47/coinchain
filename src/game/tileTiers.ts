import type { ReleaseSeconds, TileId } from "./types";

export const DEFAULT_TILE_TIER = 1;
export const MAX_TILE_TIER = 10;

export interface BoosterTierConfig {
  bonusPercent: number;
  effectText: string;
  includeDiagonals: boolean;
  radius: number;
}

export interface SupportTierConfig {
  effectText: string;
  maxTargets: number;
  multiplier: number;
}

export interface RelayTierConfig {
  effectText: string;
  forwardMultiplier: number;
}

export interface SplitterTierConfig {
  copyMultiplier: number;
  effectText: string;
  maxTargets: number;
}

export interface ChainTierConfig {
  baseOutput: number;
  effectText: string;
  perNeighborOutput: number;
}

export interface StorageTierConfig {
  allowInstantDirectRelease: boolean;
  effectText: string;
  interestRate: number;
  releaseOptions: ReleaseSeconds[];
  storageCap: number;
}

export interface InvestmentTierConfig {
  effectText: string;
  payoutRate: number;
}

export interface CleanerTierConfig {
  effectText: string;
  includeDiagonals: boolean;
  radius: number;
  resetIntervalSeconds: number;
}

export interface AnchorTierConfig {
  bonusMultiplier: number;
  effectText: string;
}

export interface DecayTierConfig {
  decayIntervalSeconds: number;
  effectText: string;
  startingOutput: number;
}

export interface PayoutTierConfig {
  effectText: string;
  output: number;
}

interface TileTierDefinition {
  baseCost: number;
  effectTexts: string[];
  upgradeCosts: number[];
}

function clampTier(tier: number): number {
  if (!Number.isFinite(tier)) {
    return DEFAULT_TILE_TIER;
  }

  return Math.min(MAX_TILE_TIER, Math.max(DEFAULT_TILE_TIER, Math.floor(tier)));
}

function getTierIndex(tier: number): number {
  return clampTier(tier) - 1;
}

function formatPercentBonus(percent: number): string {
  return `+${Math.round(percent * 100)}%`;
}

function getBoosterTargetText(includeDiagonals: boolean, radius: number): string {
  if (radius >= 2) {
    return "Miners and Rich Miners within radius 2";
  }

  if (includeDiagonals) {
    return "adjacent and diagonal Miners and Rich Miners";
  }

  return "adjacent Miners and Rich Miners";
}

function createBoosterEffectText(
  bonusPercent: number,
  includeDiagonals: boolean,
  radius: number
): string {
  return `${formatPercentBonus(bonusPercent)} output to ${getBoosterTargetText(includeDiagonals, radius)}`;
}

const minerOutputs = [2, 3, 5, 8, 12, 18, 27, 40, 60, 90] as const;
const richMinerOutputs = [5, 7, 10, 15, 22, 32, 46, 65, 92, 130] as const;
const edgeOutputs = [8, 18, 40, 85, 180, 400, 900, 2100, 5000, 12000] as const;
const cornerOutputs = [14, 30, 70, 150, 320, 700, 1600, 3800, 9000, 22000] as const;
const riskOutputs = [24, 60, 140, 320, 750, 1800, 4500, 11000, 28000, 75000] as const;

const chainTierConfigs = [
  { baseOutput: 2, effectText: "Pays 2 + 2 for each adjacent tile", perNeighborOutput: 2 },
  { baseOutput: 4, effectText: "Pays 4 + 4 for each adjacent tile", perNeighborOutput: 4 },
  { baseOutput: 8, effectText: "Pays 8 + 7 for each adjacent tile", perNeighborOutput: 7 },
  { baseOutput: 15, effectText: "Pays 15 + 12 for each adjacent tile", perNeighborOutput: 12 },
  { baseOutput: 28, effectText: "Pays 28 + 20 for each adjacent tile", perNeighborOutput: 20 },
  { baseOutput: 50, effectText: "Pays 50 + 35 for each adjacent tile", perNeighborOutput: 35 },
  { baseOutput: 90, effectText: "Pays 90 + 60 for each adjacent tile", perNeighborOutput: 60 },
  { baseOutput: 170, effectText: "Pays 170 + 110 for each adjacent tile", perNeighborOutput: 110 },
  { baseOutput: 320, effectText: "Pays 320 + 210 for each adjacent tile", perNeighborOutput: 210 },
  { baseOutput: 650, effectText: "Pays 650 + 420 for each adjacent tile", perNeighborOutput: 420 }
] as const satisfies readonly ChainTierConfig[];

const boosterTierConfigs = [
  {
    bonusPercent: 0.15,
    effectText: createBoosterEffectText(0.15, false, 1),
    includeDiagonals: false,
    radius: 1
  },
  {
    bonusPercent: 0.25,
    effectText: createBoosterEffectText(0.25, false, 1),
    includeDiagonals: false,
    radius: 1
  },
  {
    bonusPercent: 0.4,
    effectText: createBoosterEffectText(0.4, false, 1),
    includeDiagonals: false,
    radius: 1
  },
  {
    bonusPercent: 0.6,
    effectText: createBoosterEffectText(0.6, false, 1),
    includeDiagonals: false,
    radius: 1
  },
  {
    bonusPercent: 0.85,
    effectText: createBoosterEffectText(0.85, false, 1),
    includeDiagonals: false,
    radius: 1
  },
  {
    bonusPercent: 1.15,
    effectText: createBoosterEffectText(1.15, false, 1),
    includeDiagonals: false,
    radius: 1
  },
  {
    bonusPercent: 1.5,
    effectText: createBoosterEffectText(1.5, true, 1),
    includeDiagonals: true,
    radius: 1
  },
  {
    bonusPercent: 1.9,
    effectText: createBoosterEffectText(1.9, true, 2),
    includeDiagonals: true,
    radius: 2
  },
  {
    bonusPercent: 2.4,
    effectText: createBoosterEffectText(2.4, true, 2),
    includeDiagonals: true,
    radius: 2
  },
  {
    bonusPercent: 3,
    effectText: createBoosterEffectText(3, true, 2),
    includeDiagonals: true,
    radius: 2
  }
] as const satisfies readonly BoosterTierConfig[];

const doublerTierConfigs = [
  { effectText: "x2 to 1 adjacent valid tile", maxTargets: 1, multiplier: 2 },
  { effectText: "x2 to up to 2 adjacent valid tiles", maxTargets: 2, multiplier: 2 },
  { effectText: "x2.25 to 1 adjacent valid tile", maxTargets: 1, multiplier: 2.25 },
  { effectText: "x2.25 to up to 2 adjacent valid tiles", maxTargets: 2, multiplier: 2.25 },
  { effectText: "x2.5 to up to 2 adjacent valid tiles", maxTargets: 2, multiplier: 2.5 },
  { effectText: "x2.75 to up to 2 adjacent valid tiles", maxTargets: 2, multiplier: 2.75 },
  { effectText: "x3 to up to 3 adjacent valid tiles", maxTargets: 3, multiplier: 3 },
  { effectText: "x3.5 to up to 3 adjacent valid tiles", maxTargets: 3, multiplier: 3.5 },
  { effectText: "x4 to up to 4 adjacent valid tiles", maxTargets: 4, multiplier: 4 },
  { effectText: "x5 to up to 4 adjacent valid tiles", maxTargets: 4, multiplier: 5 }
] as const satisfies readonly SupportTierConfig[];

const triplerTierConfigs = [
  { effectText: "x3 to 1 adjacent valid tile", maxTargets: 1, multiplier: 3 },
  { effectText: "x3 to up to 2 adjacent valid tiles", maxTargets: 2, multiplier: 3 },
  { effectText: "x3.25 to up to 2 adjacent valid tiles", maxTargets: 2, multiplier: 3.25 },
  { effectText: "x3.5 to up to 2 adjacent valid tiles", maxTargets: 2, multiplier: 3.5 },
  { effectText: "x4 to up to 3 adjacent valid tiles", maxTargets: 3, multiplier: 4 },
  { effectText: "x4.5 to up to 3 adjacent valid tiles", maxTargets: 3, multiplier: 4.5 },
  { effectText: "x5 to up to 4 adjacent valid tiles", maxTargets: 4, multiplier: 5 },
  { effectText: "x6 to up to 4 adjacent valid tiles", maxTargets: 4, multiplier: 6 },
  {
    effectText: "x7.5 to all orthogonally adjacent valid tiles",
    maxTargets: 4,
    multiplier: 7.5
  },
  {
    effectText: "x9 to all orthogonally adjacent valid tiles",
    maxTargets: 4,
    multiplier: 9
  }
] as const satisfies readonly SupportTierConfig[];

const relayTierConfigs = [
  { effectText: "Forwards routed coins in chosen direction", forwardMultiplier: 1 },
  { effectText: "Forwards routed coins with +10% value", forwardMultiplier: 1.1 },
  { effectText: "Forwards routed coins with +25% value", forwardMultiplier: 1.25 },
  {
    effectText: "Forwards routed coins with +40% value and can hold a small buffered amount",
    forwardMultiplier: 1.4
  },
  { effectText: "Forwards routed coins with +60% value", forwardMultiplier: 1.6 },
  { effectText: "Forwards routed coins with +100% value", forwardMultiplier: 2 },
  {
    effectText: "Forwards routed coins with +150% value and can chain through 2 tiles cleanly",
    forwardMultiplier: 2.5
  },
  { effectText: "Forwards routed coins with +225% value", forwardMultiplier: 3.25 },
  { effectText: "Forwards routed coins with +350% value", forwardMultiplier: 4.5 },
  { effectText: "Forwards routed coins with +500% value", forwardMultiplier: 6 }
] as const satisfies readonly RelayTierConfig[];

const splitterTierConfigs = [
  { copyMultiplier: 0.5, effectText: "Copies 50% of 1 adjacent payout", maxTargets: 1 },
  { copyMultiplier: 0.75, effectText: "Copies 75% of 1 adjacent payout", maxTargets: 1 },
  { copyMultiplier: 1, effectText: "Copies 100% of 1 adjacent payout", maxTargets: 1 },
  { copyMultiplier: 1, effectText: "Copies 100% of 2 adjacent payouts", maxTargets: 2 },
  { copyMultiplier: 1.25, effectText: "Copies 125% of 2 adjacent payouts", maxTargets: 2 },
  { copyMultiplier: 1.5, effectText: "Copies 150% of 2 adjacent payouts", maxTargets: 2 },
  { copyMultiplier: 1.75, effectText: "Copies 175% of 3 adjacent payouts", maxTargets: 3 },
  { copyMultiplier: 2.25, effectText: "Copies 225% of 3 adjacent payouts", maxTargets: 3 },
  { copyMultiplier: 3, effectText: "Copies 300% of 4 adjacent payouts", maxTargets: 4 },
  { copyMultiplier: 4, effectText: "Copies 400% of 4 adjacent payouts", maxTargets: 4 }
] as const satisfies readonly SplitterTierConfig[];

const bankTierConfigs = [
  {
    allowInstantDirectRelease: false,
    effectText: "Gains 1% every 10s, timed release",
    interestRate: 0.01,
    releaseOptions: [10, 20, 40],
    storageCap: 1000
  },
  {
    allowInstantDirectRelease: false,
    effectText: "Gains 2% every 10s, more release timer options",
    interestRate: 0.02,
    releaseOptions: [10, 20, 40, 80],
    storageCap: 2500
  },
  {
    allowInstantDirectRelease: false,
    effectText: "Gains 3% every 10s",
    interestRate: 0.03,
    releaseOptions: [10, 20, 40, 80],
    storageCap: 7000
  },
  {
    allowInstantDirectRelease: false,
    effectText: "Gains 4% every 10s, bigger storage cap",
    interestRate: 0.04,
    releaseOptions: [10, 20, 40, 80],
    storageCap: 25000
  },
  {
    allowInstantDirectRelease: false,
    effectText: "Gains 6% every 10s, faster release timer options",
    interestRate: 0.06,
    releaseOptions: [5, 10, 20, 40, 80],
    storageCap: 100000
  },
  {
    allowInstantDirectRelease: false,
    effectText: "Gains 8% every 10s",
    interestRate: 0.08,
    releaseOptions: [5, 10, 20, 40, 80],
    storageCap: 400000
  },
  {
    allowInstantDirectRelease: false,
    effectText: "Gains 12% every 10s, faster release intervals",
    interestRate: 0.12,
    releaseOptions: [2, 5, 10, 20, 40, 80],
    storageCap: 1500000
  },
  {
    allowInstantDirectRelease: false,
    effectText: "Gains 18% every 10s",
    interestRate: 0.18,
    releaseOptions: [2, 5, 10, 20, 40, 80],
    storageCap: 6000000
  },
  {
    allowInstantDirectRelease: false,
    effectText: "Gains 26% every 10s",
    interestRate: 0.26,
    releaseOptions: [2, 5, 10, 20, 40, 80],
    storageCap: 20000000
  },
  {
    allowInstantDirectRelease: false,
    effectText: "Gains 40% every 10s",
    interestRate: 0.4,
    releaseOptions: [2, 5, 10, 20, 40, 80],
    storageCap: 100000000
  }
] as const satisfies readonly StorageTierConfig[];

const vaultTierConfigs = [
  {
    allowInstantDirectRelease: false,
    effectText: "Gains 2% every 10s, slower release",
    interestRate: 0.02,
    releaseOptions: [20, 40, 80],
    storageCap: 10000
  },
  {
    allowInstantDirectRelease: false,
    effectText: "Gains 3.5% every 10s",
    interestRate: 0.035,
    releaseOptions: [20, 40, 80],
    storageCap: 30000
  },
  {
    allowInstantDirectRelease: false,
    effectText: "Gains 5% every 10s",
    interestRate: 0.05,
    releaseOptions: [20, 40, 80],
    storageCap: 100000
  },
  {
    allowInstantDirectRelease: false,
    effectText: "Gains 7% every 10s, larger cap",
    interestRate: 0.07,
    releaseOptions: [20, 40, 80],
    storageCap: 500000
  },
  {
    allowInstantDirectRelease: false,
    effectText: "Gains 10% every 10s",
    interestRate: 0.1,
    releaseOptions: [20, 40, 80],
    storageCap: 2000000
  },
  {
    allowInstantDirectRelease: false,
    effectText: "Gains 14% every 10s",
    interestRate: 0.14,
    releaseOptions: [20, 40, 80],
    storageCap: 8000000
  },
  {
    allowInstantDirectRelease: false,
    effectText: "Gains 20% every 10s, smarter release timing",
    interestRate: 0.2,
    releaseOptions: [10, 20, 40, 80],
    storageCap: 30000000
  },
  {
    allowInstantDirectRelease: false,
    effectText: "Gains 30% every 10s",
    interestRate: 0.3,
    releaseOptions: [10, 20, 40, 80],
    storageCap: 120000000
  },
  {
    allowInstantDirectRelease: false,
    effectText: "Gains 45% every 10s",
    interestRate: 0.45,
    releaseOptions: [10, 20, 40, 80],
    storageCap: 500000000
  },
  {
    allowInstantDirectRelease: false,
    effectText: "Gains 70% every 10s",
    interestRate: 0.7,
    releaseOptions: [10, 20, 40, 80],
    storageCap: 2000000000
  }
] as const satisfies readonly StorageTierConfig[];

const investmentTierConfigs = [
  {
    effectText: "Pays 5% of stored coins each second without spending principal",
    payoutRate: 0.05
  },
  {
    effectText: "Pays 7% of stored coins each second without spending principal",
    payoutRate: 0.07
  },
  {
    effectText: "Pays 10% of stored coins each second without spending principal",
    payoutRate: 0.1
  },
  {
    effectText: "Pays 14% of stored coins each second without spending principal",
    payoutRate: 0.14
  },
  {
    effectText: "Pays 20% of stored coins each second without spending principal",
    payoutRate: 0.2
  },
  {
    effectText: "Pays 28% of stored coins each second without spending principal",
    payoutRate: 0.28
  },
  {
    effectText: "Pays 40% of stored coins each second without spending principal",
    payoutRate: 0.4
  },
  {
    effectText: "Pays 58% of stored coins each second without spending principal",
    payoutRate: 0.58
  },
  {
    effectText: "Pays 85% of stored coins each second without spending principal",
    payoutRate: 0.85
  },
  {
    effectText: "Pays 125% of stored coins each second without spending principal",
    payoutRate: 1.25
  }
] as const satisfies readonly InvestmentTierConfig[];

const cleanerTierConfigs = [
  {
    effectText: "Resets adjacent Decay Tiles to full output",
    includeDiagonals: false,
    radius: 1,
    resetIntervalSeconds: 10
  },
  {
    effectText: "Auto-resets every 8s",
    includeDiagonals: false,
    radius: 1,
    resetIntervalSeconds: 8
  },
  {
    effectText: "Auto-resets every 5s",
    includeDiagonals: false,
    radius: 1,
    resetIntervalSeconds: 5
  },
  {
    effectText: "Auto-resets every 3s",
    includeDiagonals: false,
    radius: 1,
    resetIntervalSeconds: 3
  },
  {
    effectText: "Affects diagonals too",
    includeDiagonals: true,
    radius: 1,
    resetIntervalSeconds: 3
  },
  {
    effectText: "Affects diagonals too and resets every 2s",
    includeDiagonals: true,
    radius: 1,
    resetIntervalSeconds: 2
  },
  {
    effectText: "Affects radius 2",
    includeDiagonals: true,
    radius: 2,
    resetIntervalSeconds: 2
  },
  {
    effectText: "Affects radius 2 and resets every 1s",
    includeDiagonals: true,
    radius: 2,
    resetIntervalSeconds: 1
  },
  {
    effectText: "Affects radius 2 and resets every 0.5s",
    includeDiagonals: true,
    radius: 2,
    resetIntervalSeconds: 1
  },
  {
    effectText: "Affects radius 3 and resets every 0.25s",
    includeDiagonals: true,
    radius: 3,
    resetIntervalSeconds: 1
  }
] as const satisfies readonly CleanerTierConfig[];

const anchorTierConfigs = [
  { bonusMultiplier: 1, effectText: "Routed coins sent into it cash out instantly" },
  { bonusMultiplier: 1.15, effectText: "Instant cashout with +15% bonus" },
  { bonusMultiplier: 1.35, effectText: "Instant cashout with +35% bonus" },
  { bonusMultiplier: 1.6, effectText: "Instant cashout with +60% bonus" },
  { bonusMultiplier: 2, effectText: "Instant cashout with +100% bonus" },
  { bonusMultiplier: 2.5, effectText: "Instant cashout with +150% bonus" },
  { bonusMultiplier: 3.25, effectText: "Instant cashout with +225% bonus" },
  { bonusMultiplier: 4.25, effectText: "Instant cashout with +325% bonus" },
  { bonusMultiplier: 6, effectText: "Instant cashout with +500% bonus" },
  { bonusMultiplier: 9, effectText: "Instant cashout with +800% bonus" }
] as const satisfies readonly AnchorTierConfig[];

const decayTierConfigs = [
  {
    decayIntervalSeconds: 10,
    effectText: "Starts at 18 output and loses 1 every 10s until cleaned",
    startingOutput: 18
  },
  {
    decayIntervalSeconds: 14,
    effectText: "Starts at 30 output and loses 1 every 14s until cleaned",
    startingOutput: 30
  },
  {
    decayIntervalSeconds: 18,
    effectText: "Starts at 50 output and loses 1 every 18s until cleaned",
    startingOutput: 50
  },
  {
    decayIntervalSeconds: 24,
    effectText: "Starts at 80 output and loses 1 every 24s until cleaned",
    startingOutput: 80
  },
  {
    decayIntervalSeconds: 32,
    effectText: "Starts at 130 output and loses 1 every 32s until cleaned",
    startingOutput: 130
  },
  {
    decayIntervalSeconds: 42,
    effectText: "Starts at 220 output and loses 1 every 42s until cleaned",
    startingOutput: 220
  },
  {
    decayIntervalSeconds: 55,
    effectText: "Starts at 380 output and loses 1 every 55s until cleaned",
    startingOutput: 380
  },
  {
    decayIntervalSeconds: 75,
    effectText: "Starts at 700 output and loses 1 every 75s until cleaned",
    startingOutput: 700
  },
  {
    decayIntervalSeconds: 100,
    effectText: "Starts at 1.4k output and loses 1 every 100s until cleaned",
    startingOutput: 1400
  },
  {
    decayIntervalSeconds: 140,
    effectText: "Starts at 3k output and loses 1 every 140s until cleaned",
    startingOutput: 3000
  }
] as const satisfies readonly DecayTierConfig[];

const tileTierDefinitions: Record<TileId, TileTierDefinition> = {
  anchor: {
    baseCost: 26,
    effectTexts: anchorTierConfigs.map((config) => config.effectText),
    upgradeCosts: [140, 500, 1700, 5500, 18000, 60000, 210000, 750000, 2700000]
  },
  bank: {
    baseCost: 40,
    effectTexts: bankTierConfigs.map((config) => config.effectText),
    upgradeCosts: [250, 900, 3000, 10000, 35000, 120000, 420000, 1500000, 5000000]
  },
  booster: {
    baseCost: 36,
    effectTexts: boosterTierConfigs.map((config) => config.effectText),
    upgradeCosts: [180, 700, 2500, 8000, 25000, 80000, 250000, 900000, 3500000]
  },
  chain: {
    baseCost: 32,
    effectTexts: chainTierConfigs.map((config) => config.effectText),
    upgradeCosts: [180, 700, 2200, 7000, 22000, 70000, 220000, 750000, 2800000]
  },
  cleaner: {
    baseCost: 40,
    effectTexts: cleanerTierConfigs.map((config) => config.effectText),
    upgradeCosts: [180, 650, 2100, 7000, 22000, 70000, 230000, 800000, 3000000]
  },
  corner: {
    baseCost: 44,
    effectTexts: cornerOutputs.map((output) => `Pays ${formatTierNumber(output)} if in a board corner`),
    upgradeCosts: [220, 900, 3000, 10000, 30000, 100000, 350000, 1200000, 4000000]
  },
  decay: {
    baseCost: 52,
    effectTexts: decayTierConfigs.map((config) => config.effectText),
    upgradeCosts: [260, 900, 3000, 10000, 35000, 120000, 400000, 1400000, 5000000]
  },
  doubler: {
    baseCost: 30,
    effectTexts: doublerTierConfigs.map((config) => config.effectText),
    upgradeCosts: [220, 850, 2800, 9000, 28000, 90000, 300000, 1000000, 3500000]
  },
  edge: {
    baseCost: 28,
    effectTexts: edgeOutputs.map((output, index) =>
      index === 0 ? "Pays 8 if on board edge" : `Pays ${output >= 1000 ? formatTierNumber(output) : output} if on board edge`
    ),
    upgradeCosts: [160, 700, 2500, 8000, 25000, 80000, 250000, 850000, 3000000]
  },
  investment: {
    baseCost: 72,
    effectTexts: investmentTierConfigs.map((config) => config.effectText),
    upgradeCosts: [400, 1500, 5000, 18000, 60000, 200000, 700000, 2500000, 9000000]
  },
  miner: {
    baseCost: 8,
    effectTexts: minerOutputs.map((output) => `Makes ${formatTierNumber(output)} coins each second.`),
    upgradeCosts: [100, 500, 2500, 10000, 40000, 150000, 600000, 2500000, 10000000]
  },
  relay: {
    baseCost: 18,
    effectTexts: relayTierConfigs.map((config) => config.effectText),
    upgradeCosts: [120, 400, 1300, 4000, 12000, 40000, 130000, 450000, 1600000]
  },
  rich_miner: {
    baseCost: 22,
    effectTexts: richMinerOutputs.map((output) => `Makes ${formatTierNumber(output)} coins each second.`),
    upgradeCosts: [180, 900, 4000, 16000, 60000, 220000, 850000, 3200000, 12000000]
  },
  risk: {
    baseCost: 60,
    effectTexts: riskOutputs.map((output) => `Pays ${formatTierNumber(output)} only with exactly 2 adjacent tiles`),
    upgradeCosts: [300, 1200, 4000, 14000, 45000, 150000, 500000, 1800000, 6500000]
  },
  splitter: {
    baseCost: 46,
    effectTexts: splitterTierConfigs.map((config) => config.effectText),
    upgradeCosts: [260, 900, 3000, 10000, 34000, 110000, 380000, 1300000, 4500000]
  },
  tripler: {
    baseCost: 54,
    effectTexts: triplerTierConfigs.map((config) => config.effectText),
    upgradeCosts: [320, 1100, 3800, 12000, 40000, 130000, 420000, 1500000, 5000000]
  },
  vault: {
    baseCost: 96,
    effectTexts: vaultTierConfigs.map((config) => config.effectText),
    upgradeCosts: [500, 1800, 6000, 20000, 70000, 250000, 900000, 3200000, 11000000]
  }
};

function formatTierNumber(value: number): string {
  if (value >= 1000000) {
    const millions = value / 1000000;
    return Number.isInteger(millions) ? `${millions}m` : `${millions.toFixed(1)}m`;
  }

  if (value >= 1000) {
    const thousands = value / 1000;
    return Number.isInteger(thousands) ? `${thousands}k` : `${thousands.toFixed(1)}k`;
  }

  return String(value);
}

function getDefinition(tileId: TileId): TileTierDefinition {
  return tileTierDefinitions[tileId];
}

export function normalizeTileTier(tier: number | null | undefined): number {
  return clampTier(tier ?? DEFAULT_TILE_TIER);
}

export function getBaseTileCost(tileId: TileId): number {
  return getDefinition(tileId).baseCost;
}

export function getTileEffectText(tileId: TileId, tier: number): string {
  return getDefinition(tileId).effectTexts[getTierIndex(tier)];
}

export function getNextTileEffectText(tileId: TileId, tier: number): string | null {
  const normalizedTier = clampTier(tier);

  if (normalizedTier >= MAX_TILE_TIER) {
    return null;
  }

  return getTileEffectText(tileId, normalizedTier + 1);
}

export function getTileUpgradeCost(
  tileId: TileId,
  currentTier: number,
  costMultiplier = 1
): number | null {
  const normalizedTier = clampTier(currentTier);

  if (normalizedTier >= MAX_TILE_TIER) {
    return null;
  }

  const baseCost = getDefinition(tileId).upgradeCosts[normalizedTier - 1] ?? null;

  if (baseCost === null) {
    return null;
  }

  return Math.max(1, Math.ceil(baseCost * costMultiplier));
}

export function getTileOutput(tileId: "edge" | "corner" | "miner" | "rich_miner" | "risk", tier: number): number {
  const index = getTierIndex(tier);

  switch (tileId) {
    case "miner":
      return minerOutputs[index];
    case "rich_miner":
      return richMinerOutputs[index];
    case "edge":
      return edgeOutputs[index];
    case "corner":
      return cornerOutputs[index];
    case "risk":
      return riskOutputs[index];
  }
}

export function getBoosterTierConfig(tier: number): BoosterTierConfig {
  return boosterTierConfigs[getTierIndex(tier)];
}

export function getDoublerTierConfig(tier: number): SupportTierConfig {
  return doublerTierConfigs[getTierIndex(tier)];
}

export function getTriplerTierConfig(tier: number): SupportTierConfig {
  return triplerTierConfigs[getTierIndex(tier)];
}

export function getRelayTierConfig(tier: number): RelayTierConfig {
  return relayTierConfigs[getTierIndex(tier)];
}

export function getSplitterTierConfig(tier: number): SplitterTierConfig {
  return splitterTierConfigs[getTierIndex(tier)];
}

export function getChainTierConfig(tier: number): ChainTierConfig {
  return chainTierConfigs[getTierIndex(tier)];
}

export function getBankTierConfig(tier: number): StorageTierConfig {
  return bankTierConfigs[getTierIndex(tier)];
}

export function getVaultTierConfig(tier: number): StorageTierConfig {
  return vaultTierConfigs[getTierIndex(tier)];
}

export function getInvestmentTierConfig(tier: number): InvestmentTierConfig {
  return investmentTierConfigs[getTierIndex(tier)];
}

export function getCleanerTierConfig(tier: number): CleanerTierConfig {
  return cleanerTierConfigs[getTierIndex(tier)];
}

export function getAnchorTierConfig(tier: number): AnchorTierConfig {
  return anchorTierConfigs[getTierIndex(tier)];
}

export function getDecayTierConfig(tier: number): DecayTierConfig {
  return decayTierConfigs[getTierIndex(tier)];
}

export function getReleaseOptionsForTier(tileId: "bank" | "vault", tier: number): ReleaseSeconds[] {
  return tileId === "bank"
    ? getBankTierConfig(tier).releaseOptions
    : getVaultTierConfig(tier).releaseOptions;
}
