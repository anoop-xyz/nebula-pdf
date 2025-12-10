"use client";

import React, { useState, useRef, useEffect } from "react";
import { ToolLayout } from "@/components/layout/tool-layout";
import { FileUpload } from "@/components/ui/file-upload";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { usePDF } from "@/hooks/use-pdf";
import { SignaturePad, SignaturePadRef } from "@/components/ui/signature-pad";
import { Pen, Upload, X, ChevronLeft, ChevronRight, Save, Trash2 } from "lucide-react";
import { motion, useDragControls } from "framer-motion";
import { cn } from "@/lib/utils";

export default function SignPage() {
    const [file, setFile] = useState<File | null>(null);
    const [pageNum, setPageNum] = useState(1);
    const [numPages, setNumPages] = useState(0);
    const [pdfDimensions, setPdfDimensions] = useState<{ width: number; height: number } | null>(null);

    // Signature State
    const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<"draw" | "upload">("draw");
    const [signatureImage, setSignatureImage] = useState<string | null>(null);
    const [signaturePosition, setSignaturePosition] = useState({ x: 0, y: 0 });

    // Canvas Ref for PDF Page
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const signaturePadRef = useRef<SignaturePadRef>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const { signPDF, isProcessing } = usePDF();

    // Render PDF Page
    useEffect(() => {
        if (!file || !canvasRef.current) return;

        const renderPage = async () => {
            const pdfjsLib = await import("pdfjs-dist");
            pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

            const buffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument(buffer).promise;
            setNumPages(pdf.numPages);

            const page = await pdf.getPage(pageNum);

            // Calculate scale to fit container width (max 800px)
            const containerWidth = containerRef.current?.clientWidth || 800;
            const unscaledViewport = page.getViewport({ scale: 1 });
            const scale = Math.min(containerWidth / unscaledViewport.width, 1.5); // Cap scale

            const viewport = page.getViewport({ scale });

            const canvas = canvasRef.current;
            if (canvas) {
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                setPdfDimensions({ width: viewport.width, height: viewport.height });

                const context = canvas.getContext("2d");
                if (context) {
                    await page.render({ canvasContext: context, viewport } as any).promise;
                }
            }
        };

        renderPage();
    }, [file, pageNum]);

    const handleFilesSelected = (files: File[]) => {
        if (files.length > 0) {
            setFile(files[0]);
            setPageNum(1);
            setSignatureImage(null);
        }
    };

    const handleUseSignature = () => {
        if (activeTab === "draw" && signaturePadRef.current) {
            const dataUrl = signaturePadRef.current.getDataUrl();
            if (dataUrl) {
                setSignatureImage(dataUrl);
                setIsSignatureModalOpen(false);
                // Center signature initially
                if (pdfDimensions) {
                    setSignaturePosition({
                        x: pdfDimensions.width / 2 - 100,
                        y: pdfDimensions.height / 2 - 50
                    });
                }
            }
        }
    };

    const handleUploadSignature = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                setSignatureImage(result);
                setIsSignatureModalOpen(false);
                if (pdfDimensions) {
                    setSignaturePosition({
                        x: pdfDimensions.width / 2 - 100,
                        y: pdfDimensions.height / 2 - 50
                    });
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        if (!file || !signatureImage || !pdfDimensions) return;

        // Calculate actual PDF coordinates
        // PDF coords are bottom-left origin. Browser is top-left.
        // We need original page dimensions to calculate scale factor

        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
        const buffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(buffer).promise;
        const page = await pdf.getPage(pageNum);
        const originalViewport = page.getViewport({ scale: 1 });

        const scaleX = originalViewport.width / pdfDimensions.width;
        const scaleY = originalViewport.height / pdfDimensions.height;

        // Rendered Signature Dimensions (fixed at w-48 ~ 192px visually, but let's measure actual rendered size)
        // For simple MVP we assume a reasonable fixed ratio or allow resizing
        // Let's assume the signature is displayed at 200px width
        const displayedSignatureWidth = 200;
        const displayedSignatureHeight = 100; // Aspect ratio might vary, but fixing for calculation simplicity

        const pdfX = signaturePosition.x * scaleX;
        // Flip Y axis
        const pdfY = (pdfDimensions.height - signaturePosition.y - displayedSignatureHeight) * scaleY;

        const pdfWidth = displayedSignatureWidth * scaleX;
        const pdfHeight = displayedSignatureHeight * scaleY;

        await signPDF(
            file,
            signatureImage,
            pageNum - 1,
            pdfX,
            pdfY,
            pdfWidth,
            pdfHeight
        );
    };

    return (
        <ToolLayout
            title="Sign PDF"
            description="Draw your signature and place it on your document."
            isLoading={isProcessing}
        >
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
                <div className="flex flex-col items-center w-full max-w-5xl mx-auto space-y-6">
                    {/* Controls */}
                    <div className="w-full flex items-center justify-between bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setPageNum(p => Math.max(1, p - 1))}
                                disabled={pageNum <= 1}
                                className="p-2 hover:bg-slate-700 rounded-lg disabled:opacity-30"
                            >
                                <ChevronLeft className="w-5 h-5 text-slate-300" />
                            </button>
                            <span className="text-slate-200 font-medium">
                                Page {pageNum} of {numPages}
                            </span>
                            <button
                                onClick={() => setPageNum(p => Math.min(numPages, p + 1))}
                                disabled={pageNum >= numPages}
                                className="p-2 hover:bg-slate-700 rounded-lg disabled:opacity-30"
                            >
                                <ChevronRight className="w-5 h-5 text-slate-300" />
                            </button>
                        </div>

                        <div className="flex items-center gap-3">
                            {!signatureImage ? (
                                <MagneticButton
                                    onClick={() => setIsSignatureModalOpen(true)}
                                    className="px-4 py-2 bg-primary text-slate-900 font-semibold"
                                >
                                    <Pen className="w-4 h-4 mr-2" />
                                    Create Signature
                                </MagneticButton>
                            ) : (
                                <MagneticButton
                                    onClick={handleSave}
                                    disabled={isProcessing}
                                    className="px-4 py-2"
                                >

                                    {isProcessing ? "Signing..." : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            Save Signed PDF
                                        </>
                                    )}
                                </MagneticButton>
                            )}

                            {signatureImage && (
                                <button
                                    onClick={() => setSignatureImage(null)}
                                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                    title="Remove Signature"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* PDF Container */}
                    <div
                        ref={containerRef}
                        className="relative w-full overflow-hidden bg-slate-900 border border-slate-800 rounded-lg shadow-2xl"
                        style={{ maxWidth: '100%', aspectRatio: pdfDimensions ? `${pdfDimensions.width}/${pdfDimensions.height}` : 'auto' }}
                    >
                        <canvas ref={canvasRef} className="w-full h-auto block" />

                        {signatureImage && (
                            <motion.div
                                drag
                                dragMomentum={false}
                                dragConstraints={containerRef}
                                onDragEnd={(_, info) => {
                                    setSignaturePosition(prev => ({
                                        x: prev.x + info.offset.x,
                                        y: prev.y + info.offset.y
                                    }));
                                }}
                                // Initial position is handled by state logic relative to container, 
                                // but for Framer Motion 'drag', it tracks delta. 
                                // To keep it simple, we'll just position absolute and rely on visual placement.
                                style={{
                                    position: 'absolute',
                                    left: signaturePosition.x,
                                    top: signaturePosition.y,
                                    width: 200,
                                    height: 100
                                }}
                                className="z-10 cursor-move group border-2 border-transparent hover:border-primary/50 rounded-lg"
                            >
                                <img
                                    src={signatureImage}
                                    alt="Signature"
                                    className="w-full h-full object-contain pointer-events-none"
                                />
                            </motion.div>
                        )}
                    </div>
                </div>
            )}

            {/* Signature Modal */}
            {isSignatureModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                            <h3 className="font-semibold text-slate-200">Add Signature</h3>
                            <button onClick={() => setIsSignatureModalOpen(false)} className="text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex border-b border-slate-800">
                            <button
                                onClick={() => setActiveTab("draw")}
                                className={cn(
                                    "flex-1 py-3 text-sm font-medium transition-colors",
                                    activeTab === "draw" ? "bg-slate-800 text-primary border-b-2 border-primary" : "text-slate-400 hover:bg-slate-800/50"
                                )}
                            >
                                Draw
                            </button>
                            <button
                                onClick={() => setActiveTab("upload")}
                                className={cn(
                                    "flex-1 py-3 text-sm font-medium transition-colors",
                                    activeTab === "upload" ? "bg-slate-800 text-primary border-b-2 border-primary" : "text-slate-400 hover:bg-slate-800/50"
                                )}
                            >
                                Upload Image
                            </button>
                        </div>

                        <div className="p-6 flex-1 bg-slate-950">
                            {activeTab === "draw" ? (
                                <div className="h-64 border border-slate-700 rounded-xl overflow-hidden bg-white">
                                    <SignaturePad ref={signaturePadRef} />
                                </div>
                            ) : (
                                <div className="h-64 border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center bg-slate-900 hover:bg-slate-800 transition-colors">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleUploadSignature}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                    <Upload className="w-8 h-8 text-slate-500 mb-2" />
                                    <p className="text-sm text-slate-400">Click to upload image</p>
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-slate-800 flex justify-end gap-3 bg-slate-900">
                            <button
                                onClick={() => setIsSignatureModalOpen(false)}
                                className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 text-sm font-medium"
                            >
                                Cancel
                            </button>
                            {activeTab === "draw" && (
                                <button
                                    onClick={() => {
                                        signaturePadRef.current?.clear();
                                    }}
                                    className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 text-sm font-medium mr-auto"
                                >
                                    Clear
                                </button>
                            )}
                            {activeTab === "draw" && (
                                <button
                                    onClick={handleUseSignature}
                                    className="px-4 py-2 rounded-lg bg-primary text-slate-900 hover:bg-primary/90 text-sm font-bold shadow-lg shadow-primary/20"
                                >
                                    Use Signature
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </ToolLayout>
    );
}
