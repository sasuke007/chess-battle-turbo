import { createMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = createMetadata({
  title: "Community",
  description:
    "Join tournaments, rankings, and connect with chess players on ReplayChess.",
  path: "/community",
});

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return children;
}
