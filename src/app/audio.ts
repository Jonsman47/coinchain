import type { AppSettings } from "./settings";

type SoundKind = "confirm" | "day_fail" | "day_win" | "load" | "place" | "save" | "sell" | "upgrade";

export interface AudioManager {
  applySettings: (settings: AppSettings) => void;
  handleUserGesture: () => void;
  playSfx: (kind: SoundKind) => void;
  playUi: (kind?: "confirm" | "soft") => void;
}

function createMusicBuffer(context: AudioContext): AudioBuffer {
  const durationSeconds = 8;
  const frameCount = Math.floor(context.sampleRate * durationSeconds);
  const buffer = context.createBuffer(2, frameCount, context.sampleRate);
  const frequencies = [164.81, 220, 261.63, 329.63];

  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const samples = buffer.getChannelData(channel);

    for (let index = 0; index < frameCount; index += 1) {
      const time = index / context.sampleRate;
      const envelope =
        0.58 +
        0.24 * Math.sin(time * Math.PI * 0.24) +
        0.14 * Math.sin(time * Math.PI * 0.07 + channel * 0.4);
      const shimmer = 0.004 * Math.sin(time * Math.PI * 8.2 + channel * 0.9);
      const tone =
        frequencies.reduce((sum, frequency, frequencyIndex) => {
          const detune = channel === 0 ? -0.35 : 0.35;
          const amplitude = 0.16 / (frequencyIndex + 1);

          return (
            sum +
            Math.sin((time * (frequency + detune)) * Math.PI * 2) *
              amplitude
          );
        }, 0) * envelope;

      samples[index] = (tone + shimmer) * 0.36;
    }
  }

  return buffer;
}

export function createAudioManager(): AudioManager {
  let audioContext: AudioContext | null = null;
  let masterGain: GainNode | null = null;
  let musicGain: GainNode | null = null;
  let sfxGain: GainNode | null = null;
  let uiGain: GainNode | null = null;
  let musicSource: AudioBufferSourceNode | null = null;
  let currentSettings: AppSettings | null = null;

  const ensureContext = () => {
    if (audioContext && masterGain && musicGain && sfxGain && uiGain) {
      return;
    }

    audioContext = new AudioContext();
    masterGain = audioContext.createGain();
    musicGain = audioContext.createGain();
    sfxGain = audioContext.createGain();
    uiGain = audioContext.createGain();

    musicGain.connect(masterGain);
    sfxGain.connect(masterGain);
    uiGain.connect(masterGain);
    masterGain.connect(audioContext.destination);
  };

  const applyGainLevels = () => {
    if (!currentSettings || !masterGain || !musicGain || !sfxGain || !uiGain) {
      return;
    }

    const masterLevel = currentSettings.muteAll ? 0 : currentSettings.masterVolume;
    masterGain.gain.value = masterLevel;
    musicGain.gain.value = currentSettings.musicVolume;
    sfxGain.gain.value = currentSettings.sfxVolume;
    uiGain.gain.value = currentSettings.uiVolume;
  };

  const ensureMusic = () => {
    if (!audioContext || !musicGain || musicSource) {
      return;
    }

    const source = audioContext.createBufferSource();
    source.buffer = createMusicBuffer(audioContext);
    source.loop = true;
    source.connect(musicGain);
    source.start();
    musicSource = source;
  };

  const playTone = (
    gainNode: GainNode | null,
    frequency: number,
    durationSeconds: number,
    type: OscillatorType,
    peakGain: number
  ) => {
    if (!audioContext || !gainNode) {
      return;
    }

    const oscillator = audioContext.createOscillator();
    const envelope = audioContext.createGain();
    const startTime = audioContext.currentTime;
    const endTime = startTime + durationSeconds;

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startTime);
    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(55, frequency * 0.88),
      endTime
    );

    envelope.gain.setValueAtTime(0.0001, startTime);
    envelope.gain.exponentialRampToValueAtTime(peakGain, startTime + durationSeconds * 0.18);
    envelope.gain.exponentialRampToValueAtTime(0.0001, endTime);

    oscillator.connect(envelope);
    envelope.connect(gainNode);
    oscillator.start(startTime);
    oscillator.stop(endTime + 0.02);
  };

  return {
    applySettings(settings) {
      currentSettings = settings;
      ensureContext();
      applyGainLevels();
    },
    handleUserGesture() {
      ensureContext();

      if (!audioContext) {
        return;
      }

      if (audioContext.state === "suspended") {
        void audioContext.resume();
      }

      ensureMusic();
      applyGainLevels();
    },
    playSfx(kind) {
      ensureContext();

      switch (kind) {
        case "day_fail":
          playTone(sfxGain, 166, 0.34, "sawtooth", 0.09);
          playTone(sfxGain, 124, 0.42, "triangle", 0.07);
          break;
        case "day_win":
          playTone(sfxGain, 392, 0.24, "triangle", 0.09);
          playTone(sfxGain, 523.25, 0.3, "triangle", 0.07);
          break;
        case "load":
          playTone(sfxGain, 294, 0.2, "triangle", 0.06);
          playTone(sfxGain, 392, 0.26, "triangle", 0.07);
          break;
        case "place":
          playTone(sfxGain, 260, 0.12, "triangle", 0.045);
          break;
        case "save":
          playTone(sfxGain, 330, 0.12, "triangle", 0.045);
          playTone(sfxGain, 440, 0.16, "triangle", 0.04);
          break;
        case "sell":
          playTone(sfxGain, 212, 0.14, "square", 0.035);
          break;
        case "upgrade":
          playTone(sfxGain, 392, 0.15, "triangle", 0.05);
          playTone(sfxGain, 587.33, 0.18, "triangle", 0.04);
          break;
        default:
          playTone(sfxGain, 294, 0.15, "triangle", 0.04);
          break;
      }
    },
    playUi(kind = "soft") {
      ensureContext();
      playTone(
        uiGain,
        kind === "confirm" ? 520 : 420,
        kind === "confirm" ? 0.1 : 0.08,
        "triangle",
        kind === "confirm" ? 0.035 : 0.024
      );
    }
  };
}
