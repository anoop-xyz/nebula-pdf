import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    const baseUrl = 'https://nebula-pdf.vercel.app' // Replace with your actual domain

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/secure/', '/api/'], // Disallow private/API routes
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    }
}
