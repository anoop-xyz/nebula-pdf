"use client";

import React, { useState } from "react";
import { ToolLayout } from "@/components/layout/tool-layout";
import { FileUpload } from "@/components/ui/file-upload";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { usePDF } from "@/hooks/use-pdf";
import { Image as ImageIcon, FileArchive } from "lucide-react";

export default function PdfToImagePage() {
    const [file, setFile] = useState<File | null>(null);
    const { pdfToImages, isProcessing, progress } = usePDF();

    const handleFilesSelected = (files: File[]) => {
        if (files.length > 0) {
            setFile(files[0]);
        }
    };

    const handleConvert = async () => {
        if (!file) return;
        await pdfToImages(file);
    };

    return (
        <ToolLayout
            title="PDF to Image"
            description="Convert each page of your PDF into high-quality images."
            isLoading={isProcessing}
            progress={progress}
        >
            <div className="max-w-xl mx-auto space-y-8">
                <FileUpload
                    onFilesSelected={handleFilesSelected}
                    multiple={false}
                    accept={{ "application/pdf": [".pdf"] }}
                />

                {file && (
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 flex flex-col items-center text-center space-y-4 animate-in fade-in slide-in-from-bottom-4">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                            <FileArchive className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-lg font-medium text-slate-200">{file.name}</h3>
                            <p className="text-sm text-slate-400">
                                Ready to convert. Result will be downloaded as a ZIP file.
                            </p>
                        </div>

                        <MagneticButton
                            onClick={handleConvert}
                            disabled={isProcessing}
                            className="w-full sm:w-auto"
                        >
                            {isProcessing ? (
                                <span className="flex items-center gap-2">
                                    <ImageIcon className="w-4 h-4 animate-pulse" />
                                    Converting...
                                </span>
                            ) : (
                                "Convert to Images"
                            )}
                        </MagneticButton>
                    </div>
                )}
            </div>
        </ToolLayout>
    );
}
