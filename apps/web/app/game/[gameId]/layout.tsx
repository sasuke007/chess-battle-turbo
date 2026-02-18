import { createMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = createMetadata({
  title: "Chess Game",
  description: "Live chess game on ReplayChess.",
  path: "/game",
  noIndex: true,
});

export default function GameLayout({ children }: { children: React.ReactNode }) {
  return children;
}
