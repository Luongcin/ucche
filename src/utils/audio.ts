/**
 * Procedural Web Audio API sound effects and dramatic arcade BGM synthesizer
 */
class SoundEngine {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;
  private bgmEnabled: boolean = true;
  private lastDangerTime: number = 0;

  // BGM Engine
  private bgmInterval: number | null = null;
  private bgmStep: number = 0;
  private isBgmPlaying: boolean = false;

  constructor() {}

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) {
      this.stopBgm();
    } else if (this.bgmEnabled && !this.isBgmPlaying) {
      this.startBgm();
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setBgmEnabled(enabled: boolean) {
    this.bgmEnabled = enabled;
    if (!enabled) {
      this.stopBgm();
    } else if (this.enabled) {
      this.startBgm();
    }
  }

  public isBgmActive(): boolean {
    return this.bgmEnabled;
  }

  /**
   * Dramatic, high-tension chiptune/synthwave arcade BGM loop
   * 130 BPM in D minor with rolling bassline and dramatic synth chords
   */
  public startBgm() {
    if (!this.enabled || !this.bgmEnabled || this.isBgmPlaying) return;
    this.initCtx();
    if (!this.ctx) return;

    this.isBgmPlaying = true;
    this.bgmStep = 0;

    // 130 BPM -> 16th notes = ~115ms per step
    const stepDuration = 115;

    // Dramatic D Minor bass & arpeggio scale
    const bassNotes = [146.83, 146.83, 174.61, 196.00, 146.83, 146.83, 220.00, 196.00]; // D3, F3, G3, A3
    const leadNotes = [293.66, 349.23, 440.00, 523.25, 587.33, 440.00, 349.23, 392.00]; // D4, F4, A4, C5, D5

    this.bgmInterval = window.setInterval(() => {
      if (!this.ctx || !this.enabled || !this.bgmEnabled) return;
      const now = this.ctx.currentTime;
      const step = this.bgmStep % 16;
      this.bgmStep++;

      try {
        // 1. Kick on steps 0, 4, 8, 12
        if (step % 4 === 0) {
          const kickOsc = this.ctx.createOscillator();
          const kickGain = this.ctx.createGain();
          kickOsc.type = 'sine';
          kickOsc.frequency.setValueAtTime(140, now);
          kickOsc.frequency.exponentialRampToValueAtTime(35, now + 0.08);

          kickGain.gain.setValueAtTime(0.18, now);
          kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

          kickOsc.connect(kickGain);
          kickGain.connect(this.ctx.destination);

          kickOsc.start(now);
          kickOsc.stop(now + 0.08);
        }

        // 2. Hi-hat noise on steps 2, 6, 10, 14
        if (step % 2 === 0) {
          const hatGain = this.ctx.createGain();
          hatGain.gain.setValueAtTime(step % 4 === 2 ? 0.04 : 0.015, now);
          hatGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

          const bufferSize = this.ctx.sampleRate * 0.03;
          const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

          const noise = this.ctx.createBufferSource();
          noise.buffer = buffer;
          noise.connect(hatGain);
          hatGain.connect(this.ctx.destination);

          noise.start(now);
        }

        // 3. Driving Synth Bassline
        const bassFreq = bassNotes[(step >> 1) % bassNotes.length];
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'sawtooth';
        bassOsc.frequency.setValueAtTime(bassFreq / 2, now); // low sub octave

        bassGain.gain.setValueAtTime(0.07, now);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

        // Lowpass filter for smooth pumping bass
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(500, now);

        bassOsc.connect(filter);
        filter.connect(bassGain);
        bassGain.connect(this.ctx.destination);

        bassOsc.start(now);
        bassOsc.stop(now + 0.09);

        // 4. Dramatic tension arpeggio on offbeats
        if (step % 2 === 1) {
          const leadFreq = leadNotes[step % leadNotes.length];
          const leadOsc = this.ctx.createOscillator();
          const leadGain = this.ctx.createGain();
          leadOsc.type = 'triangle';
          leadOsc.frequency.setValueAtTime(leadFreq, now);

          leadGain.gain.setValueAtTime(0.035, now);
          leadGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

          leadOsc.connect(leadGain);
          leadGain.connect(this.ctx.destination);

          leadOsc.start(now);
          leadOsc.stop(now + 0.08);
        }
      } catch {
        // Ignore audio errors
      }
    }, stepDuration);
  }

  public stopBgm() {
    this.isBgmPlaying = false;
    if (this.bgmInterval !== null) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }

  /** Rubber band / Slingshot pull tension tone */
  public playPull(tension: number) {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      const freq = 140 + tension * 360;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.045, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.07);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.07);
    } catch {
      // Ignore
    }
  }

  /** Launch whoosh / spring release */
  public playLaunch() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(650, now + 0.16);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
    } catch {
      // Ignore
    }
  }

  /** Cute brake screech effect (Phanh cháy chân!) */
  public playSkidScreech() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      // Screeching high tone sliding down
      osc.frequency.setValueAtTime(1600, now);
      osc.frequency.exponentialRampToValueAtTime(450, now + 0.14);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch {
      // Ignore
    }
  }

  /** Cute panicked comic cartoon scream when slipping ("Waaaaah!") */
  public playPanickedScream() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(750, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.35);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch {
      // Ignore
    }
  }

  /** Landing on platform */
  public playLand() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.08);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.09);
    } catch {
      // Ignore
    }
  }

  /** Trampoline bounce */
  public playBouncy() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(950, now + 0.18);

      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.22);
    } catch {
      // Ignore
    }
  }

  /** Crocodile chomp bite */
  public playChomp() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(340, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.14);

      gain.gain.setValueAtTime(0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.16);
    } catch {
      // Ignore
    }
  }

  /** Water splash sound */
  public playSplash() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.22;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(750, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(now);
    } catch {
      // Ignore
    }
  }

  /** Victory arcade fanfare */
  public playVictory() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const notes = [440, 554.37, 659.25, 880, 1108.73];
      const now = this.ctx.currentTime;

      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        const startTime = now + idx * 0.08;
        const duration = 0.25;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.22, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration);
      });
    } catch {
      // Ignore
    }
  }

  public playClick() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch {
      // Ignore
    }
  }
}

export const soundEngine = new SoundEngine();
