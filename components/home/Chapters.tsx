"use client";

import { useState } from "react";
import { CHAPTERS } from "@/lib/content";
import { Scramble } from "./Scramble";

function Chapter({ c, idx }: { c: (typeof CHAPTERS)[number]; idx: number }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section className="chapter" aria-labelledby={`ch-${c.title}`}>
      <div className="chapter-in">
        <p className="chapter-idx" data-reveal>
          0{idx + 1} / 03
        </p>
        <Scramble as="h2" text={c.title} className="chapter-title" />
        <p className="chapter-sub" data-reveal id={`ch-${c.title}`}>
          {c.subtitle}
        </p>
        <ul className="chapter-lines">
          {c.phrases.map((ph, i) => {
            const on = open === i;
            return (
              <li key={ph} data-reveal style={{ "--d": `${0.12 * (i + 1)}s` } as React.CSSProperties}>
                <button type="button" className={`cl ${on ? "is-open" : ""}`} aria-expanded={on} onClick={() => setOpen(on ? null : i)}>
                  <span className="cl-phrase">{ph}</span>
                  <span className="cl-plus" aria-hidden="true" />
                  <span className="cl-teaser">{c.teasers[i]}</span>
                </button>
                <div className="cl-body" hidden={!on}>
                  <p>{c.long[i]}</p>
                </div>
              </li>
            );
          })}
        </ul>
        {idx === 0 ? (
          <p className="chapter-hint" data-reveal>
            Every line opens. Try one.
          </p>
        ) : null}
      </div>
    </section>
  );
}

export function Chapters() {
  return (
    <>
      {CHAPTERS.map((c, i) => (
        <Chapter key={c.title} c={c} idx={i} />
      ))}
    </>
  );
}
