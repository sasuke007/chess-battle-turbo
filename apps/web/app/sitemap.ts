import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'
import { blogPosts } from '@/lib/blog-data'

const BASE_URL = 'https://playchess.tech'
const SAFETY_LIMIT = 50_000

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE_URL}/play`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/pricing`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/legends`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/openings`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/community`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE_URL}/help`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/docs/api`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/careers`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/status`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE_URL}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE_URL}/cookies`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.2 },
  ]

  // Blog post pages
  const blogPages: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  // Dynamic pages — degrade gracefully if DB is unavailable
  let profilePages: MetadataRoute.Sitemap = []
  let legendPages: MetadataRoute.Sitemap = []
  let openingPages: MetadataRoute.Sitemap = []

  try {
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: { referenceId: true, updatedAt: true },
      take: SAFETY_LIMIT,
      orderBy: { updatedAt: 'desc' },
    })
    profilePages = users.map((user) => ({
      url: `${BASE_URL}/profile/${user.referenceId}`,
      lastModified: user.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    }))
  } catch {
    // DB unavailable — return static sitemap without profiles
  }

  try {
    const legends = await prisma.legend.findMany({
      where: { isActive: true, isVisible: true },
      select: { referenceId: true, updatedAt: true },
    })
    legendPages = legends.map((legend) => ({
      url: `${BASE_URL}/legends/${legend.referenceId}`,
      lastModified: legend.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }))
  } catch {
    // DB unavailable — return sitemap without legends
  }

  try {
    const openings = await prisma.opening.findMany({
      where: { isActive: true },
      select: { referenceId: true, updatedAt: true },
    })
    openingPages = openings.map((opening) => ({
      url: `${BASE_URL}/openings/${opening.referenceId}`,
      lastModified: opening.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))
  } catch {
    // DB unavailable — return sitemap without openings
  }

  return [...staticPages, ...blogPages, ...profilePages, ...legendPages, ...openingPages]
}
