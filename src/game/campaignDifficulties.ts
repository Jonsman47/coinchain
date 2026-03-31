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
      "Relaxed mode. Current Coin Chain balance. Keep your money between days and learn the systems.",
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
      "A small step up from Easy. Slightly higher day goals, but still forgiving.",
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
      "Higher quotas and slightly pricier growth. You need a better build, not just more tiles.",
    expansionCostMultiplier: 1.1,
    id: "medium",
    keepMoneyBetweenDays: true,
    name: "Medium",
    showPrediction: false,
    tileCostMultiplier: 1.1,
    upgradeCostMultiplier: 1.1
  },
  hard: {
    description:
      "Aggressive quotas that ramp every day. Mistakes are costly, but money still carries over.",
    expansionCostMultiplier: 1.25,
    id: "hard",
    keepMoneyBetweenDays: true,
    name: "Hard",
    showPrediction: false,
    tileCostMultiplier: 1.25,
    upgradeCostMultiplier: 1.3
  },
  insane: {
    description:
      "Brutal scaling and expensive growth. Strong planning and tile synergy are required.",
    expansionCostMultiplier: 1.4,
    id: "insane",
    keepMoneyBetweenDays: true,
    name: "Insane",
    showPrediction: false,
    tileCostMultiplier: 1.45,
    upgradeCostMultiplier: 1.5
  },
  extreme: {
    description:
      "Every day is a fresh cash sprint. Your board remains, but your money does not.",
    expansionCostMultiplier: 1.6,
    id: "extreme",
    keepMoneyBetweenDays: false,
    name: "Extreme",
    showPrediction: false,
    tileCostMultiplier: 1.7,
    upgradeCostMultiplier: 1.8
  },
  hardcore: {
    description:
      "Near-perfect optimization only. Extremely punishing quotas, high prices, and no saved cash.",
    expansionCostMultiplier: 1.85,
    id: "hardcore",
    keepMoneyBetweenDays: false,
    name: "Hardcore",
    showPrediction: false,
    tileCostMultiplier: 2,
    upgradeCostMultiplier: 2.2
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

function getGoalMultiplier(
  difficultyId: CampaignDifficultyId,
  dayNumber: number
): number {
  const getCompoundingMultiplier = (
    day1: number,
    day2: number,
    day3: number,
    dailyGrowth: number
  ) => {
    if (dayNumber === 1) {
      return day1;
    }

    if (dayNumber === 2) {
      return day2;
    }

    if (dayNumber === 3) {
      return day3;
    }

    return day3 * dailyGrowth ** (dayNumber - 3);
  };

  switch (difficultyId) {
    case "easy":
      return getCompoundingMultiplier(1, 1.6, 2.3, 1.13);
    case "normal":
      return getCompoundingMultiplier(1.35, 2.5, 4.2, 1.15);
    case "medium":
      return getCompoundingMultiplier(3, 7, 12.5, 1.17);
    case "hard":
      return getCompoundingMultiplier(10, 24, 42, 1.19);
    case "insane":
      return getCompoundingMultiplier(15, 38, 68, 1.205);
    case "extreme":
      return getCompoundingMultiplier(22, 58, 105, 1.22);
    case "hardcore":
      return getCompoundingMultiplier(30, 82, 150, 1.24);
  }
}

export function scaleGoalsForDifficulty(
  goals: DayGoal[],
  difficultyId: CampaignDifficultyId,
  dayNumber: number
): DayGoal[] {
  const multiplier = getGoalMultiplier(difficultyId, dayNumber);

  if (multiplier === 1) {
    return goals.map((goal) => ({ ...goal }));
  }

  return goals.map((goal) => ({
    ...goal,
    target: Math.max(1, Math.ceil(goal.target * multiplier))
  }));
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
