"use client";

import React, { useRef, useState, useEffect } from "react";
import { useMouse } from "@/components/layout/mouse-context";
import { motion, useMotionTemplate, useSpring, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface SpotlightCardProps extends HTMLMotionProps<"div"> {
    children: React.ReactNode;
    className?: string;
    spotlightColor?: string;
}

export function SpotlightCard({
    children,
    className,
    spotlightColor = "rgba(56, 189, 248, 0.25)", // Sky-400 with opacity
    ...props
}: SpotlightCardProps) {
    const { x, y } = useMouse();
    const cardRef = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);

    const mouseX = useSpring(0, { stiffness: 500, damping: 100 });
    const mouseY = useSpring(0, { stiffness: 500, damping: 100 });

    useEffect(() => {
        const unsubscribeX = x.on("change", (latestX) => {
            if (cardRef.current) {
                const rect = cardRef.current.getBoundingClientRect();
                mouseX.set(latestX - rect.left);
            }
        });

        const unsubscribeY = y.on("change", (latestY) => {
            if (cardRef.current) {
                const rect = cardRef.current.getBoundingClientRect();
                mouseY.set(latestY - rect.top);
            }
        });

        return () => {
            unsubscribeX();
            unsubscribeY();
        };
    }, [x, y, mouseX, mouseY]);

    return (
        <motion.div
            ref={cardRef}
            className={cn(
                "group relative overflow-hidden rounded-xl border p-6 transition-all duration-300",
                "bg-[rgba(255,255,255,0.03)] backdrop-blur-2xl border-[rgba(255,255,255,0.1)]",
                "hover:shadow-[0_0_30px_rgba(56,189,248,0.15)] hover:border-transparent",
                className
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            {...props}
        >
            {/* Spotlight Gradient Layer */}
            <motion.div
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{
                    background: useMotionTemplate`
            radial-gradient(
              650px circle at ${mouseX}px ${mouseY}px,
              ${spotlightColor},
              transparent 80%
            )
          `,
                }}
            />

            {/* Content */}
            <div className="relative z-10">{children}</div>
        </motion.div>
    );
}
