/**
 * Web Audio synthesiser for Clock Tower Chime Easter Egg
 * Activated ONLY on user click/interaction
 */

export class TowerChime {
  private ctx: AudioContext | null = null;

  public play() {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!this.ctx) {
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      const now = this.ctx.currentTime;

      // Realistic Westminster / tubular bell chime synthesis (E - C - D - G)
      const frequencies = [659.25, 523.25, 587.33, 392.0]; // E5, C5, D5, G4
      frequencies.forEach((freq, idx) => {
        const time = now + idx * 0.45;
        this.playBellTone(freq, time);
      });
    } catch (err) {
      console.warn('Web Audio playback error:', err);
    }
  }

  private playBellTone(freq: number, time: number) {
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    // Strike transient + decay
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.28, time + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 2.4);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(time);
    osc.stop(time + 2.5);
  }
}

