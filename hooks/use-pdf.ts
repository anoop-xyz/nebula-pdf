import { useState } from "react";
import { PDFDocument, degrees } from "pdf-lib";
import { readFileAsArrayBuffer, downloadBlob } from "@/lib/pdf-utils";

export function usePDF() {
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const mergePDFs = async (files: File[], outputName = "merged.pdf") => {
        try {
            setIsProcessing(true);
            setError(null);

            const mergedPdf = await PDFDocument.create();

            for (const file of files) {
                const fileBuffer = await readFileAsArrayBuffer(file);
                const pdf = await PDFDocument.load(fileBuffer);
                const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                copiedPages.forEach((page) => mergedPdf.addPage(page));
            }

            const pdfBytes = await mergedPdf.save();
            const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
            downloadBlob(blob, outputName);
        } catch (err) {
            console.error(err);
            setError("Failed to merge PDFs.");
        } finally {
            setIsProcessing(false);
        }
    };

    const imagesToPDF = async (files: File[], outputName = "images.pdf") => {
        try {
            setIsProcessing(true);
            setError(null);

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
            downloadBlob(blob, outputName);
        } catch (err) {
            console.error(err);
            setError("Failed to convert images to PDF.");
        } finally {
            setIsProcessing(false);
        }
    };

    const pdfToImages = async (file: File, outputName = "images.zip") => {
        try {
            setIsProcessing(true);
            setError(null);

            const JSZip = (await import("jszip")).default;
            const zip = new JSZip();

            const pdfjsLib = await import("pdfjs-dist");
            pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

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
            downloadBlob(content, outputName);
        } catch (err) {
            console.error(err);
            setError("Failed to convert PDF to images.");
        } finally {
            setIsProcessing(false);
        }
    };

    const pdfToText = async (file: File) => {
        try {
            setIsProcessing(true);
            setError(null);

            const pdfjsLib = await import("pdfjs-dist");
            pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

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

            return fullText;
        } catch (err) {
            console.error(err);
            setError("Failed to extract text from PDF.");
            return "";
        } finally {
            setIsProcessing(false);
        }
    };

    const signPDF = async (
        file: File,
        signatureDataUrl: string,
        signatures: { pageIndex: number; x: number; y: number; width: number; height: number }[]
    ) => {
        try {
            setIsProcessing(true);
            setError(null);

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
            downloadBlob(blob, `signed_${file.name}`);
        } catch (err) {
            console.error(err);
            setError("Failed to sign PDF.");
        } finally {
            setIsProcessing(false);
        }
    };

    const rotatePDF = async (file: File, rotation: 90 | 180 | 270, outputName = "rotated.pdf") => {
        try {
            setIsProcessing(true);
            setError(null);

            const fileBuffer = await readFileAsArrayBuffer(file);
            const pdfDoc = await PDFDocument.load(fileBuffer);
            const pages = pdfDoc.getPages();

            pages.forEach((page) => {
                const currentRotation = page.getRotation().angle;
                page.setRotation(degrees(currentRotation + rotation));
            });

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
            downloadBlob(blob, outputName);
        } catch (err) {
            console.error(err);
            setError("Failed to rotate PDF.");
        } finally {
            setIsProcessing(false);
        }
    };

    const protectPDF = async (file: File, password: string) => {
        try {
            setIsProcessing(true);
            setError(null);

            const formData = new FormData();
            formData.append('file', file);
            formData.append('password', password);

            const response = await fetch('/api/encrypt-pdf', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Server Error: ${response.status}`);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `secure_${file.name}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

        } catch (err: any) {
            console.error("Protection Error:", err);
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            alert(`Encryption Failed: ${errorMessage}`);
            // Re-throw to be caught by the UI component if needed
            throw err;
        } finally {
            setIsProcessing(false);
        }
    };

    const compressPDF = async (file: File, quality: number, outputName = "compressed.pdf") => {
        try {
            setIsProcessing(true);
            setError(null);

            // Dynamically import pdfjs-dist
            const pdfjsLib = await import("pdfjs-dist");
            pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

            const fileBuffer = await readFileAsArrayBuffer(file);
            const pdf = await pdfjsLib.getDocument(fileBuffer).promise;
            const numPages = pdf.numPages;

            const newPdfDoc = await PDFDocument.create();

            for (let i = 1; i <= numPages; i++) {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 1.0 }); // Standard scale to prevent upscaling
                const canvas = document.createElement("canvas");
                const context = canvas.getContext("2d");
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                if (context) {
                    await page.render({ canvasContext: context, viewport } as any).promise;
                    // Compress to JPEG
                    const imgDataUrl = canvas.toDataURL("image/jpeg", quality); // Use quality slider (0-1)
                    const imgBuffer = await fetch(imgDataUrl).then(res => res.arrayBuffer());

                    const embeddedImage = await newPdfDoc.embedJpg(imgBuffer);
                    const newPage = newPdfDoc.addPage([viewport.width, viewport.height]);
                    newPage.drawImage(embeddedImage, {
                        x: 0,
                        y: 0,
                        width: viewport.width,
                        height: viewport.height,
                    });
                }
            }

            const pdfBytes = await newPdfDoc.save();
            const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
            downloadBlob(blob, outputName);
        } catch (err) {
            console.error(err);
            setError("Failed to compress PDF.");
        } finally {
            setIsProcessing(false);
        }
    };

    const reorderPDF = async (
        file: File,
        pageOrder: number[],
        rotationMap: Record<number, number> = {},
        outputName = "organized.pdf"
    ) => {
        try {
            setIsProcessing(true);
            setError(null);

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
            downloadBlob(blob, outputName);
        } catch (err) {
            console.error(err);
            setError("Failed to reorder PDF.");
        } finally {
            setIsProcessing(false);
        }
    };

    const splitPDF = async (
        file: File,
        pageIndices: number[], // 0-based indices
        outputName = "split.pdf"
    ) => {
        try {
            setIsProcessing(true);
            setError(null);

            const fileBuffer = await readFileAsArrayBuffer(file);
            const pdfDoc = await PDFDocument.load(fileBuffer);
            const newPdf = await PDFDocument.create();

            const copiedPages = await newPdf.copyPages(pdfDoc, pageIndices);
            copiedPages.forEach((page) => newPdf.addPage(page));

            const pdfBytes = await newPdf.save();
            const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
            downloadBlob(blob, outputName);
        } catch (err) {
            console.error(err);
            setError("Failed to split PDF.");
        } finally {
            setIsProcessing(false);
        }
    };

    const watermarkPDF = async (
        file: File,
        text: string,
        color: string = "#FF0000",
        opacity: number = 0.5,
        outputName = "watermarked.pdf"
    ) => {
        try {
            setIsProcessing(true);
            setError(null);

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
            downloadBlob(blob, outputName);
        } catch (err) {
            console.error(err);
            setError("Failed to watermark PDF.");
        } finally {
            setIsProcessing(false);
        }
    };

    const unlockPDF = async (file: File, password: string) => {
        try {
            setIsProcessing(true);
            setError(null);

            const formData = new FormData();
            formData.append('file', file);
            formData.append('password', password);

            const response = await fetch('/api/decrypt-pdf', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Server Error: ${response.status}`);
            }

            const blob = await response.blob();
            downloadBlob(blob, `unlocked_${file.name}`);
        } catch (err: any) {
            console.error("Unlock Error:", err);
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
        } finally {
            setIsProcessing(false);
        }
    };

    const addPageNumbers = async (
        file: File,
        position: 'bottom-center' | 'bottom-right' | 'bottom-left' = 'bottom-center'
    ) => {
        try {
            setIsProcessing(true);
            setError(null);

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
            downloadBlob(blob, `numbered_${file.name}`);
        } catch (err) {
            console.error(err);
            setError("Failed to add page numbers.");
        } finally {
            setIsProcessing(false);
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
        error,
    };
}
