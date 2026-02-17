import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://playchess.tech', lastModified: new Date() },
    { url: 'https://playchess.tech/play', lastModified: new Date() },
    { url: 'https://playchess.tech/pricing', lastModified: new Date() },
    { url: 'https://playchess.tech/about', lastModified: new Date() },
    { url: 'https://playchess.tech/blog', lastModified: new Date() },
    { url: 'https://playchess.tech/help', lastModified: new Date() },
    { url: 'https://playchess.tech/contact', lastModified: new Date() },
  ]
}
