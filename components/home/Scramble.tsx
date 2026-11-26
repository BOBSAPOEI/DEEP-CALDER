"use client";

import { useEffect, useRef, useState } from "react";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/<>+=*#サナミアカ";

/** Decodes its text from random glyphs once scrolled into view. */
export function Scramble({ text, className, as: Tag = "span" }: { text: string; className?: string; as?: "span" | "h2" | "p" }) {
  const ref = useRef<HTMLElement>(null);
  const [out, setOut] = useState(text);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const run = () => {
      const start = performance.now();
      const dur = 900;
      const tick = (t: number) => {
        const p = Math.min(1, (t - start) / dur);
        let s = "";
        for (let i = 0; i < text.length; i++) {
          const ch = text[i];
          s += ch === " " || p * text.length * 1.2 > i + 1 ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0];
        }
        setOut(s);
        if (p < 1) raf = requestAnimationFrame(tick);
        else setOut(text);
      };
      raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) run();
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [text]);

  return (
    <Tag ref={ref as never} className={className} aria-label={text}>
      <span aria-hidden="true">{out}</span>
    </Tag>
  );
}
