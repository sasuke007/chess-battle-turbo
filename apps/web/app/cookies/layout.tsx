import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Cookie Policy",
  description: "How Chess Battle uses cookies to improve your experience.",
  path: "/cookies",
});

export default function CookiesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
