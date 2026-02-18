import { createMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = createMetadata({
  title: "API Documentation",
  description:
    "Integrate chess positions and game data via the ReplayChess API.",
  path: "/docs/api",
});

export default function ApiDocsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
