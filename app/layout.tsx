import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { MouseProvider } from "@/components/layout/mouse-context";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Nebula PDF | Next-Gen PDF Tools",
  description: "High-performance, privacy-focused PDF tools with a deep space aesthetic.",
};

import { Navbar } from "@/components/layout/navbar";
import { AuthProvider } from "@/components/auth/auth-provider";
import { OnboardingModal } from "@/components/auth/onboarding-modal";
import { Footer } from "@/components/layout/footer";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
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
