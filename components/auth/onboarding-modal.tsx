"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Rocket, Loader2, User as UserIcon, X, LogOut, Mail, RefreshCw } from "lucide-react";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { signOut, sendEmailVerification, reload } from "firebase/auth";
import { useAuth } from "@/components/auth/auth-provider";
import { cn } from "@/lib/utils";

// Placeholder for avatars
const AVATARS = [
    { id: "astronaut", src: "/avatars/astronaut.png", label: "Explorer" },
    { id: "alien", src: "/avatars/alien.png", label: "Visitor" },
    { id: "nebula", src: "/avatars/nebula.png", label: "Entity" },
    { id: "robot", src: "/avatars/robot.png", label: "Automaton" },
];

export function OnboardingModal() {
    const { user, profile, refreshProfile, isLoading: isAuthLoading } = useAuth();
    const [username, setUsername] = useState("");
    const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0].src);
    const [isLoading, setIsLoading] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    // Check if profile is missing OR incomplete (missing username)
    // IMPORTANT: Wait for isAuthLoading to be false before showing!
    const isProfileIncomplete = !isAuthLoading && !profile || (!!profile && !profile.username);
    const isOpen = !!user && isProfileIncomplete && !isDismissed && !isAuthLoading;

    const handleComplete = async () => {
        if (!user || !username) return;
        setIsLoading(true);

        try {
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                username,
                avatarUrl: selectedAvatar,
                createdAt: Date.now(),
                email: user.email
            });

            await refreshProfile(); // This updates state and closes modal
        } catch (err) {
            console.error("Error creating profile:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignOut = async () => {
        await signOut(auth);
    };

    const checkVerification = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            await user.reload();
            // If verified, force a refresh which will re-render this component
            if (user.emailVerified) {
                // Just trigger a re-render or let the user proceed
                window.location.reload();
            } else {
                alert("Email not verified yet. Please check your inbox.");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const resendVerification = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            await sendEmailVerification(user);
            setEmailSent(true);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    // Case 1: Email Not Verified
    if (user && !user.emailVerified) {
        return (
            <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md bg-[#0f172a] border border-red-500/30 rounded-2xl shadow-2xl overflow-hidden relative"
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500" />

                    <div className="p-8 text-center">
                        <div className="w-16 h-16 mx-auto bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                            <Mail className="w-8 h-8 text-red-400" />
                        </div>

                        <h2 className="text-xl font-bold text-white mb-2">Verification Required</h2>
                        <p className="text-slate-400 mb-6 text-sm">
                            Access to the Nebula is restricted. Please verify your comms link: <span className="text-white font-medium">{user.email}</span>
                        </p>

                        <div className="space-y-3">
                            <button
                                onClick={checkVerification}
                                className="w-full py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-colors flex items-center justify-center space-x-2"
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                <span>I've Verified It</span>
                            </button>

                            <button
                                onClick={resendVerification}
                                className="w-full py-2 text-sm text-emerald-400 hover:text-emerald-300"
                            >
                                {emailSent ? "Link Sent!" : "Resend Verification Link"}
                            </button>

                            <button
                                onClick={handleSignOut}
                                className="w-full py-2 text-sm text-slate-500 hover:text-slate-400"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    // Case 2: Create Profile
    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-lg bg-[#0f172a] border border-emerald-500/30 rounded-2xl shadow-2xl overflow-hidden relative"
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-cyan-500" />

                {/* Close Button (Dismiss) */}
                <button
                    onClick={() => setIsDismissed(true)}
                    className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors z-10"
                    title="Dismiss for now"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="p-8 text-center">
                    <div className="w-16 h-16 mx-auto bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
                        <Rocket className="w-8 h-8 text-emerald-400" />
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-2">Welcome to the Fleet</h2>
                    <p className="text-slate-400 mb-8">Establish your identity whenever you're ready.</p>

                    <div className="space-y-6 text-left">
                        {/* Username Input */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Codename</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="e.g. StarWalker99"
                                autoComplete="off"
                                name="nebula-username"
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 outline-none transition-all"
                            />
                        </div>

                        {/* Avatar Selection */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-3">Select Avatar</label>
                            <div className="grid grid-cols-4 gap-4">
                                {AVATARS.map((avatar) => (
                                    <button
                                        key={avatar.id}
                                        onClick={() => setSelectedAvatar(avatar.src)}
                                        className={cn(
                                            "relative rounded-full aspect-square overflow-hidden border-2 transition-all",
                                            selectedAvatar === avatar.src
                                                ? "border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)] scale-105"
                                                : "border-slate-700 hover:border-slate-500 grayscale opacity-70 hover:opacity-100 hover:grayscale-0"
                                        )}
                                    >
                                        <img src={avatar.src} alt={avatar.label} className="w-full h-full object-cover" />
                                        {selectedAvatar === avatar.src && (
                                            <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                                                <Check className="w-5 h-5 text-white drop-shadow-md" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={handleComplete}
                                disabled={!username || isLoading}
                                className="w-full py-3 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-600 text-white font-bold tracking-wide hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Initialize Profile"}
                            </button>

                            <button
                                onClick={handleSignOut}
                                className="w-full py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors text-sm flex items-center justify-center space-x-2"
                            >
                                <LogOut className="w-4 h-4" />
                                <span>Sign Out (Use as Guest)</span>
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
