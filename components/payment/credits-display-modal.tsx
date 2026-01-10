"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Coins, Zap, Clock } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { useCredits } from "@/hooks/use-credits";

interface CreditsDisplayModalProps {
    isOpen: boolean;
    onClose: () => void;
    onTopUp: () => void;
}

export function CreditsDisplayModal({ isOpen, onClose, onTopUp }: CreditsDisplayModalProps) {
    const { profile } = useAuth();
    const { getCredits } = useCredits();

    // We scan all tools to see free credits status, or just pick 'secure' as representative
    // Since free credits are per-tool, let's just show a summary or specific ones.
    // For simplicity, we show 'Global Paid' and 'General Free' status.
    const secureCredits = getCredits('secure');

    const paidCredits = profile?.credits?.paid || 0;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-xs bg-[#0f172a] border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle className="flex items-center space-x-2">
                        <Coins className="w-5 h-5 text-purple-400" />
                        <span>My Credits</span>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* Paid Credits Card */}
                    <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-purple-200">Premium Credits</span>
                            <Zap className="w-4 h-4 text-purple-400" />
                        </div>
                        <div className="flex items-end items-baseline space-x-2">
                            <span className="text-3xl font-bold text-white">{paidCredits}</span>
                            <span className="text-xs text-purple-300">credits</span>
                        </div>
                        <p className="text-[10px] text-purple-300/60 mt-1">Never expire. Usable on all premium tools.</p>
                    </div>

                    {/* Free Credits Summary */}
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-200">Daily Free Credits</span>
                            <Clock className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-400">Unlock / Protect</span>
                                <span className="text-white">{secureCredits.free} / 3 left</span>
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-2">Resets every 24 hours.</p>
                    </div>

                    <Button
                        onClick={() => {
                            onClose();
                            onTopUp();
                        }}
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border-none"
                    >
                        Get More Credits
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
