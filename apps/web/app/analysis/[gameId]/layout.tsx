import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Game Analysis",
  description: "Analyze chess game moves with AI-powered insights on ReplayChess.",
  path: "/analysis",
  noIndex: true,
});

export default function AnalysisLayout({ children }: { children: React.ReactNode }) {
  return children;
}
