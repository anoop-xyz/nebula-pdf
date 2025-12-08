"use client";

import React, { useState, useEffect } from "react";
import { ToolLayout } from "@/components/layout/tool-layout";
import { FileUpload } from "@/components/ui/file-upload";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { usePDF } from "@/hooks/use-pdf";
import { RotateCw, GripVertical, X, Trash2 } from "lucide-react";
import { Reorder, AnimatePresence } from "framer-motion";
import { PDFDocument } from "pdf-lib";
import { cn } from "@/lib/utils";

interface PageTile {
    id: string;
    originalIndex: number; // 0-based index from original PDF
    displayNumber: number; // 1-based page number
    rotation: number;
    thumbnail?: string;
}

export default function OrganizePage() {
    const [file, setFile] = useState<File | null>(null);
    const [pages, setPages] = useState<PageTile[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Delete Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [pageToDelete, setPageToDelete] = useState<string | null>(null);
    const [dontAskAgain, setDontAskAgain] = useState(false);

    const { reorderPDF, isProcessing } = usePDF();

    const handleFilesSelected = async (files: File[]) => {
        if (files.length > 0) {
            const selectedFile = files[0];
            setFile(selectedFile);
            setIsLoading(true);

            try {
                // Dynamically import pdfjs-dist
                const pdfjsLib = await import("pdfjs-dist");
                pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

                const buffer = await selectedFile.arrayBuffer();
                const pdf = await pdfjsLib.getDocument(buffer).promise;
                const numPages = pdf.numPages;

                const newPages: PageTile[] = [];

                for (let i = 1; i <= numPages; i++) {
                    const page = await pdf.getPage(i);
                    const viewport = page.getViewport({ scale: 0.3 }); // Thumbnail scale
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
                            rotation: 0,
                            thumbnail: canvas.toDataURL(),
                        });
                    }
                }
                setPages(newPages);
            } catch (err) {
                console.error("Error generating thumbnails:", err);
                // Fallback if thumbnail generation fails
                if (pages.length === 0) {
                    const buffer = await selectedFile.arrayBuffer();
                    const pdfDoc = await PDFDocument.load(buffer);
                    const pageCount = pdfDoc.getPageCount();
                    const fallbackPages = Array.from({ length: pageCount }, (_, i) => ({
                        id: `page-${i}`,
                        originalIndex: i,
                        displayNumber: i + 1,
                        rotation: 0,
                    }));
                    setPages(fallbackPages);
                }
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleDeleteClick = (id: string) => {
        if (dontAskAgain) {
            setPages(prev => prev.filter(p => p.id !== id));
        } else {
            setPageToDelete(id);
            setShowDeleteModal(true);
        }
    };

    const confirmDelete = (shouldDontAskAgain: boolean) => {
        if (pageToDelete) {
            setPages(prev => prev.filter(p => p.id !== pageToDelete));
            setPageToDelete(null);
        }
        if (shouldDontAskAgain) {
            setDontAskAgain(true);
        }
        setShowDeleteModal(false);
    };

    const handleRotate = (id: string) => {
        setPages(pages.map(page => {
            if (page.id === id) {
                return { ...page, rotation: (page.rotation + 90) % 360 };
            }
            return page;
        }));
    };

    const handleSave = async () => {
        if (!file) return;

        // Only include pages that are currently in the 'pages' state
        const pageOrder = pages.map(p => p.originalIndex);
        const rotationMap: Record<number, number> = {};

        pages.forEach(p => {
            if (p.rotation !== 0) {
                rotationMap[p.originalIndex] = p.rotation;
            }
        });

        await reorderPDF(file, pageOrder, rotationMap);
    };

    return (
        <ToolLayout
            title="Organize PDF"
            description="Drag and drop to reorder pages, or rotate them individually."
            isLoading={isProcessing || isLoading}
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
                            <span className="text-slate-400 text-sm">{pages.length} Pages</span>
                        </div>

                        <MagneticButton
                            onClick={handleSave}
                            disabled={isProcessing}
                            className="w-auto"
                        >
                            {isProcessing ? "Saving..." : "Save Organized PDF"}
                        </MagneticButton>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2">
                        {isLoading ? (
                            <div className="h-full flex items-center justify-center text-slate-400">
                                Generating thumbnails...
                            </div>
                        ) : (
                            <Reorder.Group
                                axis="y"
                                values={pages}
                                onReorder={setPages}
                                className="flex flex-col gap-4 max-w-3xl mx-auto pb-10"
                                as="div"
                            >
                                {pages.map((page, index) => (
                                    <Reorder.Item
                                        key={page.id}
                                        value={page}
                                        className="relative group cursor-grab active:cursor-grabbing"
                                        as="div"
                                    >
                                        <div className={cn(
                                            "w-full h-32 rounded-xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm",
                                            "flex items-center gap-6 p-4 relative overflow-hidden transition-all duration-300",
                                            "group-hover:border-primary/50 group-hover:shadow-[0_0_20px_rgba(56,189,248,0.1)]"
                                        )}>
                                            {/* Drag Handle */}
                                            <div className="text-slate-600 group-hover:text-slate-400 transition-colors">
                                                <GripVertical className="w-6 h-6" />
                                            </div>

                                            {/* Thumbnail */}
                                            <div className="h-full aspect-[3/4] bg-slate-900/50 rounded-lg overflow-hidden border border-slate-700/30 flex items-center justify-center">
                                                {page.thumbnail ? (
                                                    <img
                                                        src={page.thumbnail}
                                                        alt={`Page ${page.displayNumber}`}
                                                        className="w-full h-full object-contain"
                                                        style={{ transform: `rotate(${page.rotation}deg)` }}
                                                    />
                                                ) : (
                                                    <div
                                                        className="text-2xl font-bold text-slate-700 select-none"
                                                        style={{ transform: `rotate(${page.rotation}deg)` }}
                                                    >
                                                        {page.displayNumber}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Details */}
                                            <div className="flex-1 flex flex-col justify-center">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <span className="text-slate-200 font-medium text-lg">
                                                        Page {index + 1}
                                                    </span>
                                                    <span className="text-slate-500 text-sm">
                                                        (Original: {page.displayNumber})
                                                    </span>
                                                </div>
                                                <div className="text-slate-500 text-xs">
                                                    Drag to reorder • Click rotate to adjust orientation
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRotate(page.id);
                                                    }}
                                                    className="p-3 bg-slate-800 rounded-full text-slate-400 hover:bg-primary hover:text-white transition-all hover:scale-110 active:scale-95 border border-slate-700 hover:border-primary"
                                                    title="Rotate 90°"
                                                >
                                                    <RotateCw className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteClick(page.id);
                                                    }}
                                                    className="p-3 bg-slate-800 rounded-full text-slate-400 hover:bg-red-500 hover:text-white transition-all hover:scale-110 active:scale-95 border border-slate-700 hover:border-red-500 group/delete"
                                                    title="Delete Page"
                                                >
                                                    <X className="w-5 h-5 group-hover/delete:rotate-90 transition-transform" />
                                                </button>
                                            </div>
                                        </div>
                                    </Reorder.Item>
                                ))}
                            </Reorder.Group>
                        )}
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {showDeleteModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
                        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 w-full max-w-sm shadow-2xl scale-100 opacity-100 animate-in fade-in zoom-in duration-200">
                            <div className="flex flex-col items-center text-center gap-4">
                                <div className="p-3 bg-red-500/10 text-red-500 rounded-full">
                                    <Trash2 className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-200">Delete this page?</h3>
                                    <p className="text-sm text-slate-400 mt-1">
                                        This action cannot be undone for this session.
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 mt-2">
                                    <input
                                        type="checkbox"
                                        id="dontAsk"
                                        className="rounded border-slate-600 bg-slate-700 text-primary focus:ring-primary/50"
                                        onChange={(e) => {
                                            // Handled in confirmDelete
                                        }}
                                    />
                                    <label htmlFor="dontAsk" className="text-sm text-slate-400 cursor-pointer select-none">
                                        Don't ask me again
                                    </label>
                                </div>

                                <div className="flex gap-3 w-full mt-2">
                                    <button
                                        onClick={() => setShowDeleteModal(false)}
                                        className="flex-1 px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-colors text-sm font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => {
                                            const checkbox = document.getElementById('dontAsk') as HTMLInputElement;
                                            confirmDelete(checkbox?.checked || false);
                                        }}
                                        className="flex-1 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors text-sm font-medium"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </ToolLayout>
    );
}
