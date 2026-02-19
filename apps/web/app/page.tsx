import Script from "next/script";
import { createMetadata } from "@/lib/seo";
import Hero from "./components/Hero";
import { HowToPlay } from "./components/HowToPlay";
import { Navbar } from "./components/Navbar";
import { AgadmatorFeature } from "./components/AgadmatorFeature";
import { Footer } from "./components/Footer";

export const metadata = createMetadata({
  title: "ReplayChess - Master Chess Through Legendary Games",
  description:
    "Replay iconic chess positions from history's greatest games. Study grandmaster moves, challenge friends, and master the classics.",
  path: "/",
});

const webAppJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "ReplayChess",
  url: "https://playchess.tech",
  description:
    "Replay iconic chess positions from history's greatest games. Study grandmaster moves, challenge friends, and master the classics.",
  applicationCategory: "GameApplication",
  operatingSystem: "Any",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  author: {
    "@type": "Organization",
    name: "ReplayChess",
    url: "https://playchess.tech",
  },
};

export default function Home() {
  return (
    <>
      <Script id="webapp-jsonld" type="application/ld+json">
        {JSON.stringify(webAppJsonLd)}
      </Script>
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
