"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

type Ctx = {
  contactOpen: boolean;
  openContact: () => void;
  closeContact: () => void;
  soundOn: boolean;
  toggleSound: () => void;
  loaded: boolean;
  setLoaded: (v: boolean) => void;
};

const SiteCtx = createContext<Ctx | null>(null);

export function useSite() {
  const c = useContext(SiteCtx);
  if (!c) throw new Error("useSite outside provider");
  return c;
}

/** Ambient "deep water" drone generated with Web Audio: filtered brown noise + a slow sub tone. */
function createAmbience() {
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AC();
  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);

  const len = ctx.sampleRate * 4;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    last = (last + 0.02 * w) / 1.02;
    d[i] = last * 3.5;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buf;
  noise.loop = true;
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 380;
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.07;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 160;
  lfo.connect(lfoGain).connect(lp.frequency);
  noise.connect(lp).connect(master);

  const sub = ctx.createOscillator();
  sub.type = "sine";
  sub.frequency.value = 55;
  const subGain = ctx.createGain();
  subGain.gain.value = 0.12;
  sub.connect(subGain).connect(master);

  noise.start();
  lfo.start();
  sub.start();
  return {
    set(on: boolean) {
      if (ctx.state === "suspended") ctx.resume();
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(on ? 0.35 : 0, ctx.currentTime, 0.6);
    },
  };
}

export function SiteProvider({ children }: { children: React.ReactNode }) {
  const [contactOpen, setContactOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const audio = useRef<ReturnType<typeof createAmbience> | null>(null);

  const toggleSound = useCallback(() => {
    setSoundOn((s) => {
      const next = !s;
      if (!audio.current) audio.current = createAmbience();
      audio.current.set(next);
      return next;
    });
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("cf-open", contactOpen);
  }, [contactOpen]);

  return (
    <SiteCtx.Provider
      value={{
        contactOpen,
        openContact: () => setContactOpen(true),
        closeContact: () => setContactOpen(false),
        soundOn,
        toggleSound,
        loaded,
        setLoaded,
      }}
    >
      {children}
    </SiteCtx.Provider>
  );
}
