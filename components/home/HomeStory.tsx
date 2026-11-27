"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { CHAPTERS, HERO, SITE } from "@/lib/content";
import { CHAPTER_SPAN, MANIFESTO_SPAN, SEG, clamp01, smooth } from "@/lib/dive";
import { useSite } from "../SiteProvider";
import { InstagramIcon, MailIcon, TikTokIcon } from "../Icons";
import { Scramble } from "./Scramble";

const MANIFESTO: { cls: string; text: string; tag?: "h3" }[][] = [
  [
    { cls: "mf-lead", text: "few projects. full presence." },
    { cls: "mf-lead mf-soft", text: "crafted to be felt." },
  ],
  [
    { cls: "mf-lead", text: "most websites are forgotten before they're closed.", tag: "h3" },
    { cls: "mf-small", text: "Functional is the baseline, not the achievement. A site that merely works gets judged in seconds and left without a trace." },
  ],
  [
    { cls: "mf-small", text: "We build the kind people remember — immersive experiences where motion, depth and light make your brand felt, not just seen." },
    { cls: "mf-lead mf-soft", text: "because attention is rented, but memory is owned." },
  ],
  [
    { cls: "mf-lead", text: "presence is the difference" },
    { cls: "mf-lead", text: "between visited and remembered." },
  ],
];

/** Opacity of a window [a, b] with soft edges of width f. */
const windowed = (p: number, a: number, b: number, f: number, keepStart = false, keepEnd = false) =>
  (keepStart ? 1 : smooth(a, a + f, p)) * (keepEnd ? 1 : 1 - smooth(b - f, b, p));

/**
 * All home-page copy lives in fixed layers that fade in and out with the dive, like the reference:
 * hero → three chapters (bottom-left, lines reveal one by one) → plunge → manifesto (left) → finale.
 */
