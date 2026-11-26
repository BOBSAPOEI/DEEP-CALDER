import { Ocean } from "@/components/Ocean";
import { DepthMeter } from "@/components/home/DepthMeter";
import { Chapters } from "@/components/home/Chapters";
import { Finale, Hero, Manifesto } from "@/components/home/HomeParts";

export default function Home() {
  return (
    <div className="home">
      <Ocean />
      <DepthMeter />
      <Hero />
      <Chapters />
      <Manifesto />
      <Finale />
    </div>
  );
}
