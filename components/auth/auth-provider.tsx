"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

interface UserProfile {
    uid: string;
    username: string;
    avatarUrl: string;
    createdAt: number;
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

    const fetchProfile = async (uid: string) => {
        try {
            const docRef = doc(db, "users", uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const profileData = docSnap.data() as UserProfile;
                setProfile(profileData);
                // Cache profile locally
                localStorage.setItem("nebula_profile", JSON.stringify(profileData));
            } else {
                setProfile(null);
                localStorage.removeItem("nebula_profile");
            }
        } catch (error: any) {
            console.warn("Profile fetch failed:", error.message);
        }
    };

    useEffect(() => {
        // Try to load from cache first
        const cached = localStorage.getItem("nebula_profile");
        if (cached) {
            try {
                setProfile(JSON.parse(cached));
            } catch (e) {
                console.error("Failed to parse cached profile", e);
            }
        }

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                // If we have a cached profile for this user, we might be good, but we should verify/update
                // Checking if cached profile matches current user would be ideal but simple overwrite is okay for now
                await fetchProfile(currentUser.uid);
            } else {
                setProfile(null);
                localStorage.removeItem("nebula_profile");
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const refreshProfile = async () => {
        if (user) {
            await fetchProfile(user.uid);
        }
    };

    return (
        <AuthContext.Provider value={{ user, profile, isLoading, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
}
