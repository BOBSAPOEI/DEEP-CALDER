import { Ocean } from "@/components/Ocean";
import { DepthMeter } from "@/components/home/DepthMeter";
import { HomeStory } from "@/components/home/HomeStory";

export default function Home() {
  return (
    <div className="home">
      <Ocean />
      <div className="horror" aria-hidden="true">
        <i className="horror-grain" />
      </div>
      <DepthMeter />
      <HomeStory />
    </div>
  );
}
