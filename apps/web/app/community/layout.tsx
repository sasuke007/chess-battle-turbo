import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Community",
  description:
    "Join tournaments, rankings, and connect with chess players on Chess Battle.",
  path: "/community",
});

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return children;
}
