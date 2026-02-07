import { useState } from "react";
import { PDFDocument, degrees } from "pdf-lib";
import { readFileAsArrayBuffer, downloadBlob } from "@/lib/pdf-utils";
import { useAuth } from "@/components/auth/auth-provider";
import { uploadToR2, deleteFromR2, validatePDFFile } from "@/lib/r2-upload";

export function usePDF() {
    const { user } = useAuth();
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    // Helper to simulate progress
    const simulateProgress = () => {
        setProgress(0);
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 90) return prev;
                return prev + 5;
            });
        }, 500);
        return interval;
    };

    const mergePDFs = async (files: File[], outputName = "merged.pdf") => {
        let interval;
        try {
            setIsProcessing(true);
            setError(null);
            interval = simulateProgress();

            const mergedPdf = await PDFDocument.create();

            for (const file of files) {
                const fileBuffer = await readFileAsArrayBuffer(file);
                const pdf = await PDFDocument.load(fileBuffer);
                const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                copiedPages.forEach((page) => mergedPdf.addPage(page));
            }

            const pdfBytes = await mergedPdf.save();
            const blob = new Blob([pdfBytes as any], { type: "application/pdf" });

            setProgress(100);
            downloadBlob(blob, outputName);
        } catch (err) {
            console.error(err);
            setError("Failed to merge PDFs.");
        } finally {
            clearInterval(interval);
            setIsProcessing(false);
            setTimeout(() => setProgress(0), 1000);
        }
    };

    const imagesToPDF = async (files: File[], outputName = "images.pdf") => {
        let interval;
        try {
            setIsProcessing(true);
            setError(null);
            interval = simulateProgress();

            const pdfDoc = await PDFDocument.create();

            for (const file of files) {
                const imageBuffer = await readFileAsArrayBuffer(file);
                let image;

                if (file.type === "image/jpeg") {
                    image = await pdfDoc.embedJpg(imageBuffer);
                } else if (file.type === "image/png") {
                    image = await pdfDoc.embedPng(imageBuffer);
                } else {
                    continue; // Skip unsupported formats
                }

                const page = pdfDoc.addPage([image.width, image.height]);
                page.drawImage(image, {
                    x: 0,
                    y: 0,
                    width: image.width,
                    height: image.height,
                });
            }

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes as any], { type: "application/pdf" });

            setProgress(100);
            downloadBlob(blob, outputName);
        } catch (err) {
            console.error(err);
            setError("Failed to convert images to PDF.");
        } finally {
            clearInterval(interval);
            setIsProcessing(false);
            setTimeout(() => setProgress(0), 1000);
        }
    };

    const pdfToImages = async (file: File, outputName = "images.zip") => {
        let interval;
        try {
            setIsProcessing(true);
            setError(null);
            interval = simulateProgress();

            const JSZip = (await import("jszip")).default;
            const zip = new JSZip();

            const pdfjsModule = await import("pdfjs-dist");
            // @ts-ignore
            const pdfjsLib = pdfjsModule.default || pdfjsModule;
            if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
                pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
            }

            const buffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument(buffer).promise;
            const numPages = pdf.numPages;

            for (let i = 1; i <= numPages; i++) {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 2.0 }); // High quality scale
                const canvas = document.createElement("canvas");
                const context = canvas.getContext("2d");
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                if (context) {
                    await page.render({ canvasContext: context, viewport } as any).promise;
                    const blob = await new Promise<Blob | null>(resolve =>
                        canvas.toBlob(resolve, "image/jpeg", 0.9)
                    );

                    if (blob) {
                        zip.file(`page-${i}.jpg`, blob);
                    }
                }
            }

            const content = await zip.generateAsync({ type: "blob" });
            setProgress(100);
            downloadBlob(content, outputName);
        } catch (err) {
            console.error(err);
            setError("Failed to convert PDF to images.");
        } finally {
            clearInterval(interval);
            setIsProcessing(false);
            setTimeout(() => setProgress(0), 1000);
        }
    };

    const pdfToText = async (file: File) => {
        let interval;
        try {
            setIsProcessing(true);
            setError(null);
            interval = simulateProgress();

            const pdfjsModule = await import("pdfjs-dist");
            // @ts-ignore
            const pdfjsLib = pdfjsModule.default || pdfjsModule;
            if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
                pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
            }

            const buffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument(buffer).promise;
            const numPages = pdf.numPages;
            let fullText = "";

            for (let i = 1; i <= numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items
                    .map((item: any) => item.str)
                    .join(" ");

                fullText += `--- Page ${i} ---\n\n${pageText}\n\n`;
            }

            setProgress(100);
            return fullText;
        } catch (err) {
            console.error(err);
            setError("Failed to extract text from PDF.");
            return "";
        } finally {
            clearInterval(interval);
            setIsProcessing(false);
            setTimeout(() => setProgress(0), 1000);
        }
    };

    const signPDF = async (
        file: File,
        signatureDataUrl: string,
        signatures: { pageIndex: number; x: number; y: number; width: number; height: number }[]
    ) => {
        let interval;
        try {
            setIsProcessing(true);
            setError(null);
            interval = simulateProgress();

            const fileBuffer = await readFileAsArrayBuffer(file);
            const pdfDoc = await PDFDocument.load(fileBuffer);

            const imageBytes = await fetch(signatureDataUrl).then((res) => res.arrayBuffer());
            const signatureImage = await pdfDoc.embedPng(imageBytes);

            const pages = pdfDoc.getPages();

            signatures.forEach(({ pageIndex, x, y, width, height }) => {
                if (pageIndex >= 0 && pageIndex < pages.length) {
                    const page = pages[pageIndex];
                    page.drawImage(signatureImage, {
                        x,
                        y,
                        width,
                        height,
                    });
                }
            });

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
            const signedName = `signed_${file.name}`;

            setProgress(100);
            downloadBlob(blob, signedName);
        } catch (err) {
            console.error(err);
            setError("Failed to sign PDF.");
        } finally {
            clearInterval(interval);
            setIsProcessing(false);
            setTimeout(() => setProgress(0), 1000);
        }
    };

    const rotatePDF = async (file: File, rotation: 90 | 180 | 270, outputName = "rotated.pdf") => {
        let interval;
        try {
            setIsProcessing(true);
            setError(null);
            interval = simulateProgress();

            const fileBuffer = await readFileAsArrayBuffer(file);
            const pdfDoc = await PDFDocument.load(fileBuffer);
            const pages = pdfDoc.getPages();

            pages.forEach((page) => {
                const currentRotation = page.getRotation().angle;
                page.setRotation(degrees(currentRotation + rotation));
            });

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes as any], { type: "application/pdf" });

            setProgress(100);
            downloadBlob(blob, outputName);
        } catch (err) {
            console.error(err);
            setError("Failed to rotate PDF.");
        } finally {
            clearInterval(interval);
            setIsProcessing(false);
            setTimeout(() => setProgress(0), 1000);
        }
    };

    const protectPDF = async (file: File, password: string): Promise<boolean> => {
        let r2Key: string | null = null;
        try {
            setIsProcessing(true);
            setError(null);

            // Validate file
            const validation = validatePDFFile(file);
            if (!validation.valid) {
                throw new Error(validation.error);
            }

            // Check authentication
            if (!user?.uid) {
                throw new Error('Please sign in to use this feature');
            }

            // Stage 1: Upload to R2 (0-40%)
            setProgress(5);
            console.log('Uploading to R2...');
            const { publicUrl, key } = await uploadToR2(file, user.uid, (p) => {
                setProgress(Math.round(p.progress * 0.4));
            });
            r2Key = key;
            setProgress(45);

            // Stage 2: Call API with file URL (45-100%)
            console.log('Processing with API...');
            const response = await fetch('/api/encrypt-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileUrl: publicUrl, fileName: file.name, password }),
            });

            setProgress(80);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Server Error: ${response.status}`);
            }

            const blob = await response.blob();
            downloadBlob(blob, `secure_${file.name}`);

            setProgress(100);
            return true;

        } catch (err: any) {
            console.error("Protection Error:", err);
            setError(err.message || 'Unknown error');
            return false;
        } finally {
            if (r2Key) deleteFromR2(r2Key);
            setIsProcessing(false);
            setTimeout(() => setProgress(0), 1000);
        }
    };

    const compressPDF = async (file: File, compressionLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM'): Promise<boolean> => {
        let r2Key: string | null = null;
        try {
            setIsProcessing(true);
            setError(null);

            // Validate file
            const validation = validatePDFFile(file);
            if (!validation.valid) {
                throw new Error(validation.error);
            }

            // Check authentication
            if (!user?.uid) {
                throw new Error('Please sign in to use this feature');
            }

            // Stage 1: Upload to R2 (0-40%)
            setProgress(5);
            console.log('Uploading to R2...');
            const { publicUrl, key } = await uploadToR2(file, user.uid, (p) => {
                setProgress(Math.round(p.progress * 0.4));
            });
            r2Key = key;
            setProgress(45);

            // Stage 2: Call API with file URL (45-100%)
            console.log('Compressing with API...');
            const response = await fetch('/api/compress-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileUrl: publicUrl, fileName: file.name, compressionLevel }),
            });

            setProgress(80);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Server Error: ${response.status}`);
            }

            const blob = await response.blob();
            downloadBlob(blob, `compressed_${file.name}`);

            setProgress(100);
            return true;

        } catch (err: any) {
            console.error('Compression Error:', err);
            setError(err.message || 'Unknown error');
            return false;
        } finally {
            if (r2Key) deleteFromR2(r2Key);
            setIsProcessing(false);
            setTimeout(() => setProgress(0), 1000);
        }
    };

    const reorderPDF = async (
        file: File,
        pageOrder: number[],
        rotationMap: Record<number, number> = {},
        outputName = "organized.pdf"
    ) => {
        let interval;
        try {
            setIsProcessing(true);
            setError(null);
            interval = simulateProgress();

            const fileBuffer = await readFileAsArrayBuffer(file);
            const pdfDoc = await PDFDocument.load(fileBuffer);
            const newPdf = await PDFDocument.create();

            // Copy pages in the new order
            const copiedPages = await newPdf.copyPages(pdfDoc, pageOrder);

            copiedPages.forEach((page, index) => {
                const originalIndex = pageOrder[index];
                const rotation = rotationMap[originalIndex] || 0;
                const currentRotation = page.getRotation().angle;
                page.setRotation(degrees(currentRotation + rotation));
                newPdf.addPage(page);
            });

            const pdfBytes = await newPdf.save();
            const blob = new Blob([pdfBytes as any], { type: "application/pdf" });

            setProgress(100);
            downloadBlob(blob, outputName);
        } catch (err) {
            console.error(err);
            setError("Failed to reorder PDF.");
        } finally {
            clearInterval(interval);
            setIsProcessing(false);
            setTimeout(() => setProgress(0), 1000);
        }
    };

    const splitPDF = async (
        file: File,
        pageIndices: number[], // 0-based indices
        outputName = "split.pdf"
    ) => {
        let interval;
        try {
            setIsProcessing(true);
            setError(null);
            interval = simulateProgress();

            const fileBuffer = await readFileAsArrayBuffer(file);
            const pdfDoc = await PDFDocument.load(fileBuffer);
            const newPdf = await PDFDocument.create();

            const copiedPages = await newPdf.copyPages(pdfDoc, pageIndices);
            copiedPages.forEach((page) => newPdf.addPage(page));

            const pdfBytes = await newPdf.save();
            const blob = new Blob([pdfBytes as any], { type: "application/pdf" });

            setProgress(100);
            downloadBlob(blob, outputName);
        } catch (err) {
            console.error(err);
            setError("Failed to split PDF.");
        } finally {
            clearInterval(interval);
            setIsProcessing(false);
            setTimeout(() => setProgress(0), 1000);
        }
    };

    const watermarkPDF = async (
        file: File,
        text: string,
        color: string = "#FF0000",
        opacity: number = 0.5,
        outputName = "watermarked.pdf"
    ) => {
        let interval;
        try {
            setIsProcessing(true);
            setError(null);
            interval = simulateProgress();

            const fileBuffer = await readFileAsArrayBuffer(file);
            const pdfDoc = await PDFDocument.load(fileBuffer);
            const pages = pdfDoc.getPages();

            // Standard CSS font colors to RGB
            const hexToRgb = (hex: string) => {
                const r = parseInt(hex.slice(1, 3), 16) / 255;
                const g = parseInt(hex.slice(3, 5), 16) / 255;
                const b = parseInt(hex.slice(5, 7), 16) / 255;
                return { r, g, b };
            };

            const { r, g, b } = hexToRgb(color);

            // Dynamically import StandardFonts to avoid bundling issues
            const { StandardFonts, rgb } = await import("pdf-lib");
            const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

            pages.forEach((page) => {
                const { width, height } = page.getSize();
                const fontSize = 50;
                const textWidth = font.widthOfTextAtSize(text, fontSize);
                const textHeight = font.heightAtSize(fontSize);

                page.drawText(text, {
                    x: width / 2 - textWidth / 2,
                    y: height / 2 - textHeight / 2,
                    size: fontSize,
                    font: font,
                    color: rgb(r, g, b),
                    opacity: opacity,
                    rotate: degrees(45),
                });
            });

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes as any], { type: "application/pdf" });

            setProgress(100);
            downloadBlob(blob, outputName);
        } catch (err) {
            console.error(err);
            setError("Failed to watermark PDF.");
        } finally {
            clearInterval(interval);
            setIsProcessing(false);
            setTimeout(() => setProgress(0), 1000);
        }
    };

    const unlockPDF = async (file: File, password: string): Promise<boolean> => {
        let r2Key: string | null = null;
        try {
            setIsProcessing(true);
            setError(null);

            // Validate file
            const validation = validatePDFFile(file);
            if (!validation.valid) {
                throw new Error(validation.error);
            }

            // Check authentication
            if (!user?.uid) {
                throw new Error('Please sign in to use this feature');
            }

            // Stage 1: Upload to R2 (0-40%)
            setProgress(5);
            console.log('Uploading to R2...');
            const { publicUrl, key } = await uploadToR2(file, user.uid, (p) => {
                setProgress(Math.round(p.progress * 0.4));
            });
            r2Key = key;
            setProgress(45);

            // Stage 2: Call API with file URL (45-100%)
            console.log('Unlocking with API...');
            const response = await fetch('/api/decrypt-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileUrl: publicUrl, fileName: file.name, password }),
            });

            setProgress(80);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Server Error: ${response.status}`);
            }

            const blob = await response.blob();
            downloadBlob(blob, `unlocked_${file.name}`);

            setProgress(100);
            return true;
        } catch (err: any) {
            console.error("Unlock Error:", err);
            setError(err.message || 'Unknown error');
            return false;
        } finally {
            if (r2Key) deleteFromR2(r2Key);
            setIsProcessing(false);
            setTimeout(() => setProgress(0), 1000);
        }
    };

    const addPageNumbers = async (
        file: File,
        position: 'bottom-center' | 'bottom-right' | 'bottom-left' = 'bottom-center'
    ) => {
        let interval;
        try {
            setIsProcessing(true);
            setError(null);
            interval = simulateProgress();

            const fileBuffer = await readFileAsArrayBuffer(file);
            const pdfDoc = await PDFDocument.load(fileBuffer);
            const pages = pdfDoc.getPages();

            const { StandardFonts, rgb } = await import("pdf-lib");
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

            pages.forEach((page, index) => {
                const { width, height } = page.getSize();
                const fontSize = 12;
                const text = `${index + 1} / ${pages.length}`;
                const textWidth = font.widthOfTextAtSize(text, fontSize);

                let x = width / 2 - textWidth / 2;
                if (position === 'bottom-left') x = 20;
                if (position === 'bottom-right') x = width - textWidth - 20;

                const y = 20; // Bottom margin

                page.drawText(text, {
                    x,
                    y,
                    size: fontSize,
                    font: font,
                    color: rgb(0, 0, 0),
                });
            });

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
            const numberedName = `numbered_${file.name}`;

            setProgress(100);
            downloadBlob(blob, numberedName);
        } catch (err) {
            console.error(err);
            setError("Failed to add page numbers.");
        } finally {
            clearInterval(interval);
            setIsProcessing(false);
            setTimeout(() => setProgress(0), 1000);
        }
    };

    return {
        mergePDFs,
        splitPDF,
        imagesToPDF,
        pdfToImages,
        pdfToText,
        signPDF,
        unlockPDF,
        addPageNumbers,
        rotatePDF,
        protectPDF,
        compressPDF,
        reorderPDF,
        watermarkPDF,
        isProcessing,
        progress,
        error,
    };
}
