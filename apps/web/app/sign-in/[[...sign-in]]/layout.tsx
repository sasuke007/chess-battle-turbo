import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Sign In",
  description: "Sign in to your ReplayChess account.",
  path: "/sign-in",
  noIndex: true,
});

export default function SignInLayout({ children }: { children: React.ReactNode }) {
  return children;
}
