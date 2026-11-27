import { Ocean } from "@/components/Ocean";
import { DepthMeter } from "@/components/home/DepthMeter";
import { HomeStory } from "@/components/home/HomeStory";

export default function Home() {
  return (
    <div className="home">
      <Ocean />
      <DepthMeter />
      <HomeStory />
    </div>
  );
}
