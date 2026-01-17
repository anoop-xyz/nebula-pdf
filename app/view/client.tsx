"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const PdfViewer = dynamic(() => import("./pdf-viewer"), {
    ssr: false,
    loading: () => (
        <div className="fixed inset-0 z-[99999] bg-[#030712] flex items-center justify-center text-slate-500">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
                <p className="text-sm font-medium animate-pulse">Loading Viewer...</p>
            </div>
        </div>
    ),
});

export default function ViewPage() {
    return <PdfViewer />;
}
