"use client";

import Image from "next/image";
import { useState } from "react";
import { FILTERS, PROJECTS, type Filter } from "@/lib/content";
import { useSite } from "@/components/SiteProvider";
import { useReveal } from "@/components/useScroll";

const Arrow = () => (
  <svg viewBox="0 0 12 12" aria-hidden="true">
    <path d="M2 10 10 2M4 2h6v6" />
  </svg>
);

export function WorkGrid() {
  const [active, setActive] = useState<Filter[]>([]);
  const [open, setOpen] = useState(false);
  const { openContact } = useSite();
  useReveal([active]);

  const match = (tags: Filter[]) => active.length === 0 || active.some((a) => tags.includes(a));
  const visible = PROJECTS.filter((p) => match(p.tags));
  const stars = PROJECTS.filter((p) => p.featured);
  const subs = PROJECTS.filter((p) => !p.featured);

  return (
    <section className="page page-work" aria-labelledby="work-title">
      <header className="wk-hero">
        <div className="wk-ttl">
          <h1 className="wk-h1" id="work-title" data-reveal>
            Work
          </h1>
          <span className="wk-cnt" aria-hidden="true">
            {visible.length}
          </span>
        </div>
        <p className="wk-intro" data-reveal>
          Every project is a world of its own, built to be remembered: real-time 3D, motion and sound, made by hand for one brand at a time.
        </p>
        <p className="sr-only" aria-live="polite">
          {visible.length} projects
        </p>
      </header>

      <nav className={`wk-flt ${open ? "is-open" : ""}`} aria-label="Filters">
        <button type="button" className="wk-ftop" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          All filters <i aria-hidden="true" />
        </button>
        <ul className="wk-fl">
          {FILTERS.map((f) => {
            const on = active.includes(f.id);
            const n = PROJECTS.filter((p) => p.tags.includes(f.id)).length;
            return (
              <li key={f.id}>
                <button
                  type="button"
                  className={`wk-fi ${on ? "is-on" : ""}`}
                  aria-pressed={on}
                  style={{ "--c": f.color } as React.CSSProperties}
                  onClick={() => setActive(on ? active.filter((a) => a !== f.id) : [...active, f.id])}
                >
                  <span className="wk-fa" aria-hidden="true">
                    {on ? "×" : <Arrow />}
                  </span>
                  {f.label}
                  <sup>{n}</sup>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="wk-grid">
        <div className="wk-stars">
          {stars.map((p) => (
            <article key={p.slug} className={`wk-it wk-st ${match(p.tags) ? "" : "is-off"}`} data-reveal style={{ "--bg": p.bg } as React.CSSProperties}>
              <div className="wk-sh">
                <h2 className="wk-t3">{p.name}</h2>
                <p className="wk-t6">{p.tagline}</p>
              </div>
              <div className="wk-si">
                <Image src={`/work/${p.slug}/cover.webp`} alt="" fill sizes="(max-width: 768px) 100vw, 50vw" />
                <span className="wk-sit" aria-hidden="true">
                  {p.name}
                </span>
                <span className="wk-sb" aria-hidden="true">
                  <Arrow />
                </span>
              </div>
              <div className="wk-sf">
                <span>{p.type}</span>
                <span>{p.year}</span>
              </div>
            </article>
          ))}
        </div>
        <div className="wk-subs">
          {subs.map((p) => (
            <article key={p.slug} className={`wk-it wk-ss ${match(p.tags) ? "" : "is-off"}`} data-reveal style={{ "--bg": p.bg } as React.CSSProperties}>
              <div className="wk-sim">
                <Image src={`/work/${p.slug}/cover.webp`} alt="" fill sizes="240px" />
              </div>
              <div className="wk-sco">
                <div className="wk-sh2">
                  <span>{p.year}</span>
                  <span>{p.type}</span>
                </div>
                <div>
                  <h2 className="wk-t3">{p.name}</h2>
                  <p className="wk-t6">{p.tagline}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <section className="wk-end" aria-label="Start your project">
        <p className="wk-k">Work · 800 m · Twilight zone</p>
        <p className="wk-q" data-reveal>
          Have something worth the dive?
        </p>
        <button type="button" className="wk-go" onClick={openContact}>
          Start your project <span aria-hidden="true">↓</span> 4,800 m
        </button>
      </section>
    </section>
  );
}
