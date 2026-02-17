import Hero from "./components/Hero";
import { HowToPlay } from "./components/HowToPlay";
import { Navbar } from "./components/Navbar";
import { AgadmatorFeature } from "./components/AgadmatorFeature";
import { Footer } from "./components/Footer";

const webAppJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Chess Battle",
  url: "https://playchess.tech",
  description:
    "Challenge friends to epic battles from legendary positions. Master the game. Claim victory.",
  applicationCategory: "GameApplication",
  operatingSystem: "Any",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  author: {
    "@type": "Organization",
    name: "Chess Battle",
    url: "https://playchess.tech",
  },
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
      />
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
