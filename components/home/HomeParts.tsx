"use client";

import Image from "next/image";
import { HERO, SITE } from "@/lib/content";
import { useSite } from "../SiteProvider";
import { useReveal } from "../useScroll";
import { InstagramIcon, MailIcon, TikTokIcon } from "../Icons";

export function Hero() {
  const { loaded } = useSite();
  return (
    <section className={`hero ${loaded ? "is-in" : ""}`} aria-labelledby="hero-line">
      <div className="hero-mark" aria-hidden="true">
        Calder
        <Image className="hero-logo" src="/calder-mark.png" alt="" width={732} height={811} priority />
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
  );
}

const MANIFESTO: { cls: string; text: string; tag?: "h3" }[][] = [
  [
    { cls: "mf-display", text: "few projects. full presence." },
    { cls: "mf-display mf-soft", text: "crafted to be felt." },
  ],
  [
    { cls: "mf-mid", text: "most websites are forgotten before they're closed.", tag: "h3" },
    { cls: "mf-mono", text: "Functional is the baseline, not the achievement. A site that merely works gets judged in seconds and left without a trace." },
  ],
  [
    { cls: "mf-mono", text: "We build the kind people remember — immersive experiences where motion, depth and light make your brand felt, not just seen." },
    { cls: "mf-mid mf-soft", text: "because attention is rented, but memory is owned." },
  ],
  [{ cls: "mf-display", text: "presence is the difference between visited and remembered." }],
];

export function Manifesto() {
  useReveal();
  return (
    <section className="we-are" aria-labelledby="we-are-t">
      <div className="we-are-ghost" aria-hidden="true">
        we are
      </div>
      <h2 className="we-are-title" id="we-are-t" data-reveal>
        We Are Calder
      </h2>
      {MANIFESTO.map((block, i) => (
        <div className="mf-block" key={i}>
          {block.map((l, j) => {
            const T = l.tag ?? "p";
            return (
              <T key={j} className={l.cls} data-reveal style={{ "--d": `${j * 0.15}s` } as React.CSSProperties}>
                {l.text}
              </T>
            );
          })}
          <div className="mf-rule" data-reveal />
        </div>
      ))}
    </section>
  );
}

export function Finale() {
  const { openContact } = useSite();
  return (
    <section className="finale" aria-label="Start your project">
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
      <p className="finale-k" data-reveal>
        You made it to 4,800 m.
      </p>
      <button type="button" className="finale-cta" onClick={openContact} data-reveal>
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
    </section>
  );
}
