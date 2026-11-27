/**
 * The dive timeline: one scroll progress value (0 → 1) drives every layer of the home page.
 *
 *   hero      0.00 – 0.05   wordmark, surface
 *   chapters  0.05 – 0.47   three chapters in the sunlight zone (0 → 180 m), ice crystals drift past
 *   descent   0.47 – 0.55   the plunge (180 → 4,000 m)
 *   abyss     0.55 – 0.90   manifesto lines, the megalodon circles
 *   finale    0.90 – 1.00   "Start your project" (→ 4,800 m)
 */
export const SEG = {
  hero: [0, 0.05],
  chapters: [0.05, 0.47],
  descent: [0.47, 0.55],
  abyss: [0.55, 0.9],
  finale: [0.9, 1],
} as const;

export const CHAPTER_SPAN = (SEG.chapters[1] - SEG.chapters[0]) / 3;
export const MANIFESTO_BLOCKS = 4;
export const MANIFESTO_SPAN = (SEG.abyss[1] - SEG.abyss[0]) / MANIFESTO_BLOCKS;

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const local = (p: number, [a, b]: readonly [number, number]) => clamp01((p - a) / (b - a));

/** Depth in metres shown on the gauge. */
export function depthAt(p: number) {
  if (p < SEG.chapters[0]) return 0;
  if (p < SEG.descent[0]) return lerp(0, 180, local(p, SEG.chapters));
  if (p < SEG.abyss[0]) return lerp(180, 4000, easeInOut(local(p, SEG.descent)));
  if (p < SEG.finale[0]) return lerp(4000, 4120, local(p, SEG.abyss));
  return lerp(4120, 4800, easeInOut(local(p, SEG.finale)));
}

/** Camera height in world units (the 3D column runs from +8 down to about -200). */
export const WORLD = { chaptersEnd: -62, abyssTop: -150, abyssBottom: -168, floor: -178 };
export function camYAt(p: number) {
  if (p < SEG.chapters[0]) return lerp(0, -2, local(p, SEG.hero));
  if (p < SEG.descent[0]) return lerp(-2, WORLD.chaptersEnd, local(p, SEG.chapters));
  if (p < SEG.abyss[0]) return lerp(WORLD.chaptersEnd, WORLD.abyssTop, easeInOut(local(p, SEG.descent)));
  if (p < SEG.finale[0]) return lerp(WORLD.abyssTop, WORLD.abyssBottom, local(p, SEG.abyss));
  return lerp(WORLD.abyssBottom, WORLD.floor, local(p, SEG.finale));
}
