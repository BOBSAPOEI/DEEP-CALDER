"use client";

import { MAX_DEPTH, zoneFor } from "@/lib/content";
import { useScrollProgress } from "../useScroll";

/** Bottom-right depth gauge: rolling digits, the zone's name and a ruler that slides with the dive. */
export function DepthMeter() {
  const p = useScrollProgress();
  const m = Math.round(p * MAX_DEPTH);
  const digits = String(m).padStart(4, "0").split("");
  const lead = digits.findIndex((d) => d !== "0");

  const ticks = [];
  const base = Math.floor(m / 100) * 100;
  for (let d = base - 600; d <= base + 600; d += 100) {
    if (d < 0 || d > 6000) continue;
    ticks.push(d);
  }

  return (
    <div className={`depth ${p > 0.93 ? "is-off" : ""}`} aria-hidden="true">
      <div className="depth-read">
        <div className="depth-num">
          {digits.map((d, i) => (
            <span key={i} className={lead === -1 || i < lead ? "is-dim" : ""}>
              {i === 1 ? <i className="depth-sep">,</i> : null}
              {d}
            </span>
          ))}
          <small>m</small>
        </div>
        <div className="depth-zone">{zoneFor(m)}</div>
      </div>
      <div className="depth-ruler">
        {ticks.map((d) => (
          <span key={d} className={d % 500 === 0 ? "is-major" : ""} style={{ transform: `translateY(${(d - m) * 0.5}px)` }}>
            {d % 500 === 0 ? <b>{d.toLocaleString("en-US")}</b> : null}
          </span>
        ))}
        <i className="depth-cursor" />
      </div>
    </div>
  );
}
