"use client";

import React, { useState, useEffect } from "react";
import { ToolLayout } from "@/components/layout/tool-layout";
import { FileUpload } from "@/components/ui/file-upload";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { usePDF } from "@/hooks/use-pdf";
import { Check, GripVertical, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
// pdfjs-dist import handled dynamically

interface PageTile {
    id: string;
    originalIndex: number; // 0-based index from original PDF
    displayNumber: number; // 1-based page number
    thumbnail?: string;
    selected: boolean;
}

export default function SplitPage() {
    const [file, setFile] = useState<File | null>(null);
    const [pages, setPages] = useState<PageTile[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { splitPDF, isProcessing, progress } = usePDF();

    const handleFilesSelected = async (files: File[]) => {
        if (files.length > 0) {
            const selectedFile = files[0];
            setFile(selectedFile);
            setIsLoading(true);

            try {
                const pdfjsLib = await import("pdfjs-dist");
                pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

                const buffer = await selectedFile.arrayBuffer();
                const pdf = await pdfjsLib.getDocument(buffer).promise;
                const numPages = pdf.numPages;

                const newPages: PageTile[] = [];

                for (let i = 1; i <= numPages; i++) {
                    const page = await pdf.getPage(i);
                    const viewport = page.getViewport({ scale: 0.3 });
                    const canvas = document.createElement("canvas");
                    const context = canvas.getContext("2d");
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;

                    if (context) {
                        await page.render({ canvasContext: context, viewport } as any).promise;
                        newPages.push({
                            id: `page-${i - 1}`,
                            originalIndex: i - 1,
                            displayNumber: i,
                            thumbnail: canvas.toDataURL(),
                            selected: false,
                        });
                    }
                }
                setPages(newPages);
            } catch (err) {
                console.error("Error generating thumbnails:", err);
                // Fallback (omitted for brevity, can duplicate logic from organize if needed)
            } finally {
                setIsLoading(false);
            }
        }
    };

    const togglePageSelection = (id: string) => {
        setPages(prev => prev.map(page =>
            page.id === id ? { ...page, selected: !page.selected } : page
        ));
    };

    const selectAll = () => {
        const allSelected = pages.every(p => p.selected);
        setPages(prev => prev.map(p => ({ ...p, selected: !allSelected })));
    };

    const handleSplit = async () => {
        if (!file) return;
        const selectedIndices = pages.filter(p => p.selected).map(p => p.originalIndex);
        if (selectedIndices.length === 0) return;

        await splitPDF(file, selectedIndices);
    };

    const selectedCount = pages.filter(p => p.selected).length;

    return (
        <ToolLayout
            title="Split PDF"
            description="Extract specific pages from your PDF document."
            isLoading={isProcessing || isLoading}
            progress={progress}
        >
            {!file ? (
                <div className="h-full flex flex-col items-center justify-center">
                    <FileUpload
                        onFilesSelected={handleFilesSelected}
                        multiple={false}
                        accept={{ "application/pdf": [".pdf"] }}
                        className="w-full max-w-xl"
                    />
                </div>
            ) : (
                <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setFile(null)}
                                className="text-slate-400 hover:text-slate-200 text-sm"
                            >
                                Change File
                            </button>
                            <div className="h-4 w-px bg-slate-700" />
                            <button
                                onClick={selectAll}
                                className="text-primary hover:text-primary/80 text-sm font-medium"
                            >
                                {pages.every(p => p.selected) ? "Deselect All" : "Select All"}
                            </button>
                            <span className="text-slate-400 text-sm ml-2">{selectedCount} Selected</span>
                        </div>

                        <MagneticButton
                            onClick={handleSplit}
                            disabled={selectedCount === 0 || isProcessing}
                            className="w-auto"
                        >
                            {isProcessing ? "Extracting..." : "Extract Selected Pages"}
                        </MagneticButton>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2">
                        {isLoading ? (
                            <div className="h-full flex items-center justify-center text-slate-400">
                                Generating thumbnails...
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-10">
                                {pages.map((page) => (
                                    <div
                                        key={page.id}
                                        onClick={() => togglePageSelection(page.id)}
                                        className={cn(
                                            "relative aspect-[3/4] rounded-xl border-2 cursor-pointer transition-all duration-200 group overflow-hidden",
                                            page.selected
                                                ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(56,189,248,0.3)] scale-[1.02]"
                                                : "border-slate-800 bg-slate-900/50 hover:border-slate-600 hover:bg-slate-800"
                                        )}
                                    >
                                        {/* Selection Indicator */}
                                        <div className={cn(
                                            "absolute top-3 right-3 z-10 w-6 h-6 rounded-full flex items-center justify-center transition-all",
                                            page.selected
                                                ? "bg-primary text-black shadow-lg scale-100"
                                                : "bg-slate-800 border border-slate-600 group-hover:border-primary/50 text-transparent scale-90"
                                        )}>
                                            <Check className="w-4 h-4" />
                                        </div>

                                        {/* Thumbnail Image */}
                                        <div className="absolute inset-0 p-3 flex items-center justify-center">
                                            {page.thumbnail ? (
                                                <img
                                                    src={page.thumbnail}
                                                    alt={`Page ${page.displayNumber}`}
                                                    className="w-full h-full object-contain shadow-sm"
                                                />
                                            ) : (
                                                <FileText className="w-12 h-12 text-slate-700" />
                                            )}
                                        </div>

                                        {/* Page Number Badge */}
                                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md bg-slate-950/80 backdrop-blur-sm text-xs font-medium text-slate-300 border border-slate-800">
                                            Page {page.displayNumber}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </ToolLayout>
    );
}
