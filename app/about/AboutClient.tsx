"use client";

import { useSite } from "@/components/SiteProvider";
import { useReveal } from "@/components/useScroll";

export function AboutReveal() {
  useReveal();
  return null;
}

export function AboutCta() {
  const { openContact } = useSite();
  return (
    <div className="wk-foot">
      <p>Have something worth the dive?</p>
      <button type="button" className="wk-cta" onClick={openContact}>
        Start your project ↓ 4,800 m
      </button>
    </div>
  );
}