export function HomeStory() {
  const { loaded, openContact } = useSite();
  const hero = useRef<HTMLDivElement>(null);
  const chapters = useRef<(HTMLElement | null)[]>([]);
  const lines = useRef<(HTMLLIElement | null)[][]>([[], [], []]);
  const blocks = useRef<(HTMLDivElement | null)[]>([]);
  const dashes = useRef<(HTMLSpanElement | null)[]>([]);
  const manifesto = useRef<HTMLDivElement>(null);
  const hint = useRef<HTMLParagraphElement>(null);
  const finale = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(-1);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    let raf = 0;
    let last = -2;
    const tick = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? clamp01(window.scrollY / max) : 0;

      // hero sinks away
      if (hero.current) {
        const o = 1 - smooth(0.004, SEG.hero[1], p);
        hero.current.style.opacity = String(o);
        hero.current.style.transform = `translate3d(0, ${-(1 - o) * 12}vh, 0)`;
        hero.current.style.visibility = o < 0.01 ? "hidden" : "visible";
      }

      // chapters
      let act = -1;
      CHAPTERS.forEach((_, i) => {
        const a = SEG.chapters[0] + i * CHAPTER_SPAN;
        const b = a + CHAPTER_SPAN;
        const o = windowed(p, a, b, CHAPTER_SPAN * 0.16);
        const el = chapters.current[i];
        if (el) {
          el.style.opacity = String(o);
          el.style.filter = o > 0.99 ? "none" : `blur(${(1 - o) * 8}px)`;
          el.style.visibility = o < 0.01 ? "hidden" : "visible";
          el.style.pointerEvents = o > 0.6 ? "auto" : "none";
        }
        if (o > 0.5) act = i;
        const tl = clamp01((p - a) / CHAPTER_SPAN);
        lines.current[i].forEach((li, j) => {
          if (!li) return;
          const lo = smooth(0.14 + j * 0.16, 0.24 + j * 0.16, tl);
          li.style.opacity = String(lo);
          li.style.transform = `translate3d(0, ${(1 - lo) * 14}px, 0)`;
        });
      });
      if (act !== last) {
        last = act;
        setActive(act);
      }

      // plunge hint
      if (hint.current) hint.current.style.opacity = String(windowed(p, SEG.descent[0] - 0.01, SEG.abyss[0] + 0.01, 0.015));

      // manifesto
      let blockOn = -1;
      const mo = windowed(p, SEG.abyss[0], SEG.abyss[1], 0.015);
      if (manifesto.current) {
        manifesto.current.style.opacity = String(mo);
        manifesto.current.style.visibility = mo < 0.01 ? "hidden" : "visible";
      }
      blocks.current.forEach((el, i) => {
        const a = SEG.abyss[0] + i * MANIFESTO_SPAN;
        const o = windowed(p, a, a + MANIFESTO_SPAN, MANIFESTO_SPAN * 0.22, i === 0, i === blocks.current.length - 1);
        if (o > 0.5) blockOn = i;
        if (!el) return;
        el.style.opacity = String(o);
        el.style.transform = `translate3d(0, ${(1 - o) * 16}px, 0)`;
        el.style.filter = o > 0.99 ? "none" : `blur(${(1 - o) * 6}px)`;
      });
      dashes.current.forEach((d, i) => d?.classList.toggle("is-on", i === blockOn));

      // finale
      if (finale.current) {
        const o = smooth(SEG.finale[0] + 0.01, SEG.finale[0] + 0.06, p);
        finale.current.style.opacity = String(o);
        finale.current.style.visibility = o < 0.01 ? "hidden" : "visible";
        finale.current.style.pointerEvents = o > 0.6 ? "auto" : "none";
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <>
      <div className="dive-track" aria-hidden="true" />

      <section ref={hero} className={`hero ${loaded ? "is-in" : ""}`} aria-labelledby="hero-line">
        <div className="hero-mark" aria-hidden="true" style={{ display: "flex", alignItems: "flex-start" }}>
          Calder
          <Image className="hero-logo" src="/calder-mark.png" alt="" width={732} height={811} priority style={{ width: "0.3em", height: "auto", flex: "none" }} />
        </div>
        <div className="hero-tag">
          <p className="hero-kick">{HERO.kicker}</p>
          <h1 className="hero-line" id="hero-line">
            <span className="sr-only">Calder — </span>
            {HERO.line}
          </h1>
        </div>
        <div className="scroll-cue" aria-hidden="true">
          <i />
        </div>
      </section>

      {CHAPTERS.map((c, i) => (
        <section key={c.title} ref={(el) => void (chapters.current[i] = el)} className="chapter" aria-labelledby={`ch-${c.title}`}>
          <Scramble key={active === i ? `on-${i}` : `off-${i}`} as="h2" text={c.title} className="chapter-title" />
          <p className="chapter-sub" id={`ch-${c.title}`}>
            {c.subtitle}
          </p>
          <ul className="chapter-lines">
            {c.phrases.map((ph, j) => {
              const id = `${i}-${j}`;
              const on = open === id;
              return (
                <li key={ph} ref={(el) => void (lines.current[i][j] = el)}>
                  <button type="button" className={`cl ${on ? "is-open" : ""}`} aria-expanded={on} onClick={() => setOpen(on ? null : id)}>
                    <span className="cl-phrase">{ph}</span>
                    <span className="cl-plus" aria-hidden="true" />
                    <span className="cl-teaser">{c.teasers[j]}</span>
                  </button>
                  <div className="cl-body" hidden={!on}>
                    <p>{c.long[j]}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <p ref={hint} className="dive-hint" aria-hidden="true">
        scroll
      </p>

      <div ref={manifesto} className="manifesto" aria-label="We Are Calder">
        <p className="mf-title">We Are Calder</p>
        <div className="mf-stack">
          {MANIFESTO.map((block, i) => (
            <div className="mf-block" key={i} ref={(el) => void (blocks.current[i] = el)}>
              {block.map((l, j) => {
                const T = l.tag ?? "p";
                return (
                  <T key={j} className={l.cls}>
                    {l.text}
                  </T>
                );
              })}
            </div>
          ))}
        </div>
        <div className="mf-dashes" aria-hidden="true">
          {MANIFESTO.map((_, i) => (
            <span key={i} ref={(el) => void (dashes.current[i] = el)} />
          ))}
        </div>
      </div>

      <div ref={finale} className="finale" aria-label="Start your project">
        <ul className="finale-soc">
          <li>
            <a href={SITE.socials[0].href} target="_blank" rel="noreferrer" aria-label="Instagram">
              <InstagramIcon />
            </a>
          </li>
          <li>
            <a href={SITE.socials[1].href} target="_blank" rel="noreferrer" aria-label="TikTok">
              <TikTokIcon />
            </a>
          </li>
          <li>
            <a href={`mailto:${SITE.email}`} aria-label="Email">
              <MailIcon />
            </a>
          </li>
        </ul>
        <p className="finale-k">You made it to 4,800 m.</p>
        <button type="button" className="finale-cta" onClick={openContact}>
          Start your project <span aria-hidden="true">→</span>
        </button>
        <footer className="site-footer">
          © 2026 Calder
          {SITE.legal.map((l) => (
            <span key={l}>
              {" · "}
              <a href="#">{l}</a>
            </span>
          ))}
        </footer>
      </div>
    </>
  );
}
