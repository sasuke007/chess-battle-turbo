import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "System Status",
  description: "Real-time status of Chess Battle services and infrastructure.",
  path: "/status",
});

export default function StatusLayout({ children }: { children: React.ReactNode }) {
  return children;
}
