import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

interface Props {
  params: Promise<{ referenceId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { referenceId } = await params;
  const user = await prisma.user.findUnique({
    where: { referenceId },
    select: { name: true, code: true, profilePictureUrl: true },
  });

  if (!user) {
    return { title: "Player Not Found", robots: { index: false, follow: false } };
  }

  const title = `${user.name} (${user.code})`;
  const description = `View ${user.name}'s chess profile, stats, and game history on Chess Battle.`;

  return {
    title,
    description,
    alternates: { canonical: `https://playchess.tech/profile/${referenceId}` },
    openGraph: {
      title,
      description,
      url: `https://playchess.tech/profile/${referenceId}`,
      siteName: "Chess Battle",
      ...(user.profilePictureUrl && {
        images: [{ url: user.profilePictureUrl, width: 200, height: 200, alt: user.name }],
      }),
      type: "profile",
    },
    twitter: {
      card: "summary",
      title,
      description,
      ...(user.profilePictureUrl && { images: [user.profilePictureUrl] }),
    },
  };
}

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
