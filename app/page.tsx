"use client";

import Link from "next/link";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { FileStack, Minimize2, Image as ImageIcon, RotateCw, Shield, Wand2, LayoutGrid, Droplets, Scissors, PenLine, FileText, Lock, Hash, FileArchive } from "lucide-react";
import { cn } from "@/lib/utils";

const tools = [
  {
    title: "Merge PDF",
    description: "Combine multiple PDFs into a single file.",
    icon: FileStack,
    href: "/merge",
    color: "rgba(168, 85, 247, 0.4)", // Purple
    span: "col-span-1 md:col-span-2",
  },
  {
    title: "Organize PDF",
    description: "Rearrange pages and rotate individual slides.",
    icon: LayoutGrid,
    href: "/organize",
    color: "from-orange-500 to-red-500", // Orange/Red
    span: "col-span-1",
  },
  {
    title: "Compress PDF",
    description: "Reduce file size while maintaining quality.",
    icon: Minimize2,
    href: "/compress",
    color: "rgba(34, 197, 94, 0.4)", // Green
    span: "col-span-1",
  },
  {
    title: "Watermark PDF",
    description: "Stamp text on your documents.",
    icon: Droplets,
    href: "/watermark",
    color: "rgba(56, 189, 248, 0.4)", // Sky Blue
    span: "col-span-1",
  },
  {
    title: "Image to PDF",
    description: "Convert JPG, PNG images to PDF documents.",
    icon: ImageIcon,
    href: "/images-to-pdf",
    color: "rgba(239, 68, 68, 0.4)", // Red
    span: "col-span-1",
  },
  {
    title: "Rotate PDF",
    description: "Rotate specific pages or the entire document.",
    icon: RotateCw,
    href: "/rotate",
    color: "rgba(234, 179, 8, 0.4)", // Yellow
    span: "col-span-1",
  },
  {
    title: "Secure PDF",
    description: "Encrypt your PDF with a password.",
    icon: Shield,
    href: "/secure",
    color: "rgba(236, 72, 153, 0.4)", // Pink
    span: "col-span-1 md:col-span-2",
  },
  {
    title: "Split PDF",
    description: "Extract specific pages from your document.",
    icon: Scissors,
    href: "/split",
    color: "rgba(251, 146, 60, 0.4)", // Orange
    span: "col-span-1",
  },
  {
    title: "PDF to Image",
    description: "Convert pages to high-quality images.",
    icon: FileArchive,
    href: "/pdf-to-image",
    color: "rgba(236, 72, 153, 0.4)", // Pink
    span: "col-span-1",
  },
  {
    title: "PDF to Text",
    description: "Extract text content from any PDF.",
    icon: FileText,
    href: "/pdf-to-text",
    color: "rgba(56, 189, 248, 0.4)", // Sky
    span: "col-span-1",
  },
  {
    title: "Sign PDF",
    description: "Add your signature to documents.",
    icon: PenLine,
    href: "/sign",
    color: "rgba(168, 85, 247, 0.4)", // Purple
    span: "col-span-1 md:col-span-2",
  },
  {
    title: "Unlock PDF",
    description: "Remove passwords from your files.",
    icon: Lock,
    href: "/unlock",
    color: "rgba(239, 68, 68, 0.4)", // Red
    span: "col-span-1",
  },
  {
    title: "Page Numbers",
    description: "Add sequential page numbering.",
    icon: Hash,
    href: "/page-numbers",
    color: "rgba(34, 197, 94, 0.4)", // Green
    span: "col-span-1",
  },
];

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { useCredits } from "@/hooks/use-credits";
import { AuthModal } from "@/components/auth/auth-modal";
import { CreditPurchaseModal } from "@/components/payment/credit-purchase-modal";
import { ToolCard } from "@/components/ui/tool-card";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  const { getCredits, getTimeUntilReset } = useCredits();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  // const router = useRouter(); // Removed - not needed in parent

  // Force re-render periodically to update timers
  const [_, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const filteredTools = tools.filter((tool) =>
    tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 md:p-24 relative z-10">
      <div className="max-w-5xl w-full space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            Nebula PDF
          </h1>
          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto">
            Next-gen PDF tools running entirely in your browser.
            <br />
            Private, fast, and beautiful.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md mx-auto w-full group">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl blur-xl group-hover:blur-2xl transition-all opacity-50" />
          <div className="relative bg-slate-900/80 border border-slate-800 backdrop-blur-sm rounded-xl flex items-center p-1 focus-within:border-slate-600 transition-colors">
            <Search className="w-5 h-5 text-slate-400 ml-3" />
            <input
              type="text"
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-0 px-3 py-2"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredTools.map((tool) => (
            <ToolCard key={tool.title} tool={tool} />
          ))}

          {filteredTools.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-500">
              No tools found matching "{searchQuery}"
            </div>
          )}
        </div>
      </div >

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <CreditPurchaseModal isOpen={isPurchaseModalOpen} onClose={() => setIsPurchaseModalOpen(false)} />
    </main >
  );
}
