"use client";

import React, { useState } from "react";
import { ToolLayout } from "@/components/layout/tool-layout";
import { FileUpload } from "@/components/ui/file-upload";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { usePDF } from "@/hooks/use-pdf";
import { FileText, Copy, Download, Check } from "lucide-react";
import { downloadBlob } from "@/lib/pdf-utils";

export default function PdfToTextPage() {
    const [file, setFile] = useState<File | null>(null);
    const [text, setText] = useState<string>("");
    const [copied, setCopied] = useState(false);
    const { pdfToText, isProcessing, progress } = usePDF();

    const handleFilesSelected = async (files: File[]) => {
        if (files.length > 0) {
            setFile(files[0]);
            setText("");
            const extracted = await pdfToText(files[0]);
            setText(extracted);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const blob = new Blob([text], { type: "text/plain" });
        downloadBlob(blob, `${file?.name.replace(".pdf", "")}.txt`);
    };

    return (
        <ToolLayout
            title="PDF to Text"
            description="Extract all text content from your PDF document."
            isLoading={isProcessing}
            progress={progress}
        >
            <div className="max-w-4xl mx-auto h-full flex flex-col gap-6">
                {!file ? (
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <FileUpload
                            onFilesSelected={handleFilesSelected}
                            multiple={false}
                            accept={{ "application/pdf": [".pdf"] }}
                            className="w-full max-w-xl"
                        />
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col h-full overflow-hidden">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => {
                                        setFile(null);
                                        setText("");
                                    }}
                                    className="text-slate-400 hover:text-slate-200 text-sm"
                                >
                                    Change File
                                </button>
                                <span className="text-slate-500 text-sm truncate max-w-[200px]">
                                    {file.name}
                                </span>
                            </div>

                            <div className="flex gap-2">
                                <MagneticButton
                                    onClick={handleCopy}
                                    className="w-auto px-4 py-2 bg-slate-800 text-slate-200 hover:bg-slate-700"
                                >
                                    {copied ? (
                                        <Check className="w-4 h-4 mr-2" />
                                    ) : (
                                        <Copy className="w-4 h-4 mr-2" />
                                    )}
                                    {copied ? "Copied" : "Copy Text"}
                                </MagneticButton>
                                <MagneticButton
                                    onClick={handleDownload}
                                    className="w-auto px-4 py-2"
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Download .txt
                                </MagneticButton>
                            </div>
                        </div>

                        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-4 overflow-auto font-mono text-sm text-slate-300 whitespace-pre-wrap">
                            {isProcessing ? (
                                <div className="h-full flex items-center justify-center gap-2 text-slate-400">
                                    <FileText className="w-5 h-5 animate-pulse" />
                                    <span>Extracting text...</span>
                                </div>
                            ) : (
                                text || "No text found in this PDF."
                            )}
                        </div>
                    </div>
                )}
            </div>
        </ToolLayout>
    );
}
