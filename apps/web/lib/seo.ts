import type { Metadata } from "next";

const BASE_URL = "https://playchess.tech";

interface CreateMetadataOptions {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
  noIndex?: boolean;
}

export function createMetadata({
  title,
  description,
  path,
  ogImage = "/chess_logo_share.png",
  noIndex = false,
}: CreateMetadataOptions): Metadata {
  const url = `${BASE_URL}${path}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "Chess Battle",
      images: [{ url: ogImage, width: 1200, height: 630, alt: "Chess Battle" }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    ...(noIndex && { robots: { index: false, follow: false } }),
  };
}
