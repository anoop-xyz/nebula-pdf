import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { MouseProvider } from "@/components/layout/mouse-context";
import { Navbar } from "@/components/layout/navbar";
import { AuthProvider } from "@/components/auth/auth-provider";
import { OnboardingModal } from "@/components/auth/onboarding-modal";
import { Footer } from "@/components/layout/footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://nebulapdf.online'),
  title: {
    default: "Nebula PDF | Next-Gen Online PDF Tools",
    template: "%s | Nebula PDF",
  },
  description: "Free, secure, and fast online PDF tools. Merge, Compress, Split, Convert, Sign, and Edit PDFs directly in your browser with zero data uploads.",
  keywords: [
    "PDF tools", "merge PDF", "compress PDF", "split PDF", "convert PDF",
    "PDF to image", "PDF to text", "sign PDF", "edit PDF", "online PDF editor",
    "secure PDF tools", "browser-based PDF", "Next.js PDF", "Nebula PDF", "free pdf tools",
    "combine pdf", "reduce pdf size", "extract pdf pages", "unlock pdf online"
  ],
  authors: [{ name: "Anoop Kumar" }],
  creator: "Anoop Kumar",
  publisher: "Nebula PDF",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://nebulapdf.online",
    title: "Nebula PDF | The Future of PDF Editing",
    description: "Experience the fastest, most secure PDF tools on the web. No uploads required for most operations.",
    siteName: "Nebula PDF",
    images: [
      {
        url: "/galaxy-bg-v2.jpg", // Using distinct background as teaser
        width: 1200,
        height: 630,
        alt: "Nebula PDF Interface",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nebula PDF | Next-Gen Online PDF Tools",
    description: "Secure, free, and beautiful PDF tools. Edit documents locally in your browser.",
    images: ["/galaxy-bg-v2.jpg"],
    creator: "@anoop_xyz", // Placeholder
  },
  icons: {
    icon: "/nebula-logo.png",
    shortcut: "/nebula-logo.png",
    apple: "/nebula-logo.png",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "Nebula PDF",
              "applicationCategory": "ProductivityApplication",
              "operatingSystem": "Web",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "description": "A suite of high-performance PDF manipulation tools directly in the browser.",
              "featureList": "Merge, Compress, Split, Convert, Sign, Protect, Unlock",
              "browserRequirements": "Requires JavaScript. Works in all modern browsers."
            })
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased text-foreground selection:bg-primary/20 selection:text-primary`}>
        <AuthProvider>
          <Navbar />
          <OnboardingModal />
          <MouseProvider>
            {children}
          </MouseProvider>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
