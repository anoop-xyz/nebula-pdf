"use client";

import Link from "next/link";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { FileStack, Minimize2, Image as ImageIcon, RotateCw, Shield, Wand2, LayoutGrid, Droplets, Scissors, PenLine, FileText, Lock, Hash, FileArchive } from "lucide-react";

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

export default function Home() {
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tools.map((tool) => (
            <Link key={tool.title} href={tool.href} className={tool.span}>
              <SpotlightCard
                className="h-full flex flex-col justify-between group/card"
                spotlightColor={tool.color}
              >
                <div className="space-y-4">
                  <div className="p-3 w-fit rounded-lg bg-slate-800/50 border border-slate-700/50 group-hover/card:border-slate-600 transition-colors">
                    <tool.icon className="w-6 h-6 text-slate-200" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-100 mb-2">
                      {tool.title}
                    </h2>
                    <p className="text-slate-400 text-sm">
                      {tool.description}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex items-center text-sm font-medium text-slate-500 group-hover/card:text-slate-300 transition-colors">
                  Open Tool <Wand2 className="w-4 h-4 ml-2 opacity-0 -translate-x-2 group-hover/card:opacity-100 group-hover/card:translate-x-0 transition-all" />
                </div>
              </SpotlightCard>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
