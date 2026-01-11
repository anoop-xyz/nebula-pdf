import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { NebulaLoader } from "@/components/ui/nebula-loader";

interface ToolLayoutProps {
    title: string;
    description: string;
    children: React.ReactNode;
    isLoading?: boolean;
    progress?: number;
}

export function ToolLayout({ title, description, children, isLoading = false, progress }: ToolLayoutProps) {
    return (
        <div className="min-h-screen p-6 md:p-12 flex flex-col relative">
            <AnimatePresence>
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex flex-col items-center justify-center"
                    >
                        <NebulaLoader progress={progress} />
                    </motion.div>
                )}
            </AnimatePresence>

            <header className="mb-8 flex items-center justify-between">
                <Link
                    href="/"
                    className="flex items-center text-slate-400 hover:text-slate-100 transition-colors group"
                >
                    <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Back to Home
                </Link>
            </header>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-1 max-w-6xl mx-auto w-full"
            >
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-100 mb-2">{title}</h1>
                    <p className="text-slate-400">{description}</p>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 md:p-8 min-h-[600px] backdrop-blur-sm">
                    {children}
                </div>
            </motion.div>
        </div>
    );
}
