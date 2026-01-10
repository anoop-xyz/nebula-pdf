import { useState, useEffect } from 'react';
import { useAuth, UserProfile } from '@/components/auth/auth-provider';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

export type ToolType = 'secure' | 'unlock';

interface CreditInfo {
    free: number;
    paid: number;
    count: number; // For backward compatibility/easy access (free + paid)
    lastReset: string;
}

const MAX_FREE_CREDITS = 3;
const RESET_PERIOD_MS = 24 * 60 * 60 * 1000; // 24 hours

export function useCredits() {
    const { user, profile, refreshProfile } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const getCredits = (tool: ToolType): CreditInfo => {
        const defaultInfo = {
            free: MAX_FREE_CREDITS,
            paid: 0,
            count: MAX_FREE_CREDITS,
            lastReset: new Date().toISOString()
        };

        if (!profile?.credits) {
            return defaultInfo;
        }

        const toolData = profile.credits[tool];
        const globalPaid = profile.credits.paid ?? 0;

        // Handling undefined toolData (e.g. new tool added)
        const free = toolData?.free ?? MAX_FREE_CREDITS;
        const lastReset = toolData?.lastReset ?? new Date().toISOString();

        return {
            free,
            paid: globalPaid,
            count: free + globalPaid,
            lastReset
        };
    };

    const getTimeUntilReset = (tool: ToolType): number => {
        const credits = getCredits(tool);
        // Reset only matters for FREE credits.
        const nextResetTime = new Date(credits.lastReset).getTime() + RESET_PERIOD_MS;
        const now = Date.now();
        return Math.max(0, nextResetTime - now);
    };

    const checkAndResetCredits = async (tool: ToolType): Promise<boolean> => {
        if (!user || !profile) return false;

        const credits = getCredits(tool);
        const timeUntilReset = getTimeUntilReset(tool);

        // Logic: If time passed AND free credits < MAX, reset FREE to MAX.
        // Never touch PAID credits here.
        if (timeUntilReset === 0 && credits.free < MAX_FREE_CREDITS) {
            const userRef = doc(db, 'users', user.uid);

            await updateDoc(userRef, {
                [`credits.${tool}.free`]: MAX_FREE_CREDITS,
                [`credits.${tool}.lastReset`]: new Date().toISOString()
            });
            return true;
        }
        return false;
    };

    const deductCredit = async (tool: ToolType): Promise<boolean> => {
        if (!user || !profile) return false;
        setIsLoading(true);

        try {
            const didReset = await checkAndResetCredits(tool);
            const currentCredits = getCredits(tool);

            // Re-evaluate after possible reset
            let free = didReset ? MAX_FREE_CREDITS : currentCredits.free;
            let paid = currentCredits.paid;
            let lastReset = didReset ? new Date().toISOString() : currentCredits.lastReset;

            let usedFree = false;
            let usedPaid = false;

            // Logic: Burn FREE first.
            if (free > 0) {
                // If we are at MAX, start the timer now
                if (free === MAX_FREE_CREDITS) {
                    lastReset = new Date().toISOString();
                }
                free--;
                usedFree = true;
            }
            // If no FREE, burn PAID
            else if (paid > 0) {
                paid--;
                usedPaid = true;
            }
            else {
                return false; // No credits at all
            }

            const userRef = doc(db, 'users', user.uid);

            // Construct update object based on what was used
            const updates: any = {};
            if (usedFree) {
                updates[`credits.${tool}.free`] = free;
                updates[`credits.${tool}.lastReset`] = lastReset;
            }
            if (usedPaid) {
                updates[`credits.paid`] = paid;
            }

            await updateDoc(userRef, updates);
            return true;

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
