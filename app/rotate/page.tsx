"use client";

import React, { useState, useEffect, useRef } from "react";
import { ToolLayout } from "@/components/layout/tool-layout";
import { FileUpload } from "@/components/ui/file-upload";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { usePDF } from "@/hooks/use-pdf";
import { RotateCw, Loader2, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export default function RotatePage() {
    const [file, setFile] = useState<File | null>(null);
    const [pages, setPages] = useState<{ index: number; image: string; rotation: number }[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { rotatePDF, isProcessing } = usePDF();

    const handleFilesSelected = (files: File[]) => {
        if (files.length > 0) {
            setFile(files[0]);
            generateThumbnails(files[0]);
        }
    };

    const generateThumbnails = async (file: File) => {
        setIsLoading(true);
        setPages([]);

        try {
            // Dynamically import pdfjs-dist to avoid SSR issues
            const pdfjsLib = await import("pdfjs-dist");

            // Set worker source
            pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

            const buffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument(buffer).promise;
            const numPages = pdf.numPages;
            const newPages = [];

            for (let i = 1; i <= numPages; i++) {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 0.5 }); // Thumbnail scale
                const canvas = document.createElement("canvas");
                const context = canvas.getContext("2d");
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                if (context) {
                    await page.render({ canvasContext: context, viewport } as any).promise;
                    newPages.push({
                        index: i,
                        image: canvas.toDataURL(),
                        rotation: 0,
                    });
                }
            }
            setPages(newPages);
        } catch (err) {
            console.error("Error generating thumbnails:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const rotatePage = (index: number, direction: "left" | "right") => {
        setPages((prev) =>
            prev.map((p) => {
                if (p.index === index) {
                    const newRotation = direction === "right" ? p.rotation + 90 : p.rotation - 90;
                    return { ...p, rotation: newRotation };
                }
                return p;
            })
        );
    };

    const rotateAll = (direction: "left" | "right") => {
        setPages((prev) =>
            prev.map((p) => ({
                ...p,
                rotation: direction === "right" ? p.rotation + 90 : p.rotation - 90,
            }))
        );
    };

    const handleSave = async () => {
        if (!file) return;
        await rotatePDF(file, 90);
    };

    return (
        <ToolLayout
            title="Rotate PDF"
            description="Rotate individual pages or the entire document."
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
                            <div className="flex gap-2">
                                <button
                                    onClick={() => rotateAll("left")}
                                    className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 transition-colors flex items-center gap-2 text-sm"
                                >
                                    <RotateCcw className="w-4 h-4" /> Rotate All Left
                                </button>
                                <button
                                    onClick={() => rotateAll("right")}
                                    className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 transition-colors flex items-center gap-2 text-sm"
                                >
                                    <RotateCw className="w-4 h-4" /> Rotate All Right
                                </button>
                            </div>
                        </div>

                        <MagneticButton
                            onClick={handleSave}
                            disabled={isProcessing}
                            className="w-auto"
                        >
                            {isProcessing ? "Saving..." : "Save PDF"}
                        </MagneticButton>
                    </div>

                    {isLoading ? (
                        <div className="flex-1 flex items-center justify-center text-slate-400">
                            <Loader2 className="w-8 h-8 animate-spin mr-2" />
                            Generating previews...
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 overflow-y-auto pr-2 max-h-[600px]">
                            {pages.map((page) => (
                                <div key={page.index} className="flex flex-col items-center gap-3 group">
                                    <div className="relative">
                                        <div
                                            className="relative rounded-lg overflow-hidden shadow-lg transition-transform duration-300 bg-white"
                                            style={{ transform: `rotate(${page.rotation}deg)` }}
                                        >
                                            <img src={page.image} alt={`Page ${page.index}`} className="max-w-full h-auto" />
                                        </div>

                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-lg">
                                            <button
                                                onClick={() => rotatePage(page.index, "left")}
                                                className="p-2 bg-slate-900/80 rounded-full text-white hover:bg-slate-900 mr-2"
                                            >
                                                <RotateCcw className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => rotatePage(page.index, "right")}
                                                className="p-2 bg-slate-900/80 rounded-full text-white hover:bg-slate-900"
                                            >
                                                <RotateCw className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <span className="text-xs text-slate-500">Page {page.index}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </ToolLayout>
    );
}
