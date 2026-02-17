import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Chess Openings",
  description:
    "Browse hundreds of chess openings organized by ECO code. Study move sequences, positions, and play from any opening.",
  path: "/openings",
  ogType: "opening",
  ogTitle: "Chess Openings",
});

export default function OpeningsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
