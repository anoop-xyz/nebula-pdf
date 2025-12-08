import React from "react";

export function NebulaLoader() {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md transition-all duration-500">
            <div className="relative w-20 h-20">
                {/* Outer Glowing Ring */}
                <div className="absolute inset-0 rounded-full border-4 border-slate-800/50"></div>
                <div className="absolute inset-0 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin shadow-[0_0_20px_rgba(56,189,248,0.4)]"></div>

                {/* Middle Orbit */}
                <div className="absolute inset-3 rounded-full border-2 border-slate-700/30"></div>
                <div className="absolute inset-3 rounded-full border-2 border-b-purple-500 border-t-transparent border-l-transparent border-r-transparent animate-spin-reverse opacity-70"></div>

                {/* Inner Core */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-4 bg-white rounded-full animate-pulse shadow-[0_0_15px_rgba(255,255,255,0.8)]"></div>
                </div>
            </div>

            {/* Text Label */}
            <div className="mt-8 text-slate-400 text-xs font-medium tracking-[0.2em] uppercase animate-pulse">
                Processing...
            </div>
        </div>
    );
}
