import confetti from 'canvas-confetti';

/**
 * Fires a calibrated single burst of warm particles adhering to the
 * Warm Editorial Minimal aesthetic palette, accompanied by haptic feedback.
 */
export function fireWarmCelebrationConfetti(): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([100, 50, 100, 50, 200]);
    } catch {
      // Ignore vibration error on non-supported hardware
    }
  }

  confetti({
    particleCount: 70,
    spread: 60,
    origin: { y: 0.6 },
    colors: ['#E07A5F', '#D4AF37', '#2D6A4F', '#FBF9F5'],
    disableForReducedMotion: true,
  });
}

/** Backwards-compatible alias */
export const triggerCelebrationEffects = fireWarmCelebrationConfetti;
