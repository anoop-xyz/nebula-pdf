"use client";

import React, { useState, useEffect } from "react";
import { ToolLayout } from "@/components/layout/tool-layout";
import { FileUpload } from "@/components/ui/file-upload";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { usePDF } from "@/hooks/use-pdf";
import { Shield, Lock, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/auth-provider";
import { useCredits } from "@/hooks/use-credits";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AuthModal } from "@/components/auth/auth-modal";

export default function SecurePage() {
    const [file, setFile] = useState<File | null>(null);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const { protectPDF, isProcessing } = usePDF();
    const { user } = useAuth();
    const { getCredits, deductCredit } = useCredits();
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const router = useRouter();

    // Protect Route via Effect (Optional but good backup)
    useEffect(() => {
        if (!user && !isProcessing) {
            // Optional: setIsAuthModalOpen(true)
        }
    }, [user, isProcessing]);

    const passwordsMatch = password.length > 0 && password === confirmPassword;

    const handleFilesSelected = (files: File[]) => {
        if (files.length > 0) {
            setFile(files[0]);
        }
    };

    const handleProtect = async () => {
        if (!file || !passwordsMatch) return;

        if (!user) {
            setIsAuthModalOpen(true);
            return;
        }

        const credits = getCredits("secure");
        if (credits.count <= 0) {
            toast.error("Daily limit reached for Secure PDF.");
            return;
        }

        const success = await protectPDF(file, password);
        if (success) {
            await deductCredit("secure");
            toast.success("Credit used. PDF Encrypted!");
        }
    };

    return (
        <ToolLayout
            title="Secure PDF"
            description="Encrypt your PDF with a password to prevent unauthorized access."
            isLoading={isProcessing}
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
                                <Shield className="w-8 h-8 text-primary" />
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

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">
                                Create Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter password"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-slate-600"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-slate-300">
                                    Confirm Password
                                </label>
                                {passwordsMatch && (
                                    <span className="flex items-center text-xs text-green-400 font-medium">
                                        <Check className="w-3 h-3 mr-1" /> Match
                                    </span>
                                )}
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm password"
                                    className={cn(
                                        "w-full bg-slate-900 border rounded-lg py-2 pl-10 pr-4 text-slate-200 focus:outline-none focus:ring-2 placeholder:text-slate-600",
                                        passwordsMatch
                                            ? "border-green-500/50 focus:ring-green-500/50"
                                            : "border-slate-700 focus:ring-primary/50"
                                    )}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center border-l border-slate-800 pl-8 min-h-[300px]">
                    <div className="text-center space-y-6">
                        <div className="w-32 h-40 bg-slate-800 rounded-lg border-2 border-dashed border-slate-700 flex items-center justify-center mx-auto">
                            <Shield className="w-12 h-12 text-slate-600" />
                        </div>

                        <div>
                            <h3 className="text-xl font-semibold text-slate-200">
                                Ready to Protect?
                            </h3>
                            <p className="text-slate-400 text-sm mt-1">
                                The file will be encrypted with AES-256.
                            </p>
                        </div>

                        <MagneticButton
                            onClick={handleProtect}
                            disabled={!file || !passwordsMatch || isProcessing}
                            className="w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isProcessing ? "Encrypting..." : "Encrypt & Download"}
                        </MagneticButton>
                    </div>
                </div>
            </div>

            <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
        </ToolLayout>
    );
}
