import { createMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = createMetadata({
  title: "Sign In",
  description: "Sign in to your ReplayChess account.",
  path: "/sign-in",
  noIndex: true,
});

export default function SignInLayout({ children }: { children: React.ReactNode }) {
  return children;
}
