"use client";

import React, { createContext, useContext, useEffect } from "react";
import { useMotionValue, MotionValue } from "framer-motion";

interface MouseContextType {
    x: MotionValue<number>;
    y: MotionValue<number>;
}

const MouseContext = createContext<MouseContextType | undefined>(undefined);

export const MouseProvider = ({ children }: { children: React.ReactNode }) => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            x.set(e.clientX);
            y.set(e.clientY);
            document.body.style.setProperty("--x", `${e.clientX}px`);
            document.body.style.setProperty("--y", `${e.clientY}px`);
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, [x, y]);

    return (
        <MouseContext.Provider value={{ x, y }}>
            {children}
        </MouseContext.Provider>
    );
};

export const useMouse = () => {
    const context = useContext(MouseContext);
    if (context === undefined) {
        throw new Error("useMouse must be used within a MouseProvider");
    }
    return context;
};
