"use client";

import { useState, useRef, useEffect } from "react";
import { ToolLayout } from "@/components/layout/tool-layout";
import { FileUpload } from "@/components/ui/file-upload";
import { usePDF } from "@/hooks/use-pdf";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Save, Pen, Trash2, X, Upload } from "lucide-react";
import { motion } from "framer-motion";
import { SignaturePad, SignaturePadRef } from "@/components/ui/signature-pad";
import { cn } from "@/lib/utils";
import { MagneticButton } from "@/components/ui/magnetic-button";

export default function SignPage() {
    const [file, setFile] = useState<File | null>(null);
    const [pageNum, setPageNum] = useState(1);
    const [numPages, setNumPages] = useState(0);
    const [pdfDimensions, setPdfDimensions] = useState<{ width: number; height: number } | null>(null);

    // Signature State
    const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<"draw" | "upload">("draw");
    const [signatureImage, setSignatureImage] = useState<string | null>(null);
    const [signatureColor, setSignatureColor] = useState("#000000"); // Black default

    // Per-Page Signature State: Map pageNum -> Position & Size
    type SignatureState = { x: number; y: number; width: number; height: number };
    const [signatures, setSignatures] = useState<Record<number, SignatureState>>({});

    // Current page signature
    const currentSignature = signatures[pageNum];

    // Canvas Ref for PDF Page
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const signaturePadRef = useRef<SignaturePadRef>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Render Task Ref to handle cancellation
    const renderTaskRef = useRef<any>(null);

    const { signPDF, isProcessing } = usePDF();

    // Render PDF Page - Robust Implementation
    useEffect(() => {
        if (!file || !canvasRef.current) return;

        const renderPage = async () => {
            // Cancel previous task if valid
            if (renderTaskRef.current) {
                try {
                    await renderTaskRef.current.cancel();
                } catch (e) {
                    // Start new task even if cancel fails/throws
                }
            }

            const pdfjsLib = await import("pdfjs-dist");
            pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

            try {
                const buffer = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument(buffer).promise;
                setNumPages(pdf.numPages);

                const page = await pdf.getPage(pageNum);

                // Calculate scale to fit container width (max 800px)
                const containerWidth = containerRef.current?.clientWidth || 800;

                // Get viewport at scale 1 to check dimensions/rotation first
                const unscaledViewport = page.getViewport({ scale: 1 });
                const scale = Math.min(containerWidth / unscaledViewport.width, 1.5);

                // Get final viewport with correct scale AND rotation
                const viewport = page.getViewport({ scale });

                const canvas = canvasRef.current;
                if (canvas) {
                    // Set canvas dimensions to match viewport (handles rotation automatically)
                    canvas.width = viewport.width;
                    canvas.height = viewport.height;
                    setPdfDimensions({ width: viewport.width, height: viewport.height });

                    const context = canvas.getContext("2d");
                    if (context) {
                        const renderContext = { canvasContext: context, viewport };
                        const renderTask = page.render(renderContext as any);

                        // Store reference
                        renderTaskRef.current = renderTask;

                        await renderTask.promise;
                    }
                }
            } catch (error: any) {
                if (error.name !== 'RenderingCancelledException') {
                    console.error("PDF Render Error:", error);
                }
            }
        };

        renderPage();

        return () => {
            if (renderTaskRef.current) {
                // Try to cancel on unmount
                try {
                    renderTaskRef.current.cancel();
                } catch (e) { }
            }
        };
    }, [file, pageNum]); // Removed containerWidth dependency to stabilize

    const handleFilesSelected = (files: File[]) => {
        if (files.length > 0) {
            setFile(files[0]);
            setPageNum(1);
            setSignatureImage(null);
            setSignatures({});
        }
    };

    const handleUseSignature = () => {
        if (activeTab === "draw" && signaturePadRef.current) {
            const dataUrl = signaturePadRef.current.getDataUrl();
            if (dataUrl) {
                setSignatureImage(dataUrl);
                setIsSignatureModalOpen(false);
                addSignatureToPage(pageNum);
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
                addSignatureToPage(pageNum);
            };
            reader.readAsDataURL(file);
        }
    };

    const addSignatureToPage = (page: number) => {
        if (pdfDimensions) {
            setSignatures(prev => ({
                ...prev,
                [page]: {
                    x: pdfDimensions.width / 2 - 100, // Center X
                    y: pdfDimensions.height / 2 - 50,  // Center Y
                    width: 200,
                    height: 100
                }
            }));
        }
    };

    const handleDragEnd = (_: any, info: any) => {
        const current = signatures[pageNum];
        if (!current) return;

        setSignatures(prev => ({
            ...prev,
            [pageNum]: {
                ...current,
                x: current.x + info.offset.x,
                y: current.y + info.offset.y
            }
        }));
    };

    const handleResizeStart = (e: React.PointerEvent) => {
        e.stopPropagation(); // Prevent drag of parent
        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = currentSignature!.width;
        const startHeight = currentSignature!.height;

        const onMove = (moveEvent: PointerEvent) => {
            const newWidth = Math.max(50, startWidth + (moveEvent.clientX - startX));
            const newHeight = Math.max(25, startHeight + (moveEvent.clientY - startY));

            setSignatures(prev => ({
                ...prev,
                [pageNum]: {
                    ...prev[pageNum],
                    width: newWidth,
                    height: newHeight
                }
            }));
        };

        const onUp = () => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
        };

        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
    };


    const handleSave = async () => {
        if (!file || !signatureImage || !pdfDimensions || !containerRef.current) return;

        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
        const buffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(buffer).promise;
        const page = await pdf.getPage(1);
        const originalViewport = page.getViewport({ scale: 1 });

        const scaleX = originalViewport.width / pdfDimensions.width;
        const scaleY = originalViewport.height / pdfDimensions.height;

        const signaturePayloads = [];

        for (const [pageIndexStr, sig] of Object.entries(signatures)) {
            const pageIndex = parseInt(pageIndexStr);

            // Calculate PDF Coords
            const pdfX = sig.x * scaleX;
            const pdfY = (pdfDimensions.height - sig.y - sig.height) * scaleY; // Flip Y (PDF Origin is Bottom-Left)
            const pdfW = sig.width * scaleX;
            const pdfH = sig.height * scaleY;

            signaturePayloads.push({
                pageIndex: pageIndex - 1, // 0-based index for backend
                x: pdfX,
                y: pdfY,
                width: pdfW,
                height: pdfH
            });
        }

        if (signaturePayloads.length === 0) return;

        await signPDF(file, signatureImage, signaturePayloads);
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
                            <MagneticButton
                                onClick={() => setIsSignatureModalOpen(true)}
                                className="px-4 py-2 bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700"
                            >
                                <Pen className="w-4 h-4 mr-2" />
                                {currentSignature ? "Replace Signature" : "Add Signature"}
                            </MagneticButton>

                            {Object.keys(signatures).length > 0 && (
                                <MagneticButton
                                    onClick={handleSave}
                                    disabled={isProcessing}
                                    className="px-4 py-2 bg-primary text-slate-900 font-bold"
                                >
                                    {isProcessing ? "Signing..." : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            Save Signed PDF
                                        </>
                                    )}
                                </MagneticButton>
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

                        {signatureImage && currentSignature && (
                            <motion.div
                                key={`${pageNum}-${currentSignature.x}-${currentSignature.y}-${currentSignature.width}-${currentSignature.height}`}
                                drag
                                dragMomentum={false}
                                dragConstraints={containerRef}
                                onDragEnd={handleDragEnd}
                                className="absolute z-10 cursor-move group border-2 border-transparent hover:border-primary/50 rounded-lg"
                                style={{
                                    width: currentSignature.width,
                                    height: currentSignature.height,
                                    left: currentSignature.x,
                                    top: currentSignature.y,
                                    position: 'absolute'
                                }}
                            >
                                <img
                                    src={signatureImage}
                                    alt="Signature"
                                    className="w-full h-full object-contain pointer-events-none"
                                />

                                {/* Resize Handle */}
                                <div
                                    onPointerDown={handleResizeStart}
                                    className="absolute -bottom-3 -right-3 w-6 h-6 bg-primary border-2 border-white cursor-se-resize rounded-full shadow-md flex items-center justify-center z-30 touch-none"
                                >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-slate-900">
                                        <polyline points="21 16 21 21 16 21" />
                                        <line x1="14" y1="10" x2="21" y2="21" />
                                    </svg>
                                </div>

                                {/* Cross to Remove */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSignatures(prev => {
                                            const next = { ...prev };
                                            delete next[pageNum];
                                            return next;
                                        });
                                    }}
                                    className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-20"
                                    title="Remove from this page"
                                >
                                    <X className="w-3 h-3" />
                                </button>
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

                        <div className="p-4 flex-1 overflow-y-auto">
                            <div className="flex gap-2 mb-4 p-1 bg-slate-800/50 rounded-lg">
                                <button
                                    onClick={() => setActiveTab("draw")}
                                    className={cn(
                                        "flex-1 py-1.5 text-sm font-medium rounded-md transition-all",
                                        activeTab === "draw" ? "bg-slate-700 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                                    )}
                                >
                                    Draw
                                </button>
                                <button
                                    onClick={() => setActiveTab("upload")}
                                    className={cn(
                                        "flex-1 py-1.5 text-sm font-medium rounded-md transition-all",
                                        activeTab === "upload" ? "bg-slate-700 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                                    )}
                                >
                                    Upload
                                </button>
                            </div>

                            {activeTab === "draw" ? (
                                <div className="space-y-4">
                                    <div className="flex justify-center gap-3">
                                        <button
                                            onClick={() => setSignatureColor("#000000")} // Black
                                            className={cn("w-6 h-6 rounded-full bg-black border-2", signatureColor === "#000000" ? "border-primary" : "border-transparent")}
                                        />
                                        <button
                                            onClick={() => setSignatureColor("#2563eb")} // Blue
                                            className={cn("w-6 h-6 rounded-full bg-blue-600 border-2", signatureColor === "#2563eb" ? "border-primary" : "border-transparent")}
                                        />
                                        <button
                                            onClick={() => setSignatureColor("#dc2626")} // Red
                                            className={cn("w-6 h-6 rounded-full bg-red-600 border-2", signatureColor === "#dc2626" ? "border-primary" : "border-transparent")}
                                        />
                                    </div>
                                    <div className="h-48 border border-slate-700 rounded-xl overflow-hidden bg-white">
                                        <SignaturePad ref={signaturePadRef} color={signatureColor} />
                                    </div>
                                </div>
                            ) : (
                                <div className="relative h-64 border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center bg-slate-900 hover:bg-slate-800 transition-colors">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleUploadSignature}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
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
