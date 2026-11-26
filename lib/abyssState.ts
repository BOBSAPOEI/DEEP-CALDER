/** Shared, frame-updated state between the WebGL dive and the audio engine. */
export const abyss = {
  /** scroll progress of the dive, 0 (surface) → 1 (abyss) */
  depth: 0,
  /** 0 → 1: how close the megalodon is to the viewer */
  threat: 0,
};
