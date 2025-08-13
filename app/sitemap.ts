import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://seno-slama.vercel.app'
  const now = new Date()
  return [
    { url: `${base}/`,       lastModified: now, changeFrequency: 'hourly', priority: 1 },
    { url: `${base}/pridat`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${base}/admin`,  lastModified: now, changeFrequency: 'weekly', priority: 0.3 },
  ]
}
