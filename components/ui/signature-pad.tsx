"use client";

import React, { useRef, useState, useEffect, useImperativeHandle, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Undo, Eraser } from "lucide-react";

interface SignaturePadProps {
    className?: string;
    onChange?: () => void;
}

export interface SignaturePadRef {
    clear: () => void;
    getDataUrl: () => string | null;
    isEmpty: () => boolean;
}

export const SignaturePad = forwardRef<SignaturePadRef, SignaturePadProps>(
    ({ className, onChange }, ref) => {
        const canvasRef = useRef<HTMLCanvasElement>(null);
        const [isDrawing, setIsDrawing] = useState(false);
        const [hasSignature, setHasSignature] = useState(false);

        // Resize observer to handle responsiveness
        useEffect(() => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const resizeCanvas = () => {
                const parent = canvas.parentElement;
                if (parent) {
                    canvas.width = parent.clientWidth;
                    canvas.height = parent.clientHeight;
                    // Reset context properties after resize
                    const ctx = canvas.getContext("2d");
                    if (ctx) {
                        ctx.lineWidth = 2;
                        ctx.lineCap = "round";
                        ctx.lineJoin = "round";
                        ctx.strokeStyle = "#000000"; // Signature color (black)
                    }
                }
            };

            window.addEventListener("resize", resizeCanvas);
            resizeCanvas();

            return () => window.removeEventListener("resize", resizeCanvas);
        }, []);

        const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
            setIsDrawing(true);
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            const { x, y } = getCoordinates(e, canvas);
            ctx.beginPath();
            ctx.moveTo(x, y);
        };

        const draw = (e: React.MouseEvent | React.TouchEvent) => {
            if (!isDrawing) return;
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            const { x, y } = getCoordinates(e, canvas);
            ctx.lineTo(x, y);
            ctx.stroke();
            if (!hasSignature) setHasSignature(true);
        };

        const stopDrawing = () => {
            setIsDrawing(false);
            if (onChange) onChange();
        };

        const getCoordinates = (
            e: React.MouseEvent | React.TouchEvent,
            canvas: HTMLCanvasElement
        ) => {
            const rect = canvas.getBoundingClientRect();
            let x, y;

            if ("touches" in e) {
                x = e.touches[0].clientX - rect.left;
                y = e.touches[0].clientY - rect.top;
            } else {
                x = (e as React.MouseEvent).clientX - rect.left;
                y = (e as React.MouseEvent).clientY - rect.top;
            }
            return { x, y };
        };

        useImperativeHandle(ref, () => ({
            clear: () => {
                const canvas = canvasRef.current;
                if (!canvas) return;
                const ctx = canvas.getContext("2d");
                if (!ctx) return;
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                setHasSignature(false);
            },
            getDataUrl: () => {
                if (!hasSignature || !canvasRef.current) return null;
                return canvasRef.current.toDataURL("image/png");
            },
            isEmpty: () => !hasSignature,
        }));

        return (
            <div className={cn("relative w-full h-full bg-white rounded-xl overflow-hidden touch-none", className)}>
                <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-full cursor-crosshair"
                />
            </div>
        );
    }
);

SignaturePad.displayName = "SignaturePad";
