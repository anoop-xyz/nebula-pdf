"use client";

import React, { useState, useEffect } from "react";
import { ToolLayout } from "@/components/layout/tool-layout";
import { FileUpload } from "@/components/ui/file-upload";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { usePDF } from "@/hooks/use-pdf";
import { Lock, Unlock, KeyRound } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { useCredits } from "@/hooks/use-credits";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AuthModal } from "@/components/auth/auth-modal";
import { CreditPurchaseModal } from "@/components/payment/credit-purchase-modal";

export default function UnlockPage() {
    const [file, setFile] = useState<File | null>(null);
    const [password, setPassword] = useState("");
    const { unlockPDF, isProcessing, error, progress } = usePDF();
    const { user } = useAuth();
    const { getCredits, deductCredit } = useCredits();
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
    const router = useRouter();

    // Protect Route
    useEffect(() => {
        // If loading profile... maybe wait? But simple check:
        // Logic handled by wrapping action mainly, but good to kick guest out or show login
        // But user preferred redirect to login if guest
        if (!user && !isProcessing) { // Simple check, might need isLoading from auth
            // Optional: setIsAuthModalOpen(true) or router.push('/')
        }
    }, [user]);

    const handleFilesSelected = (files: File[]) => {
        if (files.length > 0) {
            setFile(files[0]);
            setPassword("");
        }
    };

    const handleUnlock = async () => {
        if (!file || !password) return;

        if (!user) {
            setIsAuthModalOpen(true);
            return;
        }

        const credits = getCredits("unlock");
        if (credits.count <= 0) {
            toast("Daily limit reached", {
                description: "Buy credits to continue instantly.",
                action: {
                    label: "Get Credits",
                    onClick: () => setIsPurchaseModalOpen(true)
                }
            });
            setIsPurchaseModalOpen(true);
            return;
        }

        const success = await unlockPDF(file, password);
        if (success) {
            await deductCredit("unlock");
            toast.success("Credit used. PDF Unlocked!");
        }
    };

    return (
        <ToolLayout
            title="Unlock PDF"
            description="Remove passwords and restrictions from your PDF files."
            isLoading={isProcessing}
            progress={progress}
        >
            <div className="max-w-xl mx-auto space-y-8">
                <FileUpload
                    onFilesSelected={handleFilesSelected}
                    multiple={false}
                    accept={{ "application/pdf": [".pdf"] }}
                />

                {file && (
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 flex flex-col items-center text-center space-y-6 animate-in fade-in slide-in-from-bottom-4">
                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center relative">
                            <Lock className="w-10 h-10 text-primary" />
                            <div className="absolute -bottom-2 -right-2 bg-slate-900 rounded-full p-2 border border-slate-700">
                                <KeyRound className="w-5 h-5 text-slate-400" />
                            </div>
                        </div>

                        <div className="w-full">
                            <h3 className="text-xl font-medium text-slate-200 mb-2">{file.name}</h3>
                            <p className="text-slate-400 text-sm mb-6">
                                Enter the document password to unlock it permanently.
                            </p>

                            <div className="max-w-xs mx-auto space-y-4">
                                <input
                                    type="password"
                                    placeholder="Enter PDF Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 text-center"
                                />

                                <MagneticButton
                                    onClick={handleUnlock}
                                    disabled={!password || isProcessing}
                                    className="w-full"
                                >
                                    {isProcessing ? "Unlocking..." : "Unlock PDF"}
                                </MagneticButton>
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                                {error}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
            <CreditPurchaseModal isOpen={isPurchaseModalOpen} onClose={() => setIsPurchaseModalOpen(false)} />
        </ToolLayout>
    );
}
