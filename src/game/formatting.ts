const compactFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
  notation: "compact"
});

export function formatCompactNumber(value: number): string {
  if (!Number.isFinite(value)) {
    return "0";
  }

  const absoluteValue = Math.abs(value);

  if (absoluteValue < 10 && Math.abs(value % 1) > 0.001) {
    return value.toFixed(1);
  }

  if (absoluteValue < 1000) {
    return String(Math.round(value));
  }

  return compactFormatter.format(value);
}

export function formatCoins(value: number): string {
  return `${formatCompactNumber(value)}c`;
}

export function formatSpeedLabel(speed: number): string {
  return speed === 0 ? "Paused" : `${speed}x`;
}
