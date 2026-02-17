import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Admin",
  description: "Chess Battle admin dashboard.",
  path: "/admin",
  noIndex: true,
});

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
