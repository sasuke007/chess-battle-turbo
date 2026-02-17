import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "You've Been Challenged!",
  description: "Accept a chess challenge and join the battle on ReplayChess.",
  path: "/join",
  noIndex: true,
});

export default function JoinLayout({ children }: { children: React.ReactNode }) {
  return children;
}
