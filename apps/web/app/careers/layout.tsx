import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Careers",
  description:
    "Join the team building the future of interactive chess at Chess Battle.",
  path: "/careers",
});

export default function CareersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
