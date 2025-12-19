"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const FRAME_COUNT = 300;
const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;

export function ScrollVideoBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [images, setImages] = useState<HTMLImageElement[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // 1. Preload Images
    useEffect(() => {
        let loadedCount = 0;
        const imgs: HTMLImageElement[] = [];

        for (let i = 0; i < FRAME_COUNT; i++) {
            const img = new Image();
            // Format: frame_000_delay-0.05s.webp
            const numStr = i.toString().padStart(3, '0');
            img.src = `/sequence/frame_${numStr}_delay-0.05s.webp`;

            img.onload = () => {
                loadedCount++;
                if (loadedCount === 20) { // Show after first 20 frames ready provided instant start
                    setIsLoaded(true);
                }
            };
            imgs.push(img);
        }
        setImages(imgs);
    }, []);

    // 2. Draw & Scroll Logic
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || images.length === 0) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Resize handler to maintain cover aspect ratio
        const renderFrame = (index: number) => {
            const img = images[index];
            if (!img || !img.complete) return;

            // Calculate 'object-fit: cover' logic manually for canvas
            const canvasRatio = canvas.width / canvas.height;
            const imgRatio = img.width / img.height;

            let drawWidth = canvas.width;
            let drawHeight = canvas.height;
            let offsetX = 0;
            let offsetY = 0;

            if (canvasRatio > imgRatio) {
                drawHeight = canvas.width / imgRatio;
                offsetY = (canvas.height - drawHeight) / 2;
            } else {
                drawWidth = canvas.height * imgRatio;
                offsetX = (canvas.width - drawWidth) / 2;
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        };

        const handleScroll = () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrollPercent = docHeight > 0 ? scrollTop / docHeight : 0;

            // Map 0-1 to 0-(totalFrames-1)
            const frameIndex = Math.min(
                FRAME_COUNT - 1,
                Math.floor(scrollPercent * FRAME_COUNT)
            );

            requestAnimationFrame(() => renderFrame(frameIndex));
        };

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            handleScroll(); // Redraw current frame
        };

        // Initial Setup
        handleResize();
        window.addEventListener("scroll", handleScroll, { passive: true });
        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("scroll", handleScroll);
            window.removeEventListener("resize", handleResize);
        };
    }, [images, isLoaded]); // Re-run when images start loading

    return (
        <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden bg-black pointer-events-none">
            {/* Fade in transition */}
            <div className={cn(
                "absolute inset-0 bg-black transition-opacity duration-1000",
                isLoaded ? "opacity-0" : "opacity-100 z-10"
            )} />

            <canvas
                ref={canvasRef}
                className="w-full h-full object-cover opacity-60"
            />

            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/80" />
        </div>
    );
}
