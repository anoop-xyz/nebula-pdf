import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    const baseUrl = 'https://www.nebulapdf.online' // Replace with your actual domain

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/api/'], // Disallow private/API routes
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    }
}
