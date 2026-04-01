import { getCampaignDailyGoals } from "./campaignDailyGoals";
import type { DayGoal } from "./levels";

export type CampaignDifficultyId =
  | "easy"
  | "normal"
  | "medium"
  | "hard"
  | "insane"
  | "extreme"
  | "hardcore";

export interface CampaignDifficultyDefinition {
  description: string;
  expansionCostMultiplier: number;
  id: CampaignDifficultyId;
  keepMoneyBetweenDays: boolean;
  name: string;
  showPrediction: boolean;
  tileCostMultiplier: number;
  upgradeCostMultiplier: number;
}

const campaignDifficultyDefinitions: Record<
  CampaignDifficultyId,
  CampaignDifficultyDefinition
> = {
  easy: {
    description:
      "Relaxed mode. Forgiving quotas, clear forecasts, and full cash carryover.",
    expansionCostMultiplier: 1,
    id: "easy",
    keepMoneyBetweenDays: true,
    name: "Easy",
    showPrediction: true,
    tileCostMultiplier: 1,
    upgradeCostMultiplier: 1
  },
  normal: {
    description:
      "Fair carryover mode. You still get forecasts, but the day goals ask for cleaner planning.",
    expansionCostMultiplier: 1,
    id: "normal",
    keepMoneyBetweenDays: true,
    name: "Normal",
    showPrediction: true,
    tileCostMultiplier: 1,
    upgradeCostMultiplier: 1
  },
  medium: {
    description:
      "Forecasts are gone and the board needs to be efficient. Good play should clear it.",
    expansionCostMultiplier: 1.08,
    id: "medium",
    keepMoneyBetweenDays: true,
    name: "Medium",
    showPrediction: false,
    tileCostMultiplier: 1.08,
    upgradeCostMultiplier: 1.1
  },
  hard: {
    description:
      "Strong quotas, pricier growth, and very little slack. Strong optimization should feel rewarding.",
    expansionCostMultiplier: 1.16,
    id: "hard",
    keepMoneyBetweenDays: true,
    name: "Hard",
    showPrediction: false,
    tileCostMultiplier: 1.16,
    upgradeCostMultiplier: 1.22
  },
  insane: {
    description:
      "Punishing quotas and harsher prices. You need a tight board and almost no wasted spend.",
    expansionCostMultiplier: 1.28,
    id: "insane",
    keepMoneyBetweenDays: true,
    name: "Insane",
    showPrediction: false,
    tileCostMultiplier: 1.28,
    upgradeCostMultiplier: 1.35
  },
  extreme: {
    description:
      "A fresh cash sprint every day. Your board remains, but every quota must be met from reset money.",
    expansionCostMultiplier: 1.4,
    id: "extreme",
    keepMoneyBetweenDays: false,
    name: "Extreme",
    showPrediction: false,
    tileCostMultiplier: 1.4,
    upgradeCostMultiplier: 1.5
  },
  hardcore: {
    description:
      "Near-perfect optimization only. No saved cash, tighter growth, and brutal quotas from the start.",
    expansionCostMultiplier: 1.55,
    id: "hardcore",
    keepMoneyBetweenDays: false,
    name: "Hardcore",
    showPrediction: false,
    tileCostMultiplier: 1.55,
    upgradeCostMultiplier: 1.7
  }
};

export const campaignDifficulties: CampaignDifficultyDefinition[] = [
  campaignDifficultyDefinitions.easy,
  campaignDifficultyDefinitions.normal,
  campaignDifficultyDefinitions.medium,
  campaignDifficultyDefinitions.hard,
  campaignDifficultyDefinitions.insane,
  campaignDifficultyDefinitions.extreme,
  campaignDifficultyDefinitions.hardcore
];

export function getCampaignDifficulty(
  difficultyId: CampaignDifficultyId
): CampaignDifficultyDefinition {
  return campaignDifficultyDefinitions[difficultyId];
}

export function scaleGoalsForDifficulty(
  goals: DayGoal[],
  difficultyId: CampaignDifficultyId,
  dayNumber: number
): DayGoal[] {
  void goals;
  return getCampaignDailyGoals(difficultyId, dayNumber);
}

export function applyDifficultyPriceMultiplier(
  baseValue: number,
  multiplier: number
): number {
  if (multiplier === 1) {
    return baseValue;
  }

  return Math.max(1, Math.ceil(baseValue * multiplier));
}
