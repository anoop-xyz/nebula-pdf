import React from "react";

interface NebulaLoaderProps {
    progress?: number;
}

export function NebulaLoader({ progress }: NebulaLoaderProps) {
    // calculate stroke offset for progress (circumference = 2 * pi * r)
    // Radius 28 (inner) -> C ≈ 175.9
    const radius = 32;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = progress !== undefined
        ? circumference - (progress / 100) * circumference
        : circumference;

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md transition-all duration-500">
            <div className="relative w-24 h-24 flex items-center justify-center">
                {/* SVG Container */}
                <svg className="absolute inset-0 w-full h-full rotate-[-90deg]" viewBox="0 0 80 80">
                    {/* Background Track (Blue Ring Base) */}
                    <circle
                        cx="40"
                        cy="40"
                        r={radius}
                        fill="none"
                        stroke="#1e293b" // slate-800
                        strokeWidth="6"
                    />

                    {/* Blue Progress Ring */}
                    {progress !== undefined && (
                        <circle
                            cx="40"
                            cy="40"
                            r={radius}
                            fill="none"
                            stroke="#3b82f6" // blue-500
                            strokeWidth="6"
                            strokeLinecap="round"
                            style={{
                                strokeDasharray: circumference,
                                strokeDashoffset,
                                transition: "stroke-dashoffset 0.5s ease-in-out"
                            }}
                        />
                    )}
                </svg>

                {/* Purple Spinner (Independent CSS Animation) */}
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500/70 border-r-purple-500/30 animate-spin"></div>

                {/* Inner Pulsing Core */}
                <div className="w-4 h-4 bg-white rounded-full animate-pulse shadow-[0_0_15px_rgba(255,255,255,0.8)] z-10"></div>
            </div>

            {/* Text Label */}
            <div className="mt-8 text-slate-400 text-xs font-medium tracking-[0.2em] uppercase animate-pulse">
                Processing...
            </div>
        </div>
    );
}
