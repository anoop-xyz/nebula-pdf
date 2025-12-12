import { useState, useEffect } from 'react';
import { useAuth, UserProfile } from '@/components/auth/auth-provider';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

export type ToolType = 'secure' | 'unlock';

interface CreditInfo {
    count: number;
    lastReset: string;
}

const MAX_CREDITS = 3;
const RESET_PERIOD_MS = 24 * 60 * 60 * 1000; // 24 hours

export function useCredits() {
    const { user, profile, refreshProfile } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const getCredits = (tool: ToolType): CreditInfo => {
        if (!profile?.credits?.[tool]) {
            // Default if undefined
            return { count: MAX_CREDITS, lastReset: new Date().toISOString() };
        }
        return profile.credits[tool];
    };

    const getTimeUntilReset = (tool: ToolType): number => {
        const credits = getCredits(tool);
        // If we have credits, no timer needed effectively, but logic is primarily for when count < MAX
        // Actually, timer counts down from lastReset + 24h
        const nextResetTime = new Date(credits.lastReset).getTime() + RESET_PERIOD_MS;
        const now = Date.now();
        return Math.max(0, nextResetTime - now);
    };

    const checkAndResetCredits = async (tool: ToolType): Promise<boolean> => {
        if (!user || !profile) return false;

        const credits = getCredits(tool);
        const timeUntilReset = getTimeUntilReset(tool);

        // Usage Logic:
        // 1. If timeUntilReset == 0 (meaning 24h passed), reset to MAX_CREDITS.
        // 2. We only persist the reset when they try to use it or we detect it, 
        //    to avoid constant writes. But here we can do it on load or check.

        if (timeUntilReset === 0 && credits.count < MAX_CREDITS) {
            // It's time to reset!
            const userRef = doc(db, 'users', user.uid);
            const now = new Date().toISOString();

            await updateDoc(userRef, {
                [`credits.${tool}`]: {
                    count: MAX_CREDITS,
                    lastReset: now // Reset timer starts NOW? Or from previous? 
                    // Requirement: "regenerates to 3 after 24hrs". 
                    // Usually this implies a daily rolling window or reset from last expiry.
                    // For simplicity and standard logic: Reset timestamp becomes Now.
                }
            });
            return true; // Reset happened
        }
        return false;
    };

    const deductCredit = async (tool: ToolType): Promise<boolean> => {
        if (!user || !profile) return false;
        setIsLoading(true);

        try {
            // Ensure strictly up to date
            const didReset = await checkAndResetCredits(tool);
            // If we reset, we have MAX_CREDITS. If not, we use current local/profile state.
            // Since refreshProfile isn't instant, we might need to rely on the calc.

            // Re-calc after potential reset
            let currentCount = didReset ? MAX_CREDITS : getCredits(tool).count;
            const currentLastReset = getCredits(tool).lastReset;

            if (currentCount > 0) {
                const userRef = doc(db, 'users', user.uid);

                // If this is the FIRST use after a full reset (i.e. we are at MAX), 
                // we should set the 'lastReset' timer start NOW.
                // If we are already mid-cycle (e.g. 2/3), keep old timer.
                // Requirement: "24-hour timer will be tracked from the first use after a full reset"

                let newLastReset = currentLastReset;
                if (currentCount === MAX_CREDITS) {
                    newLastReset = new Date().toISOString();
                }

                await updateDoc(userRef, {
                    [`credits.${tool}`]: {
                        count: currentCount - 1,
                        lastReset: newLastReset
                    }
                });
                return true;
            } else {
                return false; // No credits
            }
        } catch (error) {
            console.error("Error deducting credit:", error);
            toast.error("Failed to process credit.");
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        getCredits,
        getTimeUntilReset,
        checkAndResetCredits,
        deductCredit,
        isLoading
    };
}
