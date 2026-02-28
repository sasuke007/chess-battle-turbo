import { createMetadata } from "@/lib/seo";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/get-session-user";
import type { Metadata } from "next";

export const metadata: Metadata = createMetadata({
  title: "Admin",
  description: "ReplayChess admin dashboard.",
  path: "/admin",
  noIndex: true,
});

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();

  if (!user || user.role !== "ADMIN") {
    redirect("/");
  }

  return children;
}
