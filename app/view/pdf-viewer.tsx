"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
    Upload,
    ZoomIn,
    ZoomOut,
    RotateCw,
    Maximize,
    ChevronLeft,
    ChevronRight,
    Printer,
    Search,
    ArrowUp,
    Pen,
    Highlighter,
    Eraser,
    Undo,
    Redo,
    Palette,
    PanelLeft,
    X,
    MoreVertical,
    Settings,
    Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Initialize PDF.js worker
import * as pdfjsLib from "pdfjs-dist";
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

interface PDFMetaData {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string;
    creationDate?: string;
    producer?: string;
    pageCount: number;
}

// Annotation Types
type Tool = 'pen' | 'highlighter' | 'eraser' | null;
interface Point { x: number; y: number; }
interface Stroke {
    id: string;
    tool: 'pen' | 'highlighter';
    color: string;
    width: number;
    points: Point[];
}
type PageAnnotations = Record<number, Stroke[]>;

// Color Presets
const PEN_COLORS = ['#000000', '#EF4444', '#3B82F6', '#10B981', '#F59E0B'];
const HIGHLIGHTER_COLORS = ['#FEF08A', '#BFDBFE', '#BBF7D0', '#FBCFE8'];

export default function PdfViewer() {
    const [file, setFile] = useState<File | null>(null);
    const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [scale, setScale] = useState(1.0);
    const [rotation, setRotation] = useState(0);
    const [defaultAspectRatio, setDefaultAspectRatio] = useState<number>(0.77);
    const [isMobile, setIsMobile] = useState(false);

    // Annotation State
    const [tool, setTool] = useState<Tool>(null);
    const [penColor, setPenColor] = useState('#000000');
    const [penWidth, setPenWidth] = useState(2);
    const [highlighterColor, setHighlighterColor] = useState('#FEF08A');
    const [annotations, setAnnotations] = useState<PageAnnotations>({});

    // History
    const [history, setHistory] = useState<PageAnnotations[]>([]);
    const [historyStep, setHistoryStep] = useState(0);

    // Mobile Menu State
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const isScrollingRef = useRef(false);

    // Mobile Check
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const updateAnnotations = (newAnnotations: PageAnnotations) => {
        const newHistory = history.slice(0, historyStep + 1);
        newHistory.push(newAnnotations);
        setHistory(newHistory);
        setHistoryStep(newHistory.length - 1);
        setAnnotations(newAnnotations);
    };

    const handleUndo = () => {
        if (historyStep > 0) {
            setHistoryStep(prev => prev - 1);
            setAnnotations(history[historyStep - 1]);
        }
    };

    const handleRedo = () => {
        if (historyStep < history.length - 1) {
            setHistoryStep(prev => prev + 1);
            setAnnotations(history[historyStep + 1]);
        }
    };

    useEffect(() => { if (history.length === 0) setHistory([{}]); }, []);

    // UI state
    const [pageInput, setPageInput] = useState<string>("");
    const [zoomInput, setZoomInput] = useState<string>("");
    const [isEditingPage, setIsEditingPage] = useState(false);
    const [isEditingZoom, setIsEditingZoom] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [metadata, setMetadata] = useState<PDFMetaData | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const currentPageRef = useRef(currentPage);

    useEffect(() => { currentPageRef.current = currentPage; }, [currentPage]);

    // Force Sidebar closed on mobile init
    useEffect(() => { if (isMobile) setSidebarOpen(false); }, [isMobile]);

    // Dropzone
    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const selected = acceptedFiles[0];
        if (selected && selected.type === "application/pdf") {
            setFile(selected);
            loadPDF(selected);
        } else {
            toast.error("Please upload a valid PDF file.");
        }
    }, []);
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop, accept: { "application/pdf": [".pdf"] }, multiple: false
    });

    const loadPDF = async (file: File) => {
        setIsLoading(true);
        try {
            const buffer = await file.arrayBuffer();
            const doc = await pdfjsLib.getDocument(buffer).promise;
            setPdfDoc(doc);
            setMetadata({ pageCount: doc.numPages });

            // Get aspect ratio from first page to stabilize layout
            const page1 = await doc.getPage(1);
            const viewport = page1.getViewport({ scale: 1 });
            if (viewport.width && viewport.height) {
                setDefaultAspectRatio(viewport.width / viewport.height);
            }

            // Metadata
            doc.getMetadata().then((data: any) => {
                if (data?.info) {
                    setMetadata(prev => ({
                        ...prev!,
                        title: data.info.Title,
                        author: data.info.Author,
                        producer: data.info.Producer,
                        creationDate: data.info.CreationDate
                    }));
                }
            }).catch(e => { });

            setCurrentPage(1);
            setScale(1.0);
            setAnnotations({});
            setHistory([{}]);
            setHistoryStep(0);
        } catch (err) {
            toast.error("Failed to load PDF.");
        } finally {
            setIsLoading(false);
        }
    };

    const handlePrint = () => window.print();
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) containerRef.current?.requestFullscreen();
        else document.exitFullscreen();
    };

    const scrollToPage = (pageNum: number) => {
        setCurrentPage(pageNum);
        isScrollingRef.current = true;

        const pageEl = document.getElementById(`pdf-page-${pageNum}`);
        if (pageEl) {
            pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });

            // Release lock after animation + buffer
            setTimeout(() => { isScrollingRef.current = false; }, 1000);
        } else {
            isScrollingRef.current = false;
        }
    };

    const handlePageSubmit = () => {
        setIsEditingPage(false);
        const num = parseInt(pageInput);
        if (!isNaN(num) && num >= 1 && num <= (pdfDoc?.numPages || 1)) scrollToPage(num);
        else setPageInput(currentPage.toString());
    };
    const handleZoomSubmit = () => {
        setIsEditingZoom(false);
        const num = parseInt(zoomInput);
        if (!isNaN(num) && num >= 10 && num <= 500) setScale(num / 100);
        else setZoomInput(Math.round(scale * 100).toString());
    };

    // Tracking Logic (ElementFromPoint)
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container || !pdfDoc) return;
        let throttleId: NodeJS.Timeout;
        const handleScroll = () => {
            if (isScrollingRef.current) return; // Skip if programmatic scroll

            clearTimeout(throttleId);
            throttleId = setTimeout(() => {
                const rect = container.getBoundingClientRect();
                const x = rect.left + rect.width / 2;
                const y = rect.top + (rect.height * 0.3);
                const el = document.elementFromPoint(x, y);
                if (!el) return;
                const pageWrapper = el.closest('[id^="pdf-page-"]');
                if (pageWrapper) {
                    const id = pageWrapper.id;
                    const pageNum = parseInt(id.replace("pdf-page-", ""));
                    if (!isNaN(pageNum) && pageNum !== currentPageRef.current) setCurrentPage(pageNum);
                }
            }, 100);
        };
        container.addEventListener('scroll', handleScroll);
        return () => { container.removeEventListener('scroll', handleScroll); clearTimeout(throttleId); };
    }, [pdfDoc]);

    // Fix 1: Calculate Effective Aspect Ratio based on rotation
    const effectiveRotation = rotation % 360;
    const isRotated = effectiveRotation === 90 || effectiveRotation === 270;
    const effectiveAspectRatio = isRotated ? (1 / defaultAspectRatio) : defaultAspectRatio;


    if (!file || !pdfDoc) {
        return (
            <div className="min-h-screen bg-[#030712] text-slate-200 p-8 flex flex-col items-center justify-center">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400 mb-8">
                    PDF Viewer Pro
                </h1>
                <div
                    {...getRootProps()}
                    className={cn(
                        "w-full max-w-xl h-64 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all",
                        isDragActive ? "border-purple-500 bg-purple-500/10" : "border-slate-800 hover:border-slate-700 bg-slate-900/50"
                    )}
                >
                    <input {...getInputProps()} />
                    <Upload className="w-12 h-12 text-slate-500 mb-4" />
                    <p className="text-lg font-medium text-slate-300">Drop your PDF here</p>
                </div>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="fixed inset-0 z-[99999] flex flex-col bg-slate-950 text-slate-200 overflow-hidden">

            {/* --- TOP TOOLBAR (Adaptive) --- */}
            <div className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-2 md:px-4 z-20 shrink-0">

                {/* 1. Left: Sidebar & Navigation */}
                <div className="flex items-center gap-2 md:gap-4 shrink-0">
                    {/* Hidden on Mobile */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className={cn(
                            "text-slate-400 hover:text-white transition-colors hidden md:flex",
                            sidebarOpen && "bg-slate-800 text-white"
                        )}
                        title="Toggle Sidebar"
                    >
                        <PanelLeft className="w-5 h-5" />
                    </Button>

                    <div className="hidden md:block w-[1px] h-8 bg-slate-800" />

                    {/* Page Nav */}
                    <div className="flex items-center gap-1 md:gap-3 bg-slate-800/50 rounded-lg p-1 border border-slate-700/50">
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-700" onClick={() => scrollToPage(Math.max(1, currentPage - 1))} disabled={currentPage <= 1}>
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <div className="flex items-center gap-1 md:gap-2 px-1 md:px-2">
                            {/* Mobile: Simple Text */}
                            {isMobile ? (
                                <span className="text-xs font-mono min-w-[3rem] text-center">{currentPage} / {pdfDoc.numPages}</span>
                            ) : (
                                <>
                                    {isEditingPage ? (
                                        <input autoFocus className="w-12 bg-slate-950 border border-purple-500 rounded px-1 text-center text-sm focus:outline-none" value={pageInput} onChange={(e) => setPageInput(e.target.value)} onBlur={handlePageSubmit} onKeyDown={(e) => e.key === "Enter" && handlePageSubmit()} />
                                    ) : (
                                        <span className="text-sm font-mono cursor-pointer hover:text-purple-400" onClick={() => { setPageInput(currentPage.toString()); setIsEditingPage(true); }}>{currentPage}</span>
                                    )}
                                    <span className="text-slate-500">/</span>
                                    <span className="text-sm text-slate-400">{pdfDoc.numPages}</span>
                                </>
                            )}
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-700" onClick={() => scrollToPage(Math.min(pdfDoc.numPages, currentPage + 1))} disabled={currentPage >= pdfDoc.numPages}><ChevronRight className="w-4 h-4" /></Button>
                    </div>
                </div>

                {/* 2. Middle: Desktop Annotation Tools (Hidden on Mobile) */}
                {!isMobile && (
                    <div className="flex items-center gap-1 bg-slate-800/50 rounded-lg p-1 border border-slate-700/50 shrink-0 mx-4">
                        <div className="relative group">
                            <Button variant={tool === 'pen' ? "secondary" : "ghost"} size="icon" className={cn("h-8 w-8", tool === 'pen' && "text-purple-400")} onClick={() => setTool(tool === 'pen' ? null : 'pen')} title="Pen">
                                <Pen className="w-4 h-4" />
                            </Button>
                            {tool === 'pen' && (
                                <div className="absolute top-10 left-0 bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl flex flex-col gap-3 min-w-[150px] z-[60]">
                                    <div className="text-xs text-slate-500 font-medium">Color</div>
                                    <div className="flex flex-wrap gap-2">
                                        {PEN_COLORS.map(c => (
                                            <button key={c} className={cn("w-5 h-5 rounded-full border-2 transition-all", penColor === c ? "border-white scale-110" : "border-transparent hover:scale-110")} style={{ backgroundColor: c }} onClick={() => setPenColor(c)} />
                                        ))}
                                    </div>
                                    <div className="text-xs text-slate-500 font-medium mt-1">Width</div>
                                    <input type="range" min="1" max="10" step="1" value={penWidth} onChange={(e) => setPenWidth(parseInt(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500" />
                                </div>
                            )}
                        </div>
                        <div className="relative group">
                            <Button variant={tool === 'highlighter' ? "secondary" : "ghost"} size="icon" className={cn("h-8 w-8", tool === 'highlighter' && "text-purple-400")} onClick={() => setTool(tool === 'highlighter' ? null : 'highlighter')} title="Highlighter">
                                <Highlighter className="w-4 h-4" />
                            </Button>
                            {tool === 'highlighter' && (
                                <div className="absolute top-10 left-0 bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl flex flex-col gap-3 min-w-[150px] z-[60]">
                                    <div className="text-xs text-slate-500 font-medium">Color</div>
                                    <div className="flex flex-wrap gap-2">
                                        {HIGHLIGHTER_COLORS.map(c => (
                                            <button key={c} className={cn("w-5 h-5 rounded-full border-2 transition-all", highlighterColor === c ? "border-white scale-110" : "border-transparent hover:scale-110")} style={{ backgroundColor: c }} onClick={() => setHighlighterColor(c)} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <Button variant={tool === 'eraser' ? "secondary" : "ghost"} size="icon" className={cn("h-8 w-8", tool === 'eraser' && "text-purple-400")} onClick={() => setTool(tool === 'eraser' ? null : 'eraser')} title="Eraser">
                            <Eraser className="w-4 h-4" />
                        </Button>
                        <div className="w-[1px] h-4 bg-slate-700 mx-1" />
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleUndo} disabled={historyStep <= 0} title="Undo">
                            <Undo className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleRedo} disabled={historyStep >= history.length - 1} title="Redo">
                            <Redo className="w-4 h-4" />
                        </Button>
                    </div>
                )}

                {/* 3. Right: System Tools (Zoom, More) */}
                <div className="flex items-center gap-2 shrink-0">
                    {/* Zoom Controls */}
                    <div className="flex items-center bg-slate-800/30 rounded-lg border border-slate-700/30 p-0.5">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setScale(s => Math.max(0.1, s - 0.1))}><ZoomOut className="w-3.5 h-3.5" /></Button>
                        {!isMobile && <span className="text-xs w-10 text-center font-mono">{Math.round(scale * 100)}%</span>}
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setScale(s => Math.min(5.0, s + 0.1))}><ZoomIn className="w-3.5 h-3.5" /></Button>
                    </div>

                    {/* Desktop: Icons */}
                    {!isMobile ? (
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={() => setRotation(r => (r + 90) % 360)} title="Rotate"><RotateCw className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={toggleFullscreen}><Maximize className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={handlePrint}><Printer className="w-4 h-4" /></Button>
                        </div>
                    ) : (
                        /* Mobile: More Menu */
                        <div className="relative">
                            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                                <MoreVertical className="w-5 h-5" />
                            </Button>
                            {mobileMenuOpen && (
                                <div className="absolute top-10 right-0 bg-slate-900 border border-slate-700 rounded-xl p-2 shadow-2xl flex flex-col gap-1 min-w-[140px] z-[100] animate-in fade-in zoom-in-95 duration-200">
                                    <Button variant="ghost" size="sm" className="justify-start gap-2" onClick={() => { setRotation(r => (r + 90) % 360); setMobileMenuOpen(false); }}>
                                        <RotateCw className="w-4 h-4" /> Rotate Page
                                    </Button>
                                    <Button variant="ghost" size="sm" className="justify-start gap-2" onClick={() => { toggleFullscreen(); setMobileMenuOpen(false); }}>
                                        <Maximize className="w-4 h-4" /> Fullscreen
                                    </Button>
                                    <Button variant="ghost" size="sm" className="justify-start gap-2" onClick={() => { handlePrint(); setMobileMenuOpen(false); }}>
                                        <Printer className="w-4 h-4" /> Print PDF
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* --- MAIN CONTENT --- */}
            <div className="flex-1 flex overflow-hidden relative" onClick={() => setMobileMenuOpen(false)}>
                {/* Sidebar - Desktop Only */}
                {!isMobile && (
                    <div className={cn(
                        "border-r border-slate-800 bg-slate-900/50 flex-col overflow-y-auto transition-all duration-300 ease-in-out hidden md:flex",
                        sidebarOpen ? "w-64 opacity-100 translate-x-0" : "w-0 opacity-0 -translate-x-full border-r-0 overflow-hidden"
                    )}>
                        <div className="p-4 space-y-4 pt-4 text-center">
                            {/* Mini map or thumbnail placeholder */}
                            <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">Page Thumbnails</div>
                            {Array.from({ length: pdfDoc.numPages }, (_, i) => i + 1).map(pageNum => (
                                <SidebarThumbnail
                                    key={pageNum}
                                    pageNum={pageNum}
                                    pdfDoc={pdfDoc}
                                    isCurrent={currentPage === pageNum}
                                    onSelect={() => scrollToPage(pageNum)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                <div ref={scrollContainerRef} className="flex-1 overflow-auto bg-slate-950/50 relative">
                    <div
                        className="grid gap-4 transition-all p-4 md:p-8 mx-auto w-full grid-cols-1 pb-32" // Added pb-32 for mobile dock space
                        style={{ width: isMobile ? `${scale * 100}%` : `${scale * 50}rem` }}
                    >
                        {Array.from({ length: pdfDoc.numPages }, (_, i) => i + 1).map(pageNum => (
                            <PageRenderer
                                key={`page-${pageNum}`}
                                id={`pdf-page-${pageNum}`}
                                pageNum={pageNum}
                                pdfDoc={pdfDoc}
                                scale={scale}
                                rotation={rotation}
                                tool={tool}
                                penColor={penColor}
                                penWidth={penWidth}
                                highlighterColor={highlighterColor}
                                annotations={annotations[pageNum] || []}
                                onUpdateAnnotations={(newStrokes) => {
                                    const next = { ...annotations, [pageNum]: newStrokes };
                                    updateAnnotations(next);
                                }}
                                aspectRatio={effectiveAspectRatio}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* --- MOBILE FLOATING DOCK (Bottom) --- */}
            {isMobile && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex items-center justify-center">
                    <div className="flex items-center gap-2 p-2 rounded-full bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 shadow-2xl ring-1 ring-white/10">
                        {/* Undo/Redo Group */}
                        <div className="flex items-center gap-1 pr-2 border-r border-slate-700/50">
                            <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:text-white rounded-full" onClick={handleUndo} disabled={historyStep <= 0}>
                                <Undo className="w-5 h-5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:text-white rounded-full" onClick={handleRedo} disabled={historyStep >= history.length - 1}>
                                <Redo className="w-5 h-5" />
                            </Button>
                        </div>

                        {/* Tools Group */}
                        <div className="flex items-center gap-2 pl-1">
                            {/* Pen Tool + Popup */}
                            <div className="relative group">
                                {tool === 'pen' && (
                                    <div className="absolute bottom-14 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-xl mb-2 flex flex-col gap-3 min-w-[160px] animate-in slide-in-from-bottom-5">
                                        <div className="text-xs text-slate-500 font-medium">Pen Color</div>
                                        <div className="flex flex-wrap gap-2 justify-center">
                                            {PEN_COLORS.map(c => (
                                                <button key={c} className={cn("w-6 h-6 rounded-full border-2 transition-all", penColor === c ? "border-white scale-110" : "border-transparent")} style={{ backgroundColor: c }} onClick={() => setPenColor(c)} />
                                            ))}
                                        </div>
                                        <div className="h-[1px] bg-slate-800" />
                                        <div className="text-xs text-slate-500 font-medium">Thickness</div>
                                        <input type="range" min="1" max="10" step="1" value={penWidth} onChange={(e) => setPenWidth(parseInt(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500" />
                                    </div>
                                )}
                                <Button
                                    variant={tool === 'pen' ? "default" : "ghost"}
                                    size="icon"
                                    className={cn("h-12 w-12 rounded-full transition-all", tool === 'pen' ? "bg-purple-600 text-white shadow-lg shadow-purple-900/20 hover:bg-purple-500" : "text-slate-400 hover:bg-slate-800")}
                                    onClick={() => setTool(tool === 'pen' ? null : 'pen')}
                                >
                                    <Pen className="w-6 h-6" />
                                </Button>
                            </div>

                            {/* Highlighter + Popup */}
                            <div className="relative group">
                                {tool === 'highlighter' && (
                                    <div className="absolute bottom-14 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-xl mb-2 flex flex-col gap-3 min-w-[140px] animate-in slide-in-from-bottom-5">
                                        <div className="text-xs text-slate-500 font-medium">Highlight</div>
                                        <div className="flex flex-wrap gap-2 justify-center">
                                            {HIGHLIGHTER_COLORS.map(c => (
                                                <button key={c} className={cn("w-6 h-6 rounded-full border-2 transition-all", highlighterColor === c ? "border-white scale-110" : "border-transparent")} style={{ backgroundColor: c }} onClick={() => setHighlighterColor(c)} />
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <Button
                                    variant={tool === 'highlighter' ? "default" : "ghost"}
                                    size="icon"
                                    className={cn("h-12 w-12 rounded-full transition-all", tool === 'highlighter' ? "bg-yellow-500/20 text-yellow-500 border border-yellow-500/50 shadow-lg" : "text-slate-400 hover:bg-slate-800")}
                                    onClick={() => setTool(tool === 'highlighter' ? null : 'highlighter')}
                                >
                                    <Highlighter className="w-6 h-6" />
                                </Button>
                            </div>

                            {/* Eraser */}
                            <Button
                                variant={tool === 'eraser' ? "default" : "ghost"}
                                size="icon"
                                className={cn("h-12 w-12 rounded-full transition-all", tool === 'eraser' ? "bg-red-500/20 text-red-500 border border-red-500/50" : "text-slate-400 hover:bg-slate-800")}
                                onClick={() => setTool(tool === 'eraser' ? null : 'eraser')}
                            >
                                <Eraser className="w-6 h-6" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ------ Components ------

const VISIBILITY_OPTIONS = { threshold: 0.1 };

function useInView(options: IntersectionObserverInit = VISIBILITY_OPTIONS) {
    const ref = useRef(null);
    const [inView, setInView] = useState(false);
    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => { setInView(entry.isIntersecting); }, options);
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [options]);
    return [ref, inView] as const;
}

interface PageRendererProps {
    pageNum: number;
    pdfDoc: pdfjsLib.PDFDocumentProxy;
    scale: number;
    rotation: number;
    id?: string;
    tool?: Tool;
    penColor?: string;
    penWidth?: number;
    highlighterColor?: string;
    annotations?: Stroke[];
    onUpdateAnnotations?: (strokes: Stroke[]) => void;
    aspectRatio: number; // New prop
}

function PageRenderer({ pageNum, pdfDoc, scale, rotation, id, tool, penColor, penWidth, highlighterColor, annotations = [], onUpdateAnnotations, aspectRatio }: PageRendererProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const annotationCanvasRef = useRef<HTMLCanvasElement>(null);
    const renderTaskRef = useRef<any>(null);
    const [containerRef, inView] = useInView();

    const isDrawing = useRef(false);
    const currentPath = useRef<Point[]>([]);

    useEffect(() => {
        if (!inView || !canvasRef.current || !pdfDoc) return;
        const render = async () => {
            if (renderTaskRef.current) try { renderTaskRef.current.cancel(); } catch (e) { }
            try {
                const page = await pdfDoc.getPage(pageNum);
                const viewport = page.getViewport({ scale: scale * 1.5, rotation: rotation });
                const canvas = canvasRef.current;
                if (!canvas) return;
                const context = canvas.getContext("2d");
                if (!context) return;
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                const task = page.render({ canvasContext: context, viewport } as any);
                renderTaskRef.current = task;
                await task.promise;
            } catch (error: any) { } finally { renderTaskRef.current = null; }
        };
        render();
        return () => { if (renderTaskRef.current) try { renderTaskRef.current.cancel(); } catch (e) { } };
    }, [pageNum, pdfDoc, scale, rotation, inView]);

    useEffect(() => {
        const canvas = annotationCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        if (canvasRef.current) {
            canvas.width = canvasRef.current.width;
            canvas.height = canvasRef.current.height;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        annotations.forEach(stroke => {
            ctx.beginPath();
            ctx.strokeStyle = stroke.color;
            ctx.lineWidth = stroke.width * scale * 1.5;
            if (stroke.tool === 'highlighter') {
                ctx.globalAlpha = 0.4;
                ctx.globalCompositeOperation = 'multiply';
            } else {
                ctx.globalAlpha = 1.0;
                ctx.globalCompositeOperation = 'source-over';
            }
            if (stroke.points.length > 0) {
                const start = stroke.points[0];
                ctx.moveTo(start.x * canvas.width, start.y * canvas.height);
                stroke.points.forEach(p => {
                    ctx.lineTo(p.x * canvas.width, p.y * canvas.height);
                });
            }
            ctx.stroke();
        });
    }, [annotations, scale, rotation, inView, pdfDoc]);

    const handlePointerDown = (e: React.PointerEvent) => {
        if (!tool || !annotationCanvasRef.current || !onUpdateAnnotations) return;
        const canvas = annotationCanvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        if (tool === 'eraser') {
            const eraserRadius = 0.02;
            const remaining = annotations.filter(stroke => {
                return !stroke.points.some(p => Math.hypot(p.x - x, p.y - y) < eraserRadius);
            });
            if (remaining.length !== annotations.length) onUpdateAnnotations(remaining);
            isDrawing.current = true;
        } else {
            isDrawing.current = true;
            currentPath.current = [{ x, y }];
        }
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDrawing.current || !tool || !annotationCanvasRef.current || !onUpdateAnnotations) return;
        const canvas = annotationCanvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        if (tool === 'eraser') {
            const eraserRadius = 0.02;
            const remaining = annotations.filter(stroke => {
                return !stroke.points.some(p => Math.hypot(p.x - x, p.y - y) < eraserRadius);
            });
            if (remaining.length !== annotations.length) onUpdateAnnotations(remaining);
        } else {
            currentPath.current.push({ x, y });
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.save();
                ctx.beginPath();
                ctx.strokeStyle = tool === 'pen' ? (penColor || '#000') : (highlighterColor || '#ff0');
                ctx.lineWidth = (tool === 'pen' ? (penWidth || 2) : 20) * scale * 1.5;
                ctx.lineCap = 'round';
                if (tool === 'highlighter') {
                    ctx.globalAlpha = 0.4;
                    ctx.globalCompositeOperation = 'multiply';
                }
                if (currentPath.current.length >= 2) {
                    const prev = currentPath.current[currentPath.current.length - 2];
                    const curr = currentPath.current[currentPath.current.length - 1];
                    ctx.moveTo(prev.x * canvas.width, prev.y * canvas.height);
                    ctx.lineTo(curr.x * canvas.width, curr.y * canvas.height);
                    ctx.stroke();
                }
                ctx.restore();
            }
        }
    };

    const handlePointerUp = () => {
        if (!isDrawing.current || !tool || !onUpdateAnnotations) return;
        isDrawing.current = false;
        if (tool !== 'eraser' && currentPath.current.length > 0) {
            const newStroke: Stroke = {
                id: Date.now().toString(),
                tool: tool as 'pen' | 'highlighter',
                color: tool === 'pen' ? (penColor || '#000') : (highlighterColor || '#ff0'),
                width: tool === 'pen' ? (penWidth || 2) : 20,
                points: [...currentPath.current]
            };
            onUpdateAnnotations([...annotations, newStroke]);
            currentPath.current = [];
        }
    };

    return (
        <div
            ref={containerRef as any}
            id={id}
            // Use style for aspect ratio to ensure correct height placeholder
            style={{ aspectRatio: aspectRatio }}
            className="relative group scroll-mt-24 w-full flex items-center justify-center bg-white/5 rounded-lg transition-all"
        >
            <span className="absolute -top-6 left-2 text-xs text-slate-500 font-mono opacity-0 group-hover:opacity-100 transition-opacity">Page {pageNum}</span>
            <div className="relative w-full h-full">
                <canvas ref={canvasRef} className="w-full h-full object-contain bg-white rounded-lg shadow-sm block select-none" />
                <canvas
                    ref={annotationCanvasRef}
                    className={cn("absolute inset-0 w-full h-full touch-none z-10", tool ? "cursor-crosshair" : "pointer-events-none")}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                />
            </div>
        </div>
    );
}

// Sidebar Thumbnail (Unchanged)
interface SidebarThumbnailProps {
    pageNum: number;
    pdfDoc: pdfjsLib.PDFDocumentProxy;
    isCurrent: boolean;
    onSelect: () => void;
}

function SidebarThumbnail({ pageNum, pdfDoc, isCurrent, onSelect }: SidebarThumbnailProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [containerRef, inView] = useInView({ threshold: 0.1 });

    useEffect(() => {
        if (!inView) return;
        let isMounted = true;
        if (canvasRef.current && pdfDoc) {
            pdfDoc.getPage(pageNum).then(page => {
                if (!isMounted) return;
                const viewport = page.getViewport({ scale: 0.2 });
                const canvas = canvasRef.current;
                if (!canvas) return;
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                const ctx = canvas.getContext("2d");
                if (ctx) page.render({ canvasContext: ctx, viewport } as any).promise.catch(() => { });
            });
        }
        return () => { isMounted = false; };
    }, [pdfDoc, pageNum, inView]);

    return (
        <div ref={containerRef as any} onClick={onSelect} className={cn("p-2 rounded-lg cursor-pointer transition-colors border min-h-[100px]", isCurrent ? "bg-purple-500/20 border-purple-500" : "hover:bg-slate-800 border-transparent")}>
            <canvas ref={canvasRef} className="mx-auto rounded border border-slate-700 bg-white max-w-full h-auto" />
            <div className="text-center text-xs text-slate-400 mt-1">Page {pageNum}</div>
        </div>
    );
}
