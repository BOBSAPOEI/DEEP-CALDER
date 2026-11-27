import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AboutReveal, AboutCta } from "./AboutClient";

export const metadata: Metadata = {
  title: "About — Calder",
  description: "We’re a small studio building websites that feel like places.",
};

const col = (c: string, cm?: string) => ({ "--c": c, ...(cm ? { "--cm": cm } : {}) }) as React.CSSProperties;

export default function AboutPage() {
  return (
    <div className="page page-about">
      <AboutReveal />
      <section className="ab-hero" aria-labelledby="about-title">
        <Image
          src="/about/about-00-hero.webp"
          alt="The studio: a long stone counter, rows of desks and tall windows onto the street, in late-afternoon sun"
          fill
          priority
          sizes="100vw"
          className="ab-hero-img"
        />
        <div className="ab-shade" />
        <div className="ab-hbody">
          <div className="ab-g ab-hrow">
            <p className="ab-t ab-lab" style={col("1/3")}>
              Studio
            </p>
            <p className="ab-tl" style={col("6/11")} data-reveal>
              We build websites that feel like a place you visit, not a page you scroll: light, depth and motion, made by hand.
            </p>
            <p className="ab-t ab-exp" style={col("11/13")}>
              <a href="#ab-statement">Explore ↓</a>
            </p>
          </div>
          <h1 className="ab-hh" id="about-title">
            <span className="sr-only">About Us</span>
            <span aria-hidden="true">About</span>
            <span aria-hidden="true">Us</span>
          </h1>
        </div>
      </section>

      <section className="ab-g ab-st" id="ab-statement">
        <p className="ab-th" style={col("1/11")} data-reveal>
          We’re a small studio building websites that feel like places.
        </p>
      </section>

      <section className="ab-g ab-sec" aria-labelledby="ab-origins">
        <p className="ab-t ab-num" style={col("1/3", "1/2")}>
          01
        </p>
        <h2 className="ab-t" style={col("3/5", "2/-1")} id="ab-origins">
          Company origins
        </h2>
        <p className="ab-t" style={col("7/10")} data-reveal>
          Calder was founded on one conviction: a website can be somewhere you go, not just something you read. We started building sites the way films are made, from a single image of how they should feel, followed all the way down. That idea is still the first thing we bring to every project.
        </p>
        <p className="ab-t" style={col("10/13")} data-reveal>
          Calder designs and builds immersive websites for brands that want a first visit to be remembered. We design and code every frame ourselves: real-time 3D, motion and sound. We take on only a few projects a year, so each one gets the whole studio, from the first sketch to the last transition.
        </p>
        <p className="ab-ts ab-cap" style={col("5/7")}>
          <b>Calder</b> — immersive web studio
        </p>
        <div className="ab-fr" style={{ ...col("7/13"), aspectRatio: "3/2" }} data-reveal>
          <Image src="/about/about-01-origins.webp" alt="A desk by a tall window, with a desktop computer, a laptop and two cups of coffee in the sun" fill sizes="(max-width: 640px) 100vw, 50vw" />
        </div>
      </section>

      <section className="ab-g ab-sec" aria-labelledby="ab-mission">
        <div className="ab-hl" />
        <p className="ab-t ab-num" style={col("1/3", "1/2")}>
          02
        </p>
        <h2 className="ab-t" style={col("3/7", "2/-1")} id="ab-mission">
          Mission
        </h2>
        <p className="ab-th" style={col("7/13")} data-reveal>
          Making the web feel like a place again
        </p>
        <div className="ab-fr" style={{ ...col("7/13"), aspectRatio: "3/2" }} data-reveal>
          <Image src="/about/about-02-mission.webp" alt="A hand on a keyboard at a stone desk, a monitor and a cup of coffee beside an open window" fill sizes="(max-width: 640px) 100vw, 50vw" />
        </div>
        <p className="ab-tl" style={col("7/13")} data-reveal>
          Our mission is clear: to build websites people remember. It starts with a feeling, and every decision answers to it: the type, the light, the pace of a scroll, the last transition. A site has to do more than look right. It has to draw you in, hold you there, and stay with you after you leave.
        </p>
        <p className="ab-tl" style={col("7/13")} data-reveal>
          We tell each story through type and light, pace and depth, and we care about the frame rate as much as the colour. A site isn’t finished when it looks right, but when it feels right.
        </p>
      </section>

      <section className="ab-team" aria-labelledby="ab-team">
        <h2 className="ab-team-t" id="ab-team" data-reveal>
          The Calder creative team
        </h2>
        <div className="ab-fm" data-reveal>
          <Image src="/about/about-03-team.webp" alt="The team at work in the studio: one leaning back in a chair, one at a monitor, one perched on a desk with a coffee" fill sizes="100vw" />
        </div>
        <div className="ab-g ab-tm">
          <ul className="ab-t ab-names" style={col("4/8")} aria-label="The team">
            <li>Calder Studio</li>
          </ul>
          <div className="ab-cols" style={col("8/11")}>
            <p className="ab-t" data-reveal>
              Each of us brings a different craft to the same table: design, real-time 3D, motion, sound and code. Working as one small team, we share every decision, so an idea never gets lost between departments.
            </p>
            <p className="ab-t" data-reveal>
              We are driven by questions. How does light move under water? Why does one scroll feel heavy and another weightless? What makes someone stay on a page a little longer? Our curiosity about how things work, and how people feel them, leads us to research every project in depth.
            </p>
            <p className="ab-t" data-reveal>
              Our first question is always the same: what should a visitor feel in the first second? Everything else follows from the answer.
            </p>
          </div>
        </div>
      </section>

      <section className="ab-g ab-cls">
        <h2 className="ab-th" style={col("1/7")} data-reveal>
          We’re a small studio building websites that feel like places.
        </h2>
        <div className="ab-fr ab-tall" style={{ ...col("8/13"), aspectRatio: "573/836" }} data-reveal>
          <Image src="/about/about-04-entrance.webp" alt="The studio's entrance: a stone step and an open glass door onto the bright room beyond" fill sizes="(max-width: 640px) 100vw, 42vw" />
        </div>
        <div className="ab-clb" style={col("1/8")}>
          <p className="ab-t" data-reveal>
            Tell us what your site should make people feel. We’ll take it from there: the story, the light, the motion, frame by frame, until it’s somewhere people want to stay.
          </p>
          <p className="ab-t">
            <Link className="ab-lk" href="/work">
              Selected work →
            </Link>
          </p>
        </div>
      </section>

      <AboutCta />
    </div>
  );
}
