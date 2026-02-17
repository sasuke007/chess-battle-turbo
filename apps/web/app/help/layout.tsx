import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Help Center",
  description:
    "Browse help articles on game modes, billing, and technical issues on Chess Battle.",
  path: "/help",
});

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return children;
}
