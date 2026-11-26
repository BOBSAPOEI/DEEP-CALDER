import type { Metadata } from "next";
import { WorkGrid } from "./WorkGrid";

export const metadata: Metadata = {
  title: "Work — Samana Studio",
  description: "Every project is a world of its own: real-time 3D, motion and sound, made by hand for one brand at a time.",
};

export default function WorkPage() {
  return <WorkGrid />;
}
