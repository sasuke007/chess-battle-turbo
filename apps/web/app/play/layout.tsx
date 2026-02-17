import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Play Chess",
  description:
    "Start a game — quick match, challenge friends, or play against AI on Chess Battle.",
  path: "/play",
});

export default function PlayLayout({ children }: { children: React.ReactNode }) {
  return children;
}
