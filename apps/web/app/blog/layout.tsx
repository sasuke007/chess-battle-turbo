import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Blog",
  description:
    "Chess strategy, legendary game analysis, and community stories from ReplayChess.",
  path: "/blog",
});

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
