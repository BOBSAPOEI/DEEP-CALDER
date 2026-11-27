export const SITE = {
  name: "Calder",
  email: "hello@calder.studio" /* TODO: ganti dengan email asli */,
  socials: [
    { label: "Instagram", href: "https://instagram.com/" /* TODO */ },
    { label: "TikTok", href: "https://tiktok.com/" /* TODO */ },
  ],
  legal: ["Legal notice", "Privacy", "Cookies", "Credits"],
};

export const HERO = {
  kicker: "Immersive web studio",
  line: "We build worlds people remember.",
};

export const CHAPTERS = [
  {
    title: "origin",
    subtitle: "an immersive web studio",
    phrases: ["Design and code, under one roof.", "No templates. No handoffs.", "Small by choice."],
    teasers: ["who we are", "how we work", "why so few"],
    long: [
      "Calder is an immersive web studio. We design and build websites that use 3D, motion and light the way film uses a camera — to make people feel something before they read a word.",
      "Art direction and engineering share the same table, from the first sketch to the last frame. Nothing gets lost in a handoff, because there isn't one.",
      "We take on a small number of brands each year. Not a production line — a studio that knows your project by heart and answers for every detail.",
    ],
  },
  {
    title: "craft",
    subtitle: "worlds, not pages",
    phrases: ["Real-time 3D and cinematic motion.", "Every effect earns its place.", "Fluid on every screen."],
    teasers: ["what we build", "our one rule", "built to run"],
    long: [
      "We build websites as places to be entered, not pages to be scanned — one scene, one story, designed around what makes your brand yours.",
      "WebGL, 3D, cinematic scroll and motion design, composed with an editor's restraint. If an effect doesn't serve the story, it doesn't ship.",
      "Spectacle that stutters is noise. Every experience is engineered to run smoothly on a phone as well as a studio monitor, with SEO and accessibility built in from day one.",
    ],
  },
  {
    title: "presence",
    subtitle: "felt first, then chosen",
    phrases: ["Your brand, at its true level.", "Visited once. Remembered.", "It starts with a conversation."],
    teasers: ["the gap we close", "why it works", "how to start"],
    long: [
      "Premium brands lose value in the gap between what they sell and how they appear online. We close that gap, so the first visit feels like the product itself.",
      "People forget pages. They remember places. An immersive site turns a visit into something clients describe to others — and that is where preference begins.",
      "If your brand deserves more than a template, tell us what you're building. We reply personally, and every project begins with a conversation, not a quote.",
    ],
  },
];

export const HELLO = ["Hello", "你好", "नमस्ते", "Hola", "مرحبا", "Olá", "নমস্কার", "Привет", "こんにちは", "Bonjour"];

export const MAX_DEPTH = 4800;

export function zoneFor(m: number) {
  return m < 200 ? "sunlight zone" : m < 1000 ? "twilight zone" : m < 3999.5 ? "midnight zone" : "the abyss";
}

export type Filter = "web" | "site" | "shop";

export const FILTERS: { id: Filter; label: string; color: string }[] = [
  { id: "web", label: "Immersive web", color: "#7fd6c0" },
  { id: "site", label: "Website", color: "#9fd0ff" },
  { id: "shop", label: "E-commerce", color: "#f0a6b3" },
];

export const PROJECTS: {
  slug: string;
  name: string;
  tagline: string;
  type: string;
  tags: Filter[];
  year: number;
  bg: string;
  featured: boolean;
}[] = [
  { slug: "pliego", name: "Pliego", tagline: "Sculptural vessels, hand-folded in Madrid", type: "E-commerce / Immersive web", tags: ["shop", "web"], year: 2026, bg: "#4a4f3a", featured: true },
  { slug: "toka", name: "TŌKA", tagline: "Omakase in four European cities", type: "Website", tags: ["site"], year: 2026, bg: "#3a1a15", featured: true },
  { slug: "olene", name: "OLENE", tagline: "Base meets Colour.", type: "E-commerce / Immersive web", tags: ["shop", "web"], year: 2026, bg: "#33244e", featured: true },
  { slug: "almara", name: "Almara", tagline: "Six private villas on Ibiza's west coast", type: "Website / Immersive web", tags: ["site", "web"], year: 2026, bg: "#663f1a", featured: true },
  { slug: "aplomo", name: "APLOMO", tagline: "We raise cities, plumb.", type: "Website", tags: ["site"], year: 2026, bg: "#5e5a54", featured: false },
  { slug: "maison-isole", name: "Maison Isolé", tagline: "Cold sculpts. Light restores.", type: "Website", tags: ["site"], year: 2026, bg: "#b5382a", featured: false },
];
