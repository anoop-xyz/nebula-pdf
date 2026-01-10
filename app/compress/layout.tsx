import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Compress PDF - Reduce File Size Online for Free',
    description: 'Reduce PDF file size while maintaining quality with our smart compression tool. Optimize PDFs for web and email instantly.',
    keywords: ['compress pdf', 'reduce pdf size', 'optimize pdf', 'shrink pdf', 'compress pdf online', 'pdf compressor'],
    openGraph: {
        title: 'Compress PDF - Reduce File Size Online for Free',
        description: 'Reduce PDF file size while maintaining quality instantly.',
        url: '/compress',
    }
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
}
