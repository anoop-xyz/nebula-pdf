"use client";

import React, { useState } from "react";
import { ToolLayout } from "@/components/layout/tool-layout";
import { FileUpload } from "@/components/ui/file-upload";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { usePDF } from "@/hooks/use-pdf";
import { Reorder, useDragControls } from "framer-motion";
import { GripVertical, X, FileText } from "lucide-react";

export default function MergePage() {
    const [files, setFiles] = useState<File[]>([]);
    const { mergePDFs, isProcessing, progress } = usePDF();

    const handleFilesSelected = (newFiles: File[]) => {
        setFiles((prev) => [...prev, ...newFiles]);
    };

    const removeFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleMerge = async () => {
        if (files.length === 0) return;
        await mergePDFs(files);
    };

    return (
        <ToolLayout
            title="Merge PDF"
            description="Drag and drop PDFs to rearrange them, then merge into a single file."
            isLoading={isProcessing}
            progress={progress}
        >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                {/* Left Column: Upload & List */}
                <div className="space-y-6">
                    <FileUpload onFilesSelected={handleFilesSelected} />

                    {files.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="text-sm font-medium text-slate-400">
                                Files ({files.length})
                            </h3>
                            <Reorder.Group axis="y" values={files} onReorder={setFiles} className="space-y-2">
                                {files.map((file, index) => (
                                    <Reorder.Item
                                        key={`${file.name}-${index}`} // Using index in key for duplicate names, though not ideal for reorder
                                        value={file}
                                        className="bg-slate-800 rounded-lg p-3 flex items-center gap-3 cursor-grab active:cursor-grabbing border border-slate-700"
                                    >
                                        <GripVertical className="w-5 h-5 text-slate-500" />
                                        <FileText className="w-5 h-5 text-primary" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-200 truncate">
                                                {file.name}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {(file.size / 1024 / 1024).toFixed(2)} MB
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => removeFile(index)}
                                            className="p-1 hover:bg-slate-700 rounded-md transition-colors"
                                        >
                                            <X className="w-4 h-4 text-slate-400" />
                                        </button>
                                    </Reorder.Item>
                                ))}
                            </Reorder.Group>
                        </div>
                    )}
                </div>

                {/* Right Column: Actions & Preview (Placeholder) */}
                <div className="flex flex-col items-center justify-center border-l border-slate-800 pl-8 min-h-[300px]">
                    <div className="text-center space-y-6">
                        <div className="w-32 h-40 bg-slate-800 rounded-lg border-2 border-dashed border-slate-700 flex items-center justify-center mx-auto">
                            <FileText className="w-12 h-12 text-slate-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-slate-200">
                                Ready to Merge?
                            </h3>
                            <p className="text-slate-400 text-sm mt-1">
                                {files.length} files selected
                            </p>
                        </div>

                        <MagneticButton
                            onClick={handleMerge}
                            disabled={files.length < 2 || isProcessing}
                            className="w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isProcessing ? "Merging..." : "Merge PDFs"}
                        </MagneticButton>
                    </div>
                </div>
            </div>
        </ToolLayout>
    );
}
