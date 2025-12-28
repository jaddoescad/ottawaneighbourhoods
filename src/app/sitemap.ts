import { MetadataRoute } from 'next'
import data from '@/data/processed/data.json'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://ottawahoods.com'

  // Static pages
  const staticPages = [
    '',
    '/safest-neighbourhoods',
    '/dangerous-neighbourhoods',
    '/best-for-families',
    '/most-affordable',
    '/best-schools',
    '/best-elementary-schools',
    '/best-high-schools',
    '/best-transit',
    '/most-walkable',
    '/best-for-biking',
    '/best-parks',
    '/best-amenities',
    '/closest-hospitals',
    '/best-for-seniors',
    '/best-for-young-professionals',
    '/highest-density',
    '/lowest-density',
    '/best-tree-canopy',
    '/most-expensive',
    '/best-food-scene',
    '/best-for-nature',
  ]

  const staticEntries: MetadataRoute.Sitemap = staticPages.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: path === '' ? 1 : 0.8,
  }))

  // Dynamic neighbourhood pages
  const neighbourhoodEntries: MetadataRoute.Sitemap = data.neighbourhoods.map((neighbourhood) => ({
    url: `${baseUrl}/neighbourhood/${neighbourhood.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  return [...staticEntries, ...neighbourhoodEntries]
}
