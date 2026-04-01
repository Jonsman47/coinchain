export const DAY_DURATION_SECONDS = 12 * 60;
export const DAY_TOTAL_HOURS = 12;
const DAY_TOTAL_MINUTES = DAY_TOTAL_HOURS * 60;

function clampDaySeconds(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(DAY_DURATION_SECONDS, Math.floor(value)));
}

function formatClockFromMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${hours}:${String(minutes).padStart(2, "0")}`;
}

export function getRemainingDaySeconds(completedCycles: number): number {
  return Math.max(0, DAY_DURATION_SECONDS - clampDaySeconds(completedCycles));
}

export function isDayComplete(completedCycles: number): boolean {
  return clampDaySeconds(completedCycles) >= DAY_DURATION_SECONDS;
}

export function formatElapsedDayClock(completedCycles: number): string {
  const elapsedMinutes = Math.floor(
    (clampDaySeconds(completedCycles) / DAY_DURATION_SECONDS) * DAY_TOTAL_MINUTES
  );

  return formatClockFromMinutes(elapsedMinutes);
}

export function formatRemainingDayClock(completedCycles: number): string {
  const remainingMinutes = Math.ceil(
    (getRemainingDaySeconds(completedCycles) / DAY_DURATION_SECONDS) * DAY_TOTAL_MINUTES
  );

  return formatClockFromMinutes(remainingMinutes);
}
