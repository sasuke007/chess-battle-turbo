import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "You've Been Challenged!",
  description: "Accept a chess challenge and join the battle on Chess Battle.",
  path: "/join",
});

export default function JoinLayout({ children }: { children: React.ReactNode }) {
  return children;
}
