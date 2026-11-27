"use client";

import { useEffect, useState } from "react";
import { HELLO } from "@/lib/content";
import { useSite } from "./SiteProvider";

/** The "Hello" curtain: greetings flip in one after another while a counter climbs to 100, then it lifts. */
export function Loader() {
  const { setLoaded } = useSite();
  const [i, setI] = useState(0);
  const [count, setCount] = useState(0);
  const [phase, setPhase] = useState<"run" | "lift" | "off">("run");

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const total = reduced ? 600 : 2600;
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / total);
      const eased = 1 - Math.pow(1 - p, 2.2);
      setCount(Math.round(eased * 100));
      setI(Math.min(HELLO.length - 1, Math.floor(p * HELLO.length)));
      if (p < 1) raf = requestAnimationFrame(tick);
      else {
        setPhase("lift");
        setLoaded(true);
        setTimeout(() => setPhase("off"), 1100);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [setLoaded]);

  if (phase === "off") return null;
  return (
    <div className={`loader ${phase === "lift" ? "is-lifting" : ""}`} aria-hidden="true">
      <div className="loader-center">
        <p key={i} className="loader-word">
          {HELLO[i]}
        </p>
      </div>
      <div className="loader-progress">
        <div className="loader-line">
          <div className="loader-line-fill" style={{ transform: `scaleX(${count / 100})` }} />
        </div>
        <span className="loader-count">{String(count).padStart(3, "0")}</span>
      </div>
    </div>
  );
}
