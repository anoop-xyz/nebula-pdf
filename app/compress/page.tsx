"use client";

import React, { useState } from "react";
import { ToolLayout } from "@/components/layout/tool-layout";
import { FileUpload } from "@/components/ui/file-upload";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { usePDF } from "@/hooks/use-pdf";
import { useCredits } from "@/hooks/use-credits";
import { FileText, Minimize2 } from "lucide-react";
import { toast } from "sonner";
import { CreditPurchaseModal } from "@/components/payment/credit-purchase-modal";

export default function CompressPage() {
    const [file, setFile] = useState<File | null>(null);
    const { compressPDF, isProcessing, progress } = usePDF();
    const { deductCredit } = useCredits();
    const [showCreditModal, setShowCreditModal] = useState(false);

    const handleFilesSelected = (files: File[]) => {
        if (files.length > 0) {
            setFile(files[0]);
        }
    };

    const handleCompress = async () => {
        if (!file) return;

        // Check and deduct credits for 'compress'
        const hasCredit = await deductCredit('compress');

        if (!hasCredit) {
            setShowCreditModal(true);
            return;
        }

        await compressPDF(file);
    };

    return (
        <>
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
                                    We'll optimize your document using our advanced server.
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
            </ToolLayout>

            <CreditPurchaseModal
                isOpen={showCreditModal}
                onClose={() => setShowCreditModal(false)}
            />
        </>
    );
}
