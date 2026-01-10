"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export interface UserProfile {
    uid: string;
    email: string | null;
    username?: string;
    fullName?: string;
    avatarUrl?: string; // URL to Firebase Storage or Google Photo
    createdAt?: any;
    credits?: {
        paid?: number; // Global paid credits for all tools
        secure?: {
            free: number;
            lastReset: string;
        };
        unlock?: {
            free: number;
            lastReset: string;
        };
        compress?: {
            free: number;
            lastReset: string;
        };
    };
}

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    isLoading: boolean;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    isLoading: true,
    refreshProfile: async () => { },
});

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Real-time listener reference
    useEffect(() => {
        let unsubscribeProfile = () => { };

        // Try to load from cache first
        const cached = localStorage.getItem("nebula_profile");
        if (cached) {
            try {
                setProfile(JSON.parse(cached));
            } catch (e) {
                console.error("Failed to parse cached profile", e);
            }
        }

        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);

            // Unsubscribe from previous profile if exists
            unsubscribeProfile();

            if (currentUser) {
                // Set up real-time listener for profile
                const docRef = doc(db, "users", currentUser.uid);
                unsubscribeProfile = onSnapshot(docRef, (docSnap) => {
                    if (docSnap.exists()) {
                        const profileData = docSnap.data() as UserProfile;
                        setProfile(profileData);
                        localStorage.setItem("nebula_profile", JSON.stringify(profileData));
                    } else {
                        setProfile(null);
                        localStorage.removeItem("nebula_profile");
                    }
                    setIsLoading(false);
                }, (error) => {
                    console.warn("Profile sync failed:", error.message);
                    setIsLoading(false);
                });
            } else {
                setProfile(null);
                localStorage.removeItem("nebula_profile");
                setIsLoading(false);
            }
        });

        return () => {
            unsubscribeAuth();
            unsubscribeProfile();
        };
    }, []);

    // Manual refresh is no longer needed with onSnapshot, but keeping for compatibility
    const refreshProfile = async () => {
        // No-op: Profile sync is real-time now
    };

    return (
        <AuthContext.Provider value={{ user, profile, isLoading, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
}
