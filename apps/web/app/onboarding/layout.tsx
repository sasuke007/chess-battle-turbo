import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Onboarding",
  description: "Set up your ReplayChess profile.",
  path: "/onboarding",
  noIndex: true,
});

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
