export type GlowIntensity = "high" | "low" | "medium";

export interface AppSettings {
  autoSaveOnDayEnd: boolean;
  autoSaveOnExit: boolean;
  brightness: number;
  confirmBeforeOverwriteSaveSlot: boolean;
  confirmBeforeQuitRun: boolean;
  continueSimulationInBackground: boolean;
  fullscreen: boolean;
  glowIntensity: GlowIntensity;
  highQualityEffects: boolean;
  largeTextMode: boolean;
  masterVolume: number;
  musicVolume: number;
  muteAll: boolean;
  panSensitivity: number;
  pauseOnFocusLoss: boolean;
  reducedMotion: boolean;
  sfxVolume: number;
  showAdvancedTileStats: boolean;
  showFloatingGainText: boolean;
  showPredictionPanel: boolean;
  showTileDescriptionsOnHover: boolean;
  showTooltips: boolean;
  uiScale: number;
  uiVolume: number;
  zoomSensitivity: number;
}

export interface AppSettingsBridge {
  get: () => AppSettings;
  subscribe: (listener: (settings: AppSettings) => void) => () => void;
}

const SETTINGS_STORAGE_KEY = "coin-chain-settings-v2";

export const defaultSettings: AppSettings = {
  autoSaveOnDayEnd: true,
  autoSaveOnExit: true,
  brightness: 1,
  confirmBeforeOverwriteSaveSlot: true,
  confirmBeforeQuitRun: true,
  continueSimulationInBackground: true,
  fullscreen: false,
  glowIntensity: "medium",
  highQualityEffects: true,
  largeTextMode: false,
  masterVolume: 0.75,
  musicVolume: 0.42,
  muteAll: false,
  panSensitivity: 1,
  pauseOnFocusLoss: false,
  reducedMotion: false,
  sfxVolume: 0.72,
  showAdvancedTileStats: true,
  showFloatingGainText: true,
  showPredictionPanel: true,
  showTileDescriptionsOnHover: true,
  showTooltips: true,
  uiScale: 1,
  uiVolume: 0.65,
  zoomSensitivity: 1
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function clamp(value: unknown, minimum: number, maximum: number, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(maximum, Math.max(minimum, value));
}

function getBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function getGlowIntensity(value: unknown, fallback: GlowIntensity): GlowIntensity {
  return value === "low" || value === "medium" || value === "high" ? value : fallback;
}

export function normalizeSettings(value: unknown): AppSettings {
  if (!isRecord(value)) {
    return { ...defaultSettings };
  }

  return {
    autoSaveOnDayEnd: getBoolean(value.autoSaveOnDayEnd, defaultSettings.autoSaveOnDayEnd),
    autoSaveOnExit: getBoolean(value.autoSaveOnExit, defaultSettings.autoSaveOnExit),
    brightness: clamp(value.brightness, 0.8, 1.2, defaultSettings.brightness),
    confirmBeforeOverwriteSaveSlot: getBoolean(
      value.confirmBeforeOverwriteSaveSlot,
      defaultSettings.confirmBeforeOverwriteSaveSlot
    ),
    confirmBeforeQuitRun: getBoolean(
      value.confirmBeforeQuitRun,
      defaultSettings.confirmBeforeQuitRun
    ),
    continueSimulationInBackground: getBoolean(
      value.continueSimulationInBackground,
      defaultSettings.continueSimulationInBackground
    ),
    fullscreen: getBoolean(value.fullscreen, defaultSettings.fullscreen),
    glowIntensity: getGlowIntensity(value.glowIntensity, defaultSettings.glowIntensity),
    highQualityEffects: getBoolean(value.highQualityEffects, defaultSettings.highQualityEffects),
    largeTextMode: getBoolean(value.largeTextMode, defaultSettings.largeTextMode),
    masterVolume: clamp(value.masterVolume, 0, 1, defaultSettings.masterVolume),
    musicVolume: clamp(value.musicVolume, 0, 1, defaultSettings.musicVolume),
    muteAll: getBoolean(value.muteAll, defaultSettings.muteAll),
    panSensitivity: clamp(value.panSensitivity, 0.6, 1.6, defaultSettings.panSensitivity),
    pauseOnFocusLoss: getBoolean(value.pauseOnFocusLoss, defaultSettings.pauseOnFocusLoss),
    reducedMotion: getBoolean(value.reducedMotion, defaultSettings.reducedMotion),
    sfxVolume: clamp(value.sfxVolume, 0, 1, defaultSettings.sfxVolume),
    showAdvancedTileStats: getBoolean(
      value.showAdvancedTileStats,
      defaultSettings.showAdvancedTileStats
    ),
    showFloatingGainText: getBoolean(
      value.showFloatingGainText,
      defaultSettings.showFloatingGainText
    ),
    showPredictionPanel: getBoolean(
      value.showPredictionPanel,
      defaultSettings.showPredictionPanel
    ),
    showTileDescriptionsOnHover: getBoolean(
      value.showTileDescriptionsOnHover,
      defaultSettings.showTileDescriptionsOnHover
    ),
    showTooltips: getBoolean(value.showTooltips, defaultSettings.showTooltips),
    uiScale: clamp(value.uiScale, 0.9, 1.15, defaultSettings.uiScale),
    uiVolume: clamp(value.uiVolume, 0, 1, defaultSettings.uiVolume),
    zoomSensitivity: clamp(value.zoomSensitivity, 0.6, 1.6, defaultSettings.zoomSensitivity)
  };
}

export function readSettings(): AppSettings {
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);

    if (!raw) {
      return { ...defaultSettings };
    }

    return normalizeSettings(JSON.parse(raw));
  } catch {
    return { ...defaultSettings };
  }
}

export function writeSettings(settings: AppSettings) {
  try {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage failures and keep the local session responsive.
  }
}
