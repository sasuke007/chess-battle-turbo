import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Chess Game",
  description: "Live chess game on ReplayChess.",
  path: "/game",
  noIndex: true,
});

export default function GameLayout({ children }: { children: React.ReactNode }) {
  return children;
}
