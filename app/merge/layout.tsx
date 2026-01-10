import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Merge PDF - Combine PDF Files Online for Free',
    description: 'Join multiple PDF documents into one valid PDF file instantly. Free, secure, and fast PDF merger tool. No registration required.',
    keywords: ['merge pdf', 'combine pdf', 'join pdf', 'pdf merger', 'combine pdf files', 'free pdf merger'],
    openGraph: {
        title: 'Merge PDF - Combine PDF Files Online for Free',
        description: 'Join multiple PDF documents into one valid PDF file instantly.',
        url: '/merge',
    }
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
}
