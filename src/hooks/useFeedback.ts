import { useCallback, useRef } from "react";

// Audio context for generating sounds
let audioContext: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

type SoundType = "select" | "deselect" | "success" | "click" | "hover" | "error";

interface SoundConfig {
  frequency: number;
  duration: number;
  type: OscillatorType;
  fadeOut?: boolean;
  gain?: number;
}

const SOUND_CONFIGS: Record<SoundType, SoundConfig> = {
  select: { frequency: 880, duration: 0.08, type: "sine", fadeOut: true, gain: 0.15 },
  deselect: { frequency: 440, duration: 0.06, type: "sine", fadeOut: true, gain: 0.12 },
  success: { frequency: 1200, duration: 0.15, type: "sine", fadeOut: true, gain: 0.12 },
  click: { frequency: 600, duration: 0.04, type: "square", gain: 0.08 },
  hover: { frequency: 1000, duration: 0.02, type: "sine", gain: 0.05 },
  error: { frequency: 200, duration: 0.2, type: "sawtooth", gain: 0.1 },
};

export function useFeedback() {
  const lastHapticTime = useRef(0);
  const lastSoundTime = useRef(0);

  // Haptic feedback using Vibration API
  const triggerHaptic = useCallback((pattern: number | number[] = 10) => {
    const now = Date.now();
    // Throttle haptic to prevent overwhelming the device
    if (now - lastHapticTime.current < 50) return;
    lastHapticTime.current = now;

    if ("vibrate" in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        // Silently fail if vibration not supported
      }
    }
  }, []);

  // Sound feedback using Web Audio API
  const playSound = useCallback((type: SoundType) => {
    const now = Date.now();
    // Throttle sounds to prevent overlap
    if (now - lastSoundTime.current < 30) return;
    lastSoundTime.current = now;

    try {
      const ctx = getAudioContext();
      const config = SOUND_CONFIGS[type];

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = config.type;
      oscillator.frequency.setValueAtTime(config.frequency, ctx.currentTime);

      gainNode.gain.setValueAtTime(config.gain || 0.1, ctx.currentTime);
      
      if (config.fadeOut) {
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + config.duration);
      }

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + config.duration);
    } catch (e) {
      // Silently fail if audio not supported
    }
  }, []);

  // Combined feedback for common interactions
  const onSelect = useCallback(() => {
    triggerHaptic(15);
    playSound("select");
  }, [triggerHaptic, playSound]);

  const onDeselect = useCallback(() => {
    triggerHaptic(10);
    playSound("deselect");
  }, [triggerHaptic, playSound]);

  const onClick = useCallback(() => {
    triggerHaptic(8);
    playSound("click");
  }, [triggerHaptic, playSound]);

  const onSuccess = useCallback(() => {
    triggerHaptic([20, 50, 20]);
    playSound("success");
  }, [triggerHaptic, playSound]);

  const onHover = useCallback(() => {
    playSound("hover");
  }, [playSound]);

  const onError = useCallback(() => {
    triggerHaptic([30, 30, 30]);
    playSound("error");
  }, [triggerHaptic, playSound]);

  return {
    triggerHaptic,
    playSound,
    onSelect,
    onDeselect,
    onClick,
    onSuccess,
    onHover,
    onError,
  };
}
