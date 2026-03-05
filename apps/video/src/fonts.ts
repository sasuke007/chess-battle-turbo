import { loadFont } from "@remotion/google-fonts/InstrumentSerif";
import { loadFont as loadLocalFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Google Fonts — Instrument Serif (headers)
export const { fontFamily: instrumentSerif } = loadFont("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

export const { fontFamily: instrumentSerifItalic } = loadFont("italic", {
  weights: ["400"],
  subsets: ["latin"],
});

// Local fonts — Geist (body) and Geist Mono (technical)
const geistLoaded = loadLocalFont({
  family: "Geist",
  url: staticFile("fonts/GeistVF.woff"),
  weight: "100 900",
});

const geistMonoLoaded = loadLocalFont({
  family: "Geist Mono",
  url: staticFile("fonts/GeistMonoVF.woff"),
  weight: "100 900",
});

export const geist = "Geist, sans-serif";
export const geistMono = "Geist Mono, monospace";

export const fontsLoaded = Promise.all([geistLoaded, geistMonoLoaded]);
