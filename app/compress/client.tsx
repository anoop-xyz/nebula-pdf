"use client";

import React, { useState } from "react";
import { ToolLayout } from "@/components/layout/tool-layout";
import { FileUpload } from "@/components/ui/file-upload";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { usePDF } from "@/hooks/use-pdf";
import { FileText, Minimize2, Settings2 } from "lucide-react";
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { useAuth } from "@/components/auth/auth-provider";
import { AuthModal } from "@/components/auth/auth-modal";

export default function CompressPage() {
    const [file, setFile] = useState<File | null>(null);
    const { compressPDF, isProcessing, progress, error } = usePDF();
    const [compressionLevel, setCompressionLevel] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');

    // Auth
    const { user } = useAuth();
    const [showAuthModal, setShowAuthModal] = useState(false);

    const handleFilesSelected = (files: File[]) => {
        if (files.length > 0) {
            setFile(files[0]);
        }
    };

    const handleCompress = async () => {
        if (!file) return;

        // 1. Check Auth
        if (!user) {
            setShowAuthModal(true);
            return;
        }

        // 2. Compress
        const success = await compressPDF(file, compressionLevel);

        // 3. Handle result
        if (success) {
            toast.success("PDF Compressed Successfully!");
        } else {
            // Error handling
            if (error) {
                if (error.includes("PDF_ALREADY_COMPRESSED")) {
                    toast.info("This PDF is already compressed to the maximum extent.");
                } else {
                    toast.error(error);
                }
            }
        }
    };

    return (
        <ToolLayout
            title="Compress PDF"
            description="Reduce the file size of your PDF documents."
            isLoading={isProcessing}
            progress={progress}
        >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                <div className="space-y-6">
                    <FileUpload
                        onFilesSelected={handleFilesSelected}
                        multiple={false}
                        accept={{ "application/pdf": [".pdf"] }}
                    />

                    {file && (
                        <div className="bg-slate-800 rounded-lg p-4 flex items-center gap-4 border border-slate-700">
                            <div className="p-3 bg-slate-700 rounded-lg">
                                <FileText className="w-8 h-8 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-200 truncate">
                                    {file.name}
                                </p>
                                <p className="text-xs text-slate-500">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                            </div>
                            <button
                                onClick={() => setFile(null)}
                                className="text-slate-400 hover:text-slate-200 text-sm"
                            >
                                Change
                            </button>
                        </div>
                    )}

                    {file && (
                        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 space-y-3">
                            <div className="flex items-center gap-2 text-slate-200 font-medium">
                                <Settings2 className="w-5 h-5 text-primary" />
                                <span>Compression Level</span>
                            </div>
                            <Select
                                value={compressionLevel}
                                onValueChange={(val: 'LOW' | 'MEDIUM' | 'HIGH') => setCompressionLevel(val)}
                            >
                                <SelectTrigger className="w-full bg-slate-900 border-slate-700 text-slate-200">
                                    <SelectValue placeholder="Select level" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
                                    <SelectItem value="LOW">Low (High Quality)</SelectItem>
                                    <SelectItem value="MEDIUM">Medium (Balanced)</SelectItem>
                                    <SelectItem value="HIGH">High (Max Compression)</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-slate-500 ml-1">
                                High compression may reduce image quality.
                            </p>
                        </div>
                    )}

                </div>

                <div className="flex flex-col items-center justify-center border-l border-slate-800 pl-8 min-h-[300px]">
                    <div className="text-center space-y-6">
                        <div className="w-32 h-40 bg-slate-800 rounded-lg border-2 border-dashed border-slate-700 flex items-center justify-center mx-auto relative overflow-hidden group">
                            <Minimize2 className="w-12 h-12 text-slate-600 group-hover:scale-110 transition-transform" />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent pointer-events-none" />
                        </div>

                        <div>
                            <h3 className="text-xl font-semibold text-slate-200">
                                Ready to Compress?
                            </h3>
                            <p className="text-slate-400 text-sm mt-1">
                                We'll optimize your document using Adobe's powerful engine.
                            </p>
                        </div>

                        <MagneticButton
                            onClick={handleCompress}
                            disabled={!file || isProcessing}
                            className="w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isProcessing ? "Compressing..." : "Compress PDF"}
                        </MagneticButton>
                    </div>
                </div>
            </div>


            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
            />
        </ToolLayout >
    );
}
