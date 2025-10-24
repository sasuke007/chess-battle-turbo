import Hero from "./components/Hero";
import { HowToPlay } from "./components/HowToPlay";
import { Navbar } from "./components/Navbar";
import { Testimonials } from "./components/Testimonials";

export default function Home() {
  return (
    <>
      <Navbar/>
      <div className="w-full bg-neutral-900">
        <div className="h-[80vh] w-full">
          <Hero />
        </div>
        <HowToPlay/>
        <Testimonials />
      </div>
    </>
  );
}
