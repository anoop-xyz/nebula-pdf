"use client";

import React, { useState } from "react";
import { ToolLayout } from "@/components/layout/tool-layout";
import { FileUpload } from "@/components/ui/file-upload";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { usePDF } from "@/hooks/use-pdf";
import { Stamp, Palette, Type, Droplets } from "lucide-react";

export default function WatermarkPage() {
    const [file, setFile] = useState<File | null>(null);
    const [text, setText] = useState("CONFIDENTIAL");
    const [color, setColor] = useState("#FF0000");
    const [opacity, setOpacity] = useState(0.5);

    const { watermarkPDF, isProcessing } = usePDF();

    const handleFilesSelected = (files: File[]) => {
        if (files.length > 0) {
            setFile(files[0]);
        }
    };

    const handleWatermark = async () => {
        if (!file) return;
        await watermarkPDF(file, text, color, opacity);
    };

    return (
        <ToolLayout
            title="Watermark PDF"
            description="Add text watermarks to your PDF documents."
            isLoading={isProcessing}
        >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                <div className="space-y-6">
                    <FileUpload
                        onFilesSelected={handleFilesSelected}
                        multiple={false}
                        accept={{ "application/pdf": [".pdf"] }}
                    />

                    {file && (
                        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 space-y-6">
                            <div className="flex items-center gap-3 pb-4 border-b border-slate-700">
                                <div className="p-2 bg-slate-700 rounded-lg">
                                    <Stamp className="w-5 h-5 text-primary" />
                                </div>
                                <span className="font-medium text-slate-200">{file.name}</span>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm text-slate-400 flex items-center gap-2">
                                        <Type className="w-4 h-4" /> Watermark Text
                                    </label>
                                    <input
                                        type="text"
                                        value={text}
                                        onChange={(e) => setText(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-primary transition-colors"
                                        placeholder="e.g. DRAFT"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm text-slate-400 flex items-center gap-2">
                                            <Palette className="w-4 h-4" /> Color
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="color"
                                                value={color}
                                                onChange={(e) => setColor(e.target.value)}
                                                className="h-10 w-full bg-transparent cursor-pointer rounded-lg border border-slate-700"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm text-slate-400 flex items-center gap-2">
                                            <Droplets className="w-4 h-4" /> Opacity: {Math.round(opacity * 100)}%
                                        </label>
                                        <input
                                            type="range"
                                            min="0.1"
                                            max="1"
                                            step="0.1"
                                            value={opacity}
                                            onChange={(e) => setOpacity(parseFloat(e.target.value))}
                                            className="w-full accent-primary"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex flex-col items-center justify-center border-l border-slate-800 pl-8 min-h-[300px]">
                    <div className="text-center space-y-6">
                        <div className="w-40 h-56 bg-white rounded-lg border-2 border-dashed border-slate-700 flex items-center justify-center mx-auto relative overflow-hidden shadow-xl">
                            {/* Preview */}
                            <div
                                className="absolute inset-0 flex items-center justify-center pointer-events-none transform -rotate-45"
                                style={{
                                    opacity: opacity,
                                    color: color,
                                    fontSize: '24px',
                                    fontWeight: 'bold'
                                }}
                            >
                                {text || "TEXT"}
                            </div>
                            <div className="absolute inset-0 bg-slate-900/10 pointer-events-none" />
                        </div>

                        <div>
                            <h3 className="text-xl font-semibold text-slate-200">
                                Apply Watermark
                            </h3>
                            <p className="text-slate-400 text-sm mt-1">
                                The text will be stamped on every page.
                            </p>
                        </div>

                        <MagneticButton
                            onClick={handleWatermark}
                            disabled={!file || isProcessing || !text}
                            className="w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isProcessing ? "Applying..." : "Download PDF"}
                        </MagneticButton>
                    </div>
                </div>
            </div>
        </ToolLayout>
    );
}
