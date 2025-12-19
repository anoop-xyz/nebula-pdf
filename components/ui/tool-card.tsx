"use client";

import Link from "next/link";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { Coins, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/auth-provider";
import { useCredits, ToolType } from "@/hooks/use-credits";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthModal } from "@/components/auth/auth-modal";
import { CreditPurchaseModal } from "@/components/payment/credit-purchase-modal";

export interface Tool {
    title: string;
    description: string;
    icon: any;
    href: string;
    color: string;
    span: string;
}

export function ToolCard({ tool }: { tool: Tool }) {
    const { user } = useAuth();
    const { getCredits, getTimeUntilReset } = useCredits();
    const router = useRouter();
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

    // Helper to format time remaining
    const formatTime = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    let creditInfo = null;
    let toolType: ToolType | null = null;
    let isLocked = false;
    let timeRemaining = 0;

    if (tool.href === "/secure") toolType = "secure";
    if (tool.href === "/unlock") toolType = "unlock";

    if (toolType) {
        const credits = getCredits(toolType);
        timeRemaining = getTimeUntilReset(toolType);
        isLocked = credits.count <= 0 && timeRemaining > 0;

        creditInfo = (
            <div className="flex items-center space-x-2 text-xs font-mono bg-slate-900/50 rounded-full px-2 py-1 border border-slate-700/50">
                <Coins className={cn("w-3 h-3", isLocked ? "text-red-400" : "text-yellow-400")} />
                <span className={isLocked ? "text-red-400" : "text-slate-300"}>
                    {credits.count}/3
                </span>
            </div>
        );
    }

    const handleClick = (e: React.MouseEvent) => {
        if (!toolType) return; // Normal navigation for free tools

        e.preventDefault();

        if (!user) {
            setIsAuthModalOpen(true);
            return;
        }

        if (isLocked) {
            toast("Daily limit reached", {
                description: "Buy credits to continue instantly or wait for reset.",
                action: {
                    label: "Buy Credits",
                    onClick: () => setIsPurchaseModalOpen(true)
                }
            });
            setIsPurchaseModalOpen(true);
            return;
        }

        router.push(tool.href);
    }

    // Wrap content 
    const CardContent = (
        <SpotlightCard
            className={cn("h-full flex flex-col justify-between group/card cursor-pointer", isLocked && "opacity-75")}
            spotlightColor={tool.color}
        >
            <div className="space-y-4">
                <div className="flex justify-between items-start">
                    <div className="p-3 w-fit rounded-lg bg-slate-800/50 border border-slate-700/50 group-hover/card:border-slate-600 transition-colors">
                        <tool.icon className="w-6 h-6 text-slate-200" />
                    </div>
                    {creditInfo}
                </div>
                <div>
                    <h2 className="text-xl font-semibold text-slate-100 mb-2">
                        {tool.title}
                    </h2>
                    <p className="text-slate-400 text-sm">
                        {tool.description}
                    </p>
                </div>
            </div>

            <div className="mt-6 flex items-center justify-between text-sm font-medium text-slate-500 group-hover/card:text-slate-300 transition-colors">
                <div className="flex items-center">
                    Open Tool <Wand2 className="w-4 h-4 ml-2 opacity-0 -translate-x-2 group-hover/card:opacity-100 group-hover/card:translate-x-0 transition-all" />
                </div>
                {isLocked && <span className="text-xs text-red-400">{formatTime(timeRemaining)}</span>}
            </div>
        </SpotlightCard>
    );

    return (
        <>
            {toolType ? (
                <div onClick={handleClick} className={tool.span}>
                    {CardContent}
                </div>
            ) : (
                <Link href={tool.href} className={tool.span}>
                    {CardContent}
                </Link>
            )}

            <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
            <CreditPurchaseModal isOpen={isPurchaseModalOpen} onClose={() => setIsPurchaseModalOpen(false)} />
        </>
    );
}
