import { createMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = createMetadata({
  title: "About",
  description:
    "Learn how ReplayChess makes chess history interactive with legendary positions, AI analysis, and multiplayer battles.",
  path: "/about",
});

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
