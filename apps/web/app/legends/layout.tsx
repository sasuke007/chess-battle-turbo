import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Chess Legends",
  description:
    "Explore profiles of history's greatest chess players — from Morphy and Capablanca to Fischer and Carlsen.",
  path: "/legends",
  ogType: "legend",
  ogTitle: "Chess Legends",
});

export default function LegendsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
