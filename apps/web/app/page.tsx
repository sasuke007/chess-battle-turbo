import Hero from "./components/Hero";
import { HowToPlay } from "./components/HowToPlay";
import { Navbar } from "./components/Navbar";
import { Testimonials } from "./components/Testimonials";
import Image from "next/image";

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
        <Image src="/chess-icons/bb.png" alt="Chess Board" width={100} height={100} className=" w-[10%] mx-auto"/>
      </div>
    </>
  );
}
