import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Contact Us",
  description: "Get in touch with the Chess Battle team for support, partnerships, or feedback.",
  path: "/contact",
});

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
