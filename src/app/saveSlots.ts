import type { AppSnapshot } from "./store";

export const SAVE_SLOT_COUNT = 5;

const SAVE_SLOTS_STORAGE_KEY = "coin-chain-save-slots-v1";

export interface SaveSlotSummary {
  boardSummary: string;
  dayLabel: string;
  difficultyLabel: string;
  money: number;
  modeLabel: string;
  savedAt: number;
  slotIndex: number;
}

export interface SaveSlotData {
  savedAt: number;
  snapshot: AppSnapshot;
  summary: SaveSlotSummary;
  version: 1;
}

export interface SaveSlotsState {
  activeSlotIndex: number | null;
  slots: Array<SaveSlotData | null>;
  version: 1;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isSaveSlotData(value: unknown): value is SaveSlotData {
  return (
    isRecord(value) &&
    value.version === 1 &&
    typeof value.savedAt === "number" &&
    isRecord(value.summary) &&
    isRecord(value.snapshot)
  );
}

function getEmptySaveSlotsState(): SaveSlotsState {
  return {
    activeSlotIndex: null,
    slots: Array.from({ length: SAVE_SLOT_COUNT }, () => null),
    version: 1
  };
}

export function buildSaveSlotSummary(
  slotIndex: number,
  snapshot: AppSnapshot,
  savedAt = Date.now()
): SaveSlotSummary {
  const placedCount = Object.keys(snapshot.placedTiles).length;

  return {
    boardSummary: `${placedCount} tiles / ${snapshot.boardRows}x${snapshot.boardColumns}`,
    dayLabel:
      snapshot.mode === "endless"
        ? `Cycle ${snapshot.lastResolvedCycle ?? 0}`
        : `Day ${snapshot.currentLevelIndex + 1}`,
    difficultyLabel:
      snapshot.mode === "endless" ? "Open Run" : snapshot.campaignDifficultyName ?? "Easy",
    money: snapshot.coins,
    modeLabel: snapshot.mode === "endless" ? "Endless" : "Campaign",
    savedAt,
    slotIndex
  };
}

export function normalizeSaveSlotsState(value: unknown): SaveSlotsState {
  if (!isRecord(value) || value.version !== 1) {
    return getEmptySaveSlotsState();
  }

  const rawSlots = value.slots;

  if (!Array.isArray(rawSlots)) {
    return getEmptySaveSlotsState();
  }

  const slots = Array.from({ length: SAVE_SLOT_COUNT }, (_, index) => {
    const slotValue = rawSlots[index];
    return isSaveSlotData(slotValue) ? slotValue : null;
  });
  const activeSlotIndex =
    typeof value.activeSlotIndex === "number" &&
    Number.isInteger(value.activeSlotIndex) &&
    value.activeSlotIndex >= 0 &&
    value.activeSlotIndex < SAVE_SLOT_COUNT
      ? value.activeSlotIndex
      : null;

  return {
    activeSlotIndex,
    slots,
    version: 1
  };
}

export function readSaveSlotsState(): SaveSlotsState {
  try {
    const raw = window.localStorage.getItem(SAVE_SLOTS_STORAGE_KEY);

    if (!raw) {
      return getEmptySaveSlotsState();
    }

    return normalizeSaveSlotsState(JSON.parse(raw));
  } catch {
    return getEmptySaveSlotsState();
  }
}

export function writeSaveSlotsState(state: SaveSlotsState) {
  try {
    window.localStorage.setItem(SAVE_SLOTS_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage failures and keep the local session usable.
  }
}

export function withActiveSaveSlot(
  state: SaveSlotsState,
  activeSlotIndex: number | null
): SaveSlotsState {
  return {
    ...state,
    activeSlotIndex
  };
}

export function withSaveSlot(
  state: SaveSlotsState,
  slotIndex: number,
  snapshot: AppSnapshot,
  savedAt = Date.now()
): SaveSlotsState {
  const nextSlots = [...state.slots];

  nextSlots[slotIndex] = {
    savedAt,
    snapshot,
    summary: buildSaveSlotSummary(slotIndex, snapshot, savedAt),
    version: 1
  };

  return {
    activeSlotIndex: slotIndex,
    slots: nextSlots,
    version: 1
  };
}

export function withClearedSaveSlot(
  state: SaveSlotsState,
  slotIndex: number
): SaveSlotsState {
  const nextSlots = [...state.slots];
  nextSlots[slotIndex] = null;

  return {
    activeSlotIndex: state.activeSlotIndex === slotIndex ? null : state.activeSlotIndex,
    slots: nextSlots,
    version: 1
  };
}

export function getContinueSaveSlotIndex(state: SaveSlotsState): number | null {
  if (
    state.activeSlotIndex !== null &&
    state.slots[state.activeSlotIndex] !== null
  ) {
    return state.activeSlotIndex;
  }

  let nextIndex: number | null = null;
  let latestSavedAt = -1;

  state.slots.forEach((slot, index) => {
    if (!slot || slot.savedAt <= latestSavedAt) {
      return;
    }

    latestSavedAt = slot.savedAt;
    nextIndex = index;
  });

  return nextIndex;
}
