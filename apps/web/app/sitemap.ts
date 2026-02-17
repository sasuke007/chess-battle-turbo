import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://playchess.tech', lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: 'https://playchess.tech/play', lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: 'https://playchess.tech/pricing', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: 'https://playchess.tech/blog', lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: 'https://playchess.tech/about', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: 'https://playchess.tech/community', lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: 'https://playchess.tech/help', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: 'https://playchess.tech/contact', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: 'https://playchess.tech/docs/api', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: 'https://playchess.tech/careers', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: 'https://playchess.tech/status', lastModified: new Date(), changeFrequency: 'daily', priority: 0.3 },
    { url: 'https://playchess.tech/terms', lastModified: new Date(), changeFrequency: 'yearly', priority: 0.2 },
    { url: 'https://playchess.tech/privacy', lastModified: new Date(), changeFrequency: 'yearly', priority: 0.2 },
    { url: 'https://playchess.tech/cookies', lastModified: new Date(), changeFrequency: 'yearly', priority: 0.2 },
  ]
}
