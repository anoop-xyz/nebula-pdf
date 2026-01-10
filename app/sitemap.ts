import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://pdfnebula.vercel.app'

    // Core Tools
    const routes = [
        '',
        '/compress',
        '/images-to-pdf',
        '/merge',
        '/organize',
        '/page-numbers',
        '/pdf-to-image',
        '/pdf-to-text',
        '/rotate',
        '/secure',
        '/sign',
        '/split',
        '/unlock',
        '/view',
        '/watermark',
        '/policies/contact',
        '/policies/privacy',
        '/policies/refund',
        '/policies/shipping',
        '/policies/terms',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: route === '' ? 1 : 0.8,
    }))

    return routes
}
