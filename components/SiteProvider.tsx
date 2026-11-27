"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { createAbyssAudio } from "@/lib/abyssAudio";

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

export function SiteProvider({ children }: { children: React.ReactNode }) {
  const [contactOpen, setContactOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const audio = useRef<ReturnType<typeof createAbyssAudio> | null>(null);

  const toggleSound = useCallback(() => {
    const next = !soundOn;
    if (!audio.current) audio.current = createAbyssAudio();
    audio.current.set(next);
    setSoundOn(next);
  }, [soundOn]);

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
