import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Matchmaking",
  description: "Finding your next opponent on ReplayChess.",
  path: "/queue",
  noIndex: true,
});

export default function QueueLayout({ children }: { children: React.ReactNode }) {
  return children;
}
