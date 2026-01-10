import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Split PDF - Separate Pages Online for Free',
    description: 'Split PDF files into individual pages or extract specific page ranges securely online. Free, fast, and easy to use.',
    keywords: ['split pdf', 'separate pdf pages', 'extract pdf pages', 'cut pdf', 'split pdf online', 'pdf splitter'],
    openGraph: {
        title: 'Split PDF - Separate Pages Online for Free',
        description: 'Split PDF files into individual pages or extract specific page ranges instantly.',
        url: '/split',
    }
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
}
