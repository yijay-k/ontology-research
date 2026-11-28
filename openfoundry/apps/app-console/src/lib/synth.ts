/**
 * Tiny Web Audio synth for the Ontology Mind page. Every sound is generated,
 * so there are no audio assets to ship. The AudioContext is created lazily on
 * the first sound, which always follows a user gesture (typing, clicking).
 */

const PENTATONIC = [0, 3, 5, 7, 10, 12, 15, 17, 19, 22, 24, 27];

interface ToneOpts {
  type?: OscillatorType;
  gain?: number;
  delay?: number;
  glide?: number;
}

export class Synth {
  muted = false;
  private ctx: AudioContext | null = null;
  private out: GainNode | null = null;
  private noise: AudioBuffer | null = null;

  private get(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctor();
      // Warmth: frequent UI sounds read better without harsh top end.
      const warm = ctx.createBiquadFilter();
      warm.type = "lowpass";
      warm.frequency.value = 7000;
      warm.connect(ctx.destination);
      const comp = ctx.createDynamicsCompressor();
      comp.connect(warm);
      const out = ctx.createGain();
      out.gain.value = 0.55;
      out.connect(comp);

      // Feedback echo gives every blip a sense of space.
      const delay = ctx.createDelay();
      delay.delayTime.value = 0.19;
      const fb = ctx.createGain();
      fb.gain.value = 0.32;
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 2200;
      out.connect(delay);
      delay.connect(lp);
      lp.connect(fb);
      fb.connect(delay);
      lp.connect(comp);

      const noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const data = noise.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

      this.ctx = ctx;
      this.out = out;
      this.noise = noise;
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  private tone(freq: number, dur: number, { type = "sine", gain = 0.2, delay = 0, glide }: ToneOpts = {}) {
    const ctx = this.get();
    if (!ctx || !this.out) return;
    const t = ctx.currentTime + delay;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (glide) o.frequency.exponentialRampToValueAtTime(glide, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(this.out);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  private sweep(dur: number, from: number, to: number, gain: number, q = 1.2) {
    const ctx = this.get();
    if (!ctx || !this.out || !this.noise) return;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = q;
    bp.frequency.setValueAtTime(from, t);
    bp.frequency.exponentialRampToValueAtTime(to, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + dur * 0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(bp);
    bp.connect(g);
    g.connect(this.out);
    src.start(t);
    src.stop(t + dur + 0.05);
  }

  /** Bell-like note; step walks a pentatonic scale so cascades sound musical. */
  ping(step: number, gain = 0.1) {
    const f = 440 * 2 ** (PENTATONIC[step % PENTATONIC.length] / 12);
    this.tone(f, 0.6, { gain });
    this.tone(f * 2, 0.25, { type: "triangle", gain: gain * 0.25 });
  }

  /**
   * Low detuned pad whose filter opens while the graph is being reasoned over.
   * Returns a stop function that fades it out.
   */
  drone(): () => void {
    const ctx = this.get();
    if (!ctx || !this.out) return () => {};
    const t = ctx.currentTime;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.Q.value = 6;
    lp.frequency.setValueAtTime(180, t);
    lp.frequency.exponentialRampToValueAtTime(1400, t + 4);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.06, t + 0.8);
    lp.connect(g);
    g.connect(this.out);
    const oscs = [55, 55.4, 82.4, 110.3].map((f, i) => {
      const o = ctx.createOscillator();
      o.type = i < 2 ? "sawtooth" : "triangle";
      o.frequency.value = f;
      o.connect(lp);
      o.start(t);
      return o;
    });
    return () => {
      const now = ctx.currentTime;
      g.gain.cancelScheduledValues(now);
      g.gain.setValueAtTime(g.gain.value, now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
      oscs.forEach((o) => o.stop(now + 1.3));
    };
  }

  whoosh(dur = 0.7) {
    this.sweep(dur, 260, 3200, 0.16);
  }

  blip() {
    this.tone(620, 0.12, { type: "square", gain: 0.035, glide: 1240 });
    this.tone(930, 0.18, { type: "sine", gain: 0.06, delay: 0.05 });
  }

  submit() {
    this.tone(150, 0.45, { gain: 0.35, glide: 45 });
    this.sweep(0.9, 180, 5000, 0.08, 0.8);
  }

  tick() {
    this.tone(1900 + Math.random() * 400, 0.025, { type: "sine", gain: 0.01 });
  }

  hover() {
    this.tone(1320, 0.06, { type: "sine", gain: 0.015 });
  }

  chord() {
    [0, 4, 7, 11, 14].forEach((n, i) =>
      this.tone(261.6 * 2 ** (n / 12), 1.8, { gain: 0.05, delay: i * 0.045 }),
    );
  }

  success() {
    [523.3, 659.3, 784, 1046.5, 1318.5].forEach((f, i) =>
      this.tone(f, 0.5, { type: "triangle", gain: 0.09, delay: i * 0.07 }),
    );
    this.tone(90, 1.1, { gain: 0.4, glide: 30 });
    this.sweep(1.2, 4000, 120, 0.12, 0.6);
  }
}
