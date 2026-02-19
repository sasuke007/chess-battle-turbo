import { createMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = createMetadata({
  title: "Chess Positions",
  description: "Manage chess positions in the ReplayChess admin dashboard.",
  path: "/admin/chess-positions",
  noIndex: true,
});

export default function ChessPositionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
