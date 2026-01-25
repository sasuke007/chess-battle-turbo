import Hero from "./components/Hero";
import { HowToPlay } from "./components/HowToPlay";
import { Navbar } from "./components/Navbar";
import { AgadmatorFeature } from "./components/AgadmatorFeature";
import { Footer } from "./components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <div className="w-full bg-black text-white">
        <div className="h-screen w-full">
          <Hero />
        </div>
        <HowToPlay />
        <AgadmatorFeature />
        <Footer />
      </div>
    </>
  );
}
