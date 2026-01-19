import Hero from "./components/Hero";
import { HowToPlay } from "./components/HowToPlay";
import { Navbar } from "./components/Navbar";
import { Testimonials } from "./components/Testimonials";
import { AgadmatorFeature } from "./components/AgadmatorFeature";
import { Footer } from "./components/Footer";

export default function Home() {
  return (
    <>
      <Navbar/>
      <div className="w-full bg-neutral-900">
        <div className="h-[80vh] w-full">
          <Hero />
        </div>
        <HowToPlay/>
        <AgadmatorFeature />
        <Testimonials />
        <Footer />
      </div>
    </>
  );
}
