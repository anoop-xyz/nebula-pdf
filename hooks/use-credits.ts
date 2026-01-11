import { useState } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

export type ToolType = 'secure' | 'unlock' | 'compress';

interface CreditInfo {
    free: number;
    paid: number;
    count: number;
    lastReset: string;
}

const MAX_FREE_CREDITS = 3;
const RESET_PERIOD_MS = 24 * 60 * 60 * 1000; // 24 hours

export function useCredits() {
    const { user, profile } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const getCredits = (tool?: ToolType): CreditInfo => {
        const defaultInfo = {
            free: MAX_FREE_CREDITS,
            paid: 0,
            count: MAX_FREE_CREDITS,
            lastReset: new Date().toISOString()
        };

        if (!profile?.credits) {
            return defaultInfo;
        }

        // Use global free/paid credits
        // Fallback to MAX if undefined (handles migration naturally for new global key)
        const free = profile.credits.free ?? MAX_FREE_CREDITS;
        const paid = profile.credits.paid ?? 0;
        const lastReset = profile.credits.lastReset ?? new Date().toISOString();

        return {
            free,
            paid: paid,
            count: free + paid,
            lastReset
        };
    };

    const getTimeUntilReset = (tool?: ToolType): number => {
        const credits = getCredits();
        const nextResetTime = new Date(credits.lastReset).getTime() + RESET_PERIOD_MS;
        const now = Date.now();
        return Math.max(0, nextResetTime - now);
    };

    const checkAndResetCredits = async (tool?: ToolType): Promise<boolean> => {
        if (!user || !profile) return false;

        const credits = getCredits();
        const timeUntilReset = getTimeUntilReset();

        // If time passed AND free credits < MAX, reset FREE to MAX.
        if (timeUntilReset === 0 && credits.free < MAX_FREE_CREDITS) {
            const userRef = doc(db, 'users', user.uid);

            await updateDoc(userRef, {
                'credits.free': MAX_FREE_CREDITS,
                'credits.lastReset': new Date().toISOString()
            });
            return true;
        }
        return false;
    };

    const deductCredit = async (tool?: ToolType): Promise<boolean> => {
        if (!user || !profile) return false;
        setIsLoading(true);

        try {
            // Check global reset
            const didReset = await checkAndResetCredits();
            const currentCredits = getCredits();

            let free = didReset ? MAX_FREE_CREDITS : currentCredits.free;
            let paid = currentCredits.paid;
            let lastReset = didReset ? new Date().toISOString() : currentCredits.lastReset;

            let usedFree = false;
            let usedPaid = false;

            if (free > 0) {
                if (free === MAX_FREE_CREDITS) {
                    lastReset = new Date().toISOString();
                }
                free--;
                usedFree = true;
            } else if (paid > 0) {
                paid--;
                usedPaid = true;
            } else {
                return false; // No credits at all
            }

            const userRef = doc(db, 'users', user.uid);

            // Construct update
            const updates: any = {};
            if (usedFree) {
                updates['credits.free'] = free;
                updates['credits.lastReset'] = lastReset;
            }
            if (usedPaid) {
                updates['credits.paid'] = paid;
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
