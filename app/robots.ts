import type { MetadataRoute } from 'next'

// This is a private, authenticated app handling personal health data --
// nothing here should be indexed by search engines.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      disallow: '/',
    },
  }
}
