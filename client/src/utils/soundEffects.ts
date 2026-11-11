class DuelSoundEffects {
  private ctx: AudioContext | null = null;

  public initOnUserGesture(): void {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    gainVal: number = 0.25
  ): void {
    try {
      this.initOnUserGesture();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      // Gracefully ignore audio errors on restricted devices
    }
  }

  // 3-2-1 countdown tick (C5, 523.25Hz, crisp 80ms)
  public playCountdownTick(): void {
    this.playTone(523.25, 0.08, 'sine', 0.2);
  }

  // "BAŞLA!" fanfare start (C6, 1046.5Hz, triumphant 250ms)
  public playStartFanfare(): void {
    this.playTone(1046.5, 0.25, 'triangle', 0.35);
  }

  // Subtle tap feedback sound (low click, 180Hz, 25ms)
  public playTapSound(): void {
    this.playTone(180, 0.025, 'triangle', 0.1);
  }

  // Game over buzzer (descending tone, 320Hz, 300ms)
  public playBuzzer(): void {
    this.playTone(320, 0.3, 'sawtooth', 0.25);
  }
}

export const soundEffects = new DuelSoundEffects();
