import { createMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = createMetadata({
  title: "Legends",
  description: "Manage chess legends in the ReplayChess admin dashboard.",
  path: "/admin/legends",
  noIndex: true,
});

export default function LegendsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
