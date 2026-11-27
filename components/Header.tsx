"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SITE } from "@/lib/content";
import { useSite } from "./SiteProvider";
import { useScrollProgress } from "./useScroll";
import { InstagramIcon, MailIcon, TikTokIcon } from "./Icons";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/work", label: "Work" },
  { href: "/about", label: "About" },
];

export function Header() {
  const path = usePathname();
  const home = path === "/";
  const p = useScrollProgress();
  const { openContact, soundOn, toggleSound } = useSite();
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menuPath, setMenuPath] = useState(path);
  if (menuPath !== path) {
    setMenuPath(path);
    setMenu(false);
  }
  const pastHero = !home || scrolled;

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > window.innerHeight * 0.45);
    const raf = requestAnimationFrame(on);
    window.addEventListener("scroll", on, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", on);
    };
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("menu-open", menu);
  }, [menu]);

  const atEnd = !home || p > 0.965;

  const onCapsule = () => {
    if (atEnd) openContact();
    else if (window.__lenis) window.__lenis.scrollTo(document.documentElement.scrollHeight, { duration: 6 });
    else window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
  };

  return (
    <>
      <header className="site-header">
        <div className="hdr-left">
          <Link href="/" className={`site-logo ${pastHero ? "is-on" : ""}`} aria-label="Calder — home">
            <Image src="/calder-mark.png" alt="" width={20} height={22} />
            Calder
          </Link>
          <button
            type="button"
            className={`site-sound ${soundOn ? "is-on" : ""}`}
            onClick={toggleSound}
            aria-pressed={soundOn}
            aria-label={soundOn ? "Sound off" : "Sound on"}
          >
            <svg viewBox="0 0 24 12" aria-hidden="true">
              <path d="M1 6 C 4 1, 7 1, 9 6 S 14 11, 16 6 S 21 1, 23 6" />
            </svg>
          </button>
        </div>

        <button type="button" className="capsule" onClick={onCapsule}>
          <span>{atEnd ? "Your project starts here →" : "Your project starts at 4,800 m ↓"}</span>
          <i className="capsule-bar" style={{ transform: `scaleX(${home ? p : 1})` }} />
        </button>

        <button
          type="button"
          className={`site-menu-btn ${menu ? "is-open" : ""}`}
          onClick={() => setMenu((m) => !m)}
          aria-expanded={menu}
          aria-controls="site-menu"
        >
          <span className="mb-label">{menu ? "Close" : "Menu"}</span>
          <span className="mb-dot">
            <i />
            <i />
          </span>
        </button>
      </header>

      <nav id="site-menu" className={`menu ${menu ? "is-open" : ""}`} aria-hidden={!menu}>
        <ol className="menu-list">
          {NAV.map((n, i) => (
            <li key={n.href} style={{ "--i": i } as React.CSSProperties}>
              <Link href={n.href} className={path === n.href ? "is-current" : ""} tabIndex={menu ? 0 : -1}>
                <small>0{i + 1}</small>
                {n.label}
              </Link>
            </li>
          ))}
          <li style={{ "--i": 3 } as React.CSSProperties}>
            <button
              type="button"
              tabIndex={menu ? 0 : -1}
              onClick={() => {
                setMenu(false);
                openContact();
              }}
            >
              <small>04</small>Contact
            </button>
          </li>
        </ol>
        <div className="menu-foot">
          <a href={`mailto:${SITE.email}`} tabIndex={menu ? 0 : -1}>
            {SITE.email}
          </a>
          <div className="menu-soc">
            <a href={SITE.socials[0].href} target="_blank" rel="noreferrer" aria-label="Instagram" tabIndex={menu ? 0 : -1}>
              <InstagramIcon />
            </a>
            <a href={SITE.socials[1].href} target="_blank" rel="noreferrer" aria-label="TikTok" tabIndex={menu ? 0 : -1}>
              <TikTokIcon />
            </a>
            <a href={`mailto:${SITE.email}`} aria-label="Email" tabIndex={menu ? 0 : -1}>
              <MailIcon />
            </a>
          </div>
        </div>
      </nav>
    </>
  );
}
