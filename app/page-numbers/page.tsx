"use client";

import React, { useState } from "react";
import { ToolLayout } from "@/components/layout/tool-layout";
import { FileUpload } from "@/components/ui/file-upload";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { usePDF } from "@/hooks/use-pdf";
import { Hash, AlignJustify, AlignLeft, AlignRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Position = 'bottom-left' | 'bottom-center' | 'bottom-right';

export default function PageNumbersPage() {
    const [file, setFile] = useState<File | null>(null);
    const [position, setPosition] = useState<Position>('bottom-center');
    const { addPageNumbers, isProcessing } = usePDF();

    const handleFilesSelected = (files: File[]) => {
        if (files.length > 0) {
            setFile(files[0]);
        }
    };

    const handleAddNumbers = async () => {
        if (!file) return;
        await addPageNumbers(file, position);
    };

    return (
        <ToolLayout
            title="Page Numbers"
            description="Add sequential page numbers to your document footer."
            isLoading={isProcessing}
        >
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-start h-full">
                <div className="h-full flex flex-col justify-center">
                    <FileUpload
                        onFilesSelected={handleFilesSelected}
                        multiple={false}
                        accept={{ "application/pdf": [".pdf"] }}
                        className="w-full"
                    />
                </div>

                {file ? (
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 space-y-8 animate-in fade-in slide-in-from-right-4">
                        <div className="text-center md:text-left">
                            <h3 className="text-xl font-medium text-slate-200">{file.name}</h3>
                            <p className="text-slate-400 text-sm mt-1">Select page number position</p>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <button
                                onClick={() => setPosition('bottom-left')}
                                className={cn(
                                    "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all",
                                    position === 'bottom-left'
                                        ? "bg-primary/10 border-primary text-primary"
                                        : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500"
                                )}
                            >
                                <AlignLeft className="w-6 h-6" />
                                <span className="text-xs font-medium">Left</span>
                            </button>
                            <button
                                onClick={() => setPosition('bottom-center')}
                                className={cn(
                                    "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all",
                                    position === 'bottom-center'
                                        ? "bg-primary/10 border-primary text-primary"
                                        : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500"
                                )}
                            >
                                <AlignJustify className="w-6 h-6" />
                                <span className="text-xs font-medium">Center</span>
                            </button>
                            <button
                                onClick={() => setPosition('bottom-right')}
                                className={cn(
                                    "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all",
                                    position === 'bottom-right'
                                        ? "bg-primary/10 border-primary text-primary"
                                        : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500"
                                )}
                            >
                                <AlignRight className="w-6 h-6" />
                                <span className="text-xs font-medium">Right</span>
                            </button>
                        </div>

                        {/* Preview */}
                        <div className="relative aspect-[3/4] bg-white rounded-lg shadow-sm overflow-hidden flex flex-col pointer-events-none opacity-90">
                            <div className="flex-1 p-8">
                                <div className="space-y-4">
                                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                                    <div className="h-4 bg-slate-200 rounded w-full" />
                                    <div className="h-4 bg-slate-200 rounded w-full" />
                                    <div className="h-4 bg-slate-200 rounded w-5/6" />
                                </div>
                            </div>
                            <div className="h-12 border-t border-slate-100 flex items-center px-8 text-xs text-slate-500 font-mono">
                                <div className={cn(
                                    "w-full flex",
                                    position === 'bottom-left' && "justify-start",
                                    position === 'bottom-center' && "justify-center",
                                    position === 'bottom-right' && "justify-end",
                                )}>
                                    1 / 10
                                </div>
                            </div>
                        </div>

                        <MagneticButton
                            onClick={handleAddNumbers}
                            disabled={isProcessing}
                            className="w-full"
                        >
                            {isProcessing ? "Adding Numbers..." : "Add Page Numbers"}
                        </MagneticButton>
                    </div>
                ) : (
                    <div className="hidden md:flex flex-col items-center justify-center text-slate-500 h-full border-l border-slate-800 p-8 space-y-4">
                        <Hash className="w-16 h-16 opacity-20" />
                        <p>Upload a file to customize options</p>
                    </div>
                )}
            </div>
        </ToolLayout>
    );
}
