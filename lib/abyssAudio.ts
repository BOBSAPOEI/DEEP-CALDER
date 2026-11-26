import { abyss } from "./abyssState";

/**
 * Horror deep-sea soundscape, fully synthesized with Web Audio (no audio files):
 *  - water bed: filtered brown noise
 *  - abyss drone: detuned low saws + sub, swelling with depth
 *  - heartbeat: lub-dub thumps, faster and louder as the megalodon closes in
 *  - groans: distant whale-like moans through a long cavernous reverb
 *  - stinger: rumble + dissonant cluster + noise sweep when the shark passes close
 */
export function createAbyssAudio() {
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AC();
  const now = () => ctx.currentTime;

  const out = ctx.createDynamicsCompressor();
  out.threshold.value = -14;
  out.ratio.value = 4;
  out.connect(ctx.destination);
  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(out);

  // Cavernous reverb from a generated impulse
  const reverb = ctx.createConvolver();
  {
    const secs = 5;
    const len = ctx.sampleRate * secs;
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
    }
    reverb.buffer = ir;
  }
  const wet = ctx.createGain();
  wet.gain.value = 0.55;
  reverb.connect(wet).connect(master);

  const noiseBuf = (() => {
    const len = ctx.sampleRate * 4;
    const b = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = b.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      d[i] = last * 3.5;
    }
    return b;
  })();
  const whiteBuf = (() => {
    const b = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  })();

  // Water bed
  const water = ctx.createBufferSource();
  water.buffer = noiseBuf;
  water.loop = true;
  const waterLp = ctx.createBiquadFilter();
  waterLp.type = "lowpass";
  waterLp.frequency.value = 420;
  const waterGain = ctx.createGain();
  waterGain.gain.value = 0.5;
  water.connect(waterLp).connect(waterGain).connect(master);
  water.start();

  // Abyss drone
  const droneLp = ctx.createBiquadFilter();
  droneLp.type = "lowpass";
  droneLp.frequency.value = 160;
  droneLp.Q.value = 6;
  const droneGain = ctx.createGain();
  droneGain.gain.value = 0;
  droneLp.connect(droneGain);
  droneGain.connect(master);
  droneGain.connect(reverb);
  for (const f of [41.2, 41.9, 61.7]) {
    const o = ctx.createOscillator();
    o.type = "sawtooth";
    o.frequency.value = f;
    o.connect(droneLp);
    o.start();
  }
  const sub = ctx.createOscillator();
  sub.frequency.value = 27.5;
  const subGain = ctx.createGain();
  subGain.gain.value = 0.5;
  sub.connect(subGain).connect(droneGain);
  sub.start();
  const droneLfo = ctx.createOscillator();
  droneLfo.frequency.value = 0.05;
  const droneLfoGain = ctx.createGain();
  droneLfoGain.gain.value = 90;
  droneLfo.connect(droneLfoGain).connect(droneLp.frequency);
  droneLfo.start();

  // Heartbeat
  const heart = ctx.createGain();
  heart.gain.value = 0;
  heart.connect(master);
  const thump = (t: number, strength: number) => {
    const o = ctx.createOscillator();
    o.frequency.setValueAtTime(62, t);
    o.frequency.exponentialRampToValueAtTime(32, t + 0.18);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(strength, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
    o.connect(g).connect(heart);
    o.start(t);
    o.stop(t + 0.32);
  };
  let nextBeat = 0;

  // Distant groan
  const groan = (t: number) => {
    const o = ctx.createOscillator();
    o.type = "sawtooth";
    const f0 = 70 + Math.random() * 50;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.linearRampToValueAtTime(f0 * 1.25, t + 1.2);
    o.frequency.exponentialRampToValueAtTime(f0 * 0.45, t + 4.2);
    const vib = ctx.createOscillator();
    vib.frequency.value = 4 + Math.random() * 3;
    const vibG = ctx.createGain();
    vibG.gain.value = 3;
    vib.connect(vibG).connect(o.frequency);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 320;
    bp.Q.value = 5;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.35, t + 1.3);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 4.6);
    o.connect(bp).connect(g);
    g.connect(reverb);
    const dry = ctx.createGain();
    dry.gain.value = 0.25;
    g.connect(dry).connect(master);
    o.start(t);
    vib.start(t);
    o.stop(t + 4.8);
    vib.stop(t + 4.8);
  };
  let nextGroan = 0;

  // Stinger when the shark passes close
  const stinger = (t: number) => {
    // sub boom
    const boom = ctx.createOscillator();
    boom.frequency.setValueAtTime(55, t);
    boom.frequency.exponentialRampToValueAtTime(24, t + 2.5);
    const bg = ctx.createGain();
    bg.gain.setValueAtTime(0.0001, t);
    bg.gain.exponentialRampToValueAtTime(1.1, t + 0.05);
    bg.gain.exponentialRampToValueAtTime(0.0001, t + 3);
    boom.connect(bg).connect(master);
    boom.start(t);
    boom.stop(t + 3.1);
    // dissonant cluster (minor seconds + tritone)
    const cg = ctx.createGain();
    cg.gain.setValueAtTime(0.0001, t);
    cg.gain.exponentialRampToValueAtTime(0.16, t + 0.9);
    cg.gain.exponentialRampToValueAtTime(0.0001, t + 5);
    const clp = ctx.createBiquadFilter();
    clp.type = "lowpass";
    clp.frequency.setValueAtTime(400, t);
    clp.frequency.linearRampToValueAtTime(2600, t + 1);
    clp.frequency.exponentialRampToValueAtTime(300, t + 5);
    clp.connect(cg);
    cg.connect(master);
    cg.connect(reverb);
    for (const f of [110, 116.5, 155.6, 233, 246.9]) {
      const o = ctx.createOscillator();
      o.type = "sawtooth";
      o.frequency.setValueAtTime(f, t);
      o.frequency.linearRampToValueAtTime(f * 0.97, t + 5);
      o.connect(clp);
      o.start(t);
      o.stop(t + 5.2);
    }
    // whoosh of displaced water
    const n = ctx.createBufferSource();
    n.buffer = whiteBuf;
    const nf = ctx.createBiquadFilter();
    nf.type = "bandpass";
    nf.Q.value = 1.2;
    nf.frequency.setValueAtTime(2400, t);
    nf.frequency.exponentialRampToValueAtTime(120, t + 1.8);
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.0001, t);
    ng.gain.exponentialRampToValueAtTime(0.5, t + 0.25);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 2);
    n.connect(nf).connect(ng).connect(master);
    n.start(t);
    n.stop(t + 2);
  };
  let lastThreat = 0;
  let stingerReadyAt = 0;

  let on = false;
  const tick = () => {
    if (!on) return;
    const t = now();
    const d = abyss.depth;
    const th = abyss.threat;
    const deep = Math.min(1, Math.max(0, (d - 0.15) / 0.6));

    droneGain.gain.setTargetAtTime(0.04 + deep * 0.3 + th * 0.2, t, 0.8);
    waterLp.frequency.setTargetAtTime(420 - deep * 260, t, 1);
    heart.gain.setTargetAtTime(deep > 0.2 ? 0.25 + th * 0.9 : 0, t, 0.5);

    if (t >= nextBeat) {
      const interval = 1.5 - th * 1.0 - deep * 0.15;
      if (deep > 0.2) {
        thump(t + 0.02, 0.9);
        thump(t + 0.24, 0.55);
      }
      nextBeat = t + Math.max(0.42, interval);
    }
    if (t >= nextGroan) {
      if (deep > 0.1) groan(t + 0.05);
      nextGroan = t + 7 + Math.random() * 9 - deep * 3;
    }
    if (th > 0.55 && lastThreat <= 0.55 && t > stingerReadyAt) {
      stinger(t + 0.01);
      stingerReadyAt = t + 9;
    }
    lastThreat = th;
  };
  const timer = window.setInterval(tick, 80);

  return {
    set(v: boolean) {
      on = v;
      if (ctx.state === "suspended") ctx.resume();
      const t = now();
      master.gain.cancelScheduledValues(t);
      master.gain.setTargetAtTime(v ? 0.8 : 0, t, 0.6);
      if (v) {
        nextBeat = t + 0.5;
        nextGroan = t + 2;
      }
    },
    dispose() {
      window.clearInterval(timer);
      ctx.close();
    },
  };
}
