"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, sendEmailVerification } from "firebase/auth";
import { auth } from "@/lib/firebase"; // Ensure this matches your export
import { cn } from "@/lib/utils";

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [verificationSent, setVerificationSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            if (isLogin) {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                // Optional: Block if email not verified
                // if (!userCredential.user.emailVerified) {
                //     setError("Please verify your email address.");
                //     return;
                // }
                onClose();
            } else {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await sendEmailVerification(userCredential.user);
                setVerificationSent(true);
            }
        } catch (err: any) {
            console.error(err);
            let msg = "An error occurred.";
            if (err.code === 'auth/invalid-credential') msg = "Invalid email or password.";
            if (err.code === 'auth/email-already-in-use') msg = "Email already in use.";
            if (err.code === 'auth/weak-password') msg = "Password should be at least 6 characters.";
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        setError(null);
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
            onClose();
        } catch (err: any) {
            console.error("Google Sign-In Error:", err.code, err.message);
            setError("Google Sign-In failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md"
                        onClick={onClose}
                    />

                    {/* Modal Container */}
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="w-full max-w-md pointer-events-auto"
                        >
                            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0f172a]/80 shadow-2xl backdrop-blur-xl">
                                {/* Close Button */}
                                <button
                                    onClick={onClose}
                                    className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>

                                {/* Decoration */}
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-cyan-500 to-emerald-500" />

                                <div className="p-8">
                                    {verificationSent ? (
                                        <div className="text-center space-y-6">
                                            <div className="w-16 h-16 mx-auto bg-emerald-500/10 rounded-full flex items-center justify-center">
                                                <Mail className="w-8 h-8 text-emerald-400" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold text-white mb-2">Check your credentials</h2>
                                                <p className="text-slate-400 text-sm">
                                                    We've sent a verification link to <span className="text-emerald-400">{email}</span>. Please verify your comms link to access the nebula.
                                                </p>
                                            </div>
                                            <button
                                                onClick={onClose}
                                                className="w-full py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white transition-colors"
                                            >
                                                I've Verified It
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Header */}
                                            <div className="text-center mb-8">
                                                <h2 className="text-2xl font-bold text-white mb-2">
                                                    {isLogin ? "Welcome Back" : "Join the Nebula"}
                                                </h2>
                                                <p className="text-slate-400 text-sm">
                                                    {isLogin ? "Enter your credentials to access your space." : "Create your account to start your journey."}
                                                </p>
                                            </div>

                                            {/* Form */}
                                            <form onSubmit={handleSubmit} className="space-y-4">
                                                <div className="space-y-2">
                                                    <div className="relative group">
                                                        <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                                                        <input
                                                            type="email"
                                                            placeholder="Email Address"
                                                            required
                                                            value={email}
                                                            onChange={(e) => setEmail(e.target.value)}
                                                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-10 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all font-sans"
                                                        />
                                                    </div>
                                                    <div className="relative group">
                                                        <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                                                        <input
                                                            type="password"
                                                            placeholder="Password"
                                                            required
                                                            value={password}
                                                            onChange={(e) => setPassword(e.target.value)}
                                                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-10 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all font-sans"
                                                        />
                                                    </div>
                                                </div>

                                                {error && (
                                                    <p className="text-red-400 text-xs text-center">{error}</p>
                                                )}

                                                <button
                                                    type="submit"
                                                    disabled={isLoading}
                                                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 text-white font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                                                >
                                                    {isLoading ? (
                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                    ) : (
                                                        <>
                                                            <span>{isLogin ? "Sign In" : "Create Account"}</span>
                                                            <ArrowRight className="w-4 h-4" />
                                                        </>
                                                    )}
                                                </button>
                                            </form>

                                            {/* Divider */}
                                            <div className="relative my-6">
                                                <div className="absolute inset-0 flex items-center">
                                                    <div className="w-full border-t border-white/10"></div>
                                                </div>
                                                <div className="relative flex justify-center text-xs uppercase">
                                                    <span className="bg-[#0f172a] px-2 text-slate-500">Or continue with</span>
                                                </div>
                                            </div>

                                            {/* Google Button */}
                                            <button
                                                onClick={handleGoogleSignIn}
                                                disabled={isLoading}
                                                className="w-full py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center space-x-2 text-slate-300 hover:text-white"
                                            >
                                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                                    <path
                                                        fill="currentColor"
                                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                                    />
                                                    <path
                                                        fill="currentColor"
                                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                                    />
                                                    <path
                                                        fill="currentColor"
                                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                                    />
                                                    <path
                                                        fill="currentColor"
                                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                                    />
                                                </svg>
                                                <span>Google</span>
                                            </button>

                                            {/* Toggle */}
                                            <div className="mt-6 text-center text-sm">
                                                <span className="text-slate-400">
                                                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                                                </span>
                                                <button
                                                    onClick={() => setIsLogin(!isLogin)}
                                                    className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                                                >
                                                    {isLogin ? "Sign up" : "Sign in"}
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
