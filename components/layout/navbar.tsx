"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Menu, X, Rocket, User, LogOut, Coins, Clock } from "lucide-react";
import { AuthModal } from "@/components/auth/auth-modal";
import { CreditPurchaseModal } from "@/components/payment/credit-purchase-modal";
import { CreditsDisplayModal } from "@/components/payment/credits-display-modal";
import { useAuth } from "@/components/auth/auth-provider";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
    const [isCreditsModalOpen, setIsCreditsModalOpen] = useState(false);
    const pathname = usePathname();
    const { user, profile } = useAuth();
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const handleSignOut = async () => {
        await signOut(auth);
        setShowDropdown(false);
        setIsMobileMenuOpen(false);
    };

    const navLinks = [
        { name: "Instagram", href: "https://instagram.com/anoop__xyz", external: true },
        { name: "GitHub", href: "https://github.com/anoop-xyz", external: true },
        { name: "LinkedIn", href: "https://www.linkedin.com/in/anoopkumar-dev/", external: true },
        { name: "Mail", href: "mailto:therealanoopkumar@gmail.com", external: true },
    ];

    return (
        <>
            <motion.nav
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                className={cn(
                    "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-transparent",
                    isScrolled ? "bg-[#030712]/60 backdrop-blur-xl border-white/10" : "bg-transparent"
                )}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link href="/" className="flex items-center space-x-2 group">
                            <div className="relative flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-xl overflow-hidden group-hover:scale-105 transition-transform duration-300">
                                <img src="/nebula-logo.png" alt="Nebula PDF" className="w-full h-full object-contain" />
                            </div>
                            <span
                                className={cn(
                                    "text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 font-serif tracking-tight transition-all duration-300",
                                    pathname === "/" && !isScrolled ? "opacity-0 -translate-x-4 pointer-events-none" : "opacity-100 translate-x-0"
                                )}
                            >
                                Nebula PDF
                            </span>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center space-x-8">
                            {navLinks.map((link) => (
                                link.external ? (
                                    <a
                                        key={link.name}
                                        href={link.href}
                                        target={link.href.startsWith("mailto") ? undefined : "_blank"}
                                        rel={link.href.startsWith("mailto") ? undefined : "noopener noreferrer"}
                                        className="text-sm font-medium text-slate-400 transition-colors hover:text-emerald-400"
                                    >
                                        {link.name}
                                    </a>
                                ) : (
                                    <Link
                                        key={link.name}
                                        href={link.href}
                                        className={cn(
                                            "text-sm font-medium transition-colors hover:text-emerald-400",
                                            pathname === link.href ? "text-emerald-400" : "text-slate-400"
                                        )}
                                    >
                                        {link.name}
                                    </Link>
                                )
                            ))}
                        </div>

                        {/* Auth Section (Desktop) */}
                        <div className="hidden md:flex items-center">
                            {user ? (
                                <div className="flex items-center">
                                    {/* Coins / Credits Button */}
                                    <button
                                        onClick={() => setIsPurchaseModalOpen(true)}
                                        className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-colors mr-3 group"
                                    >
                                        <Coins className="w-4 h-4 text-purple-400 group-hover:text-purple-300" />
                                        <span className="text-sm font-medium text-purple-200">Get Credits</span>
                                    </button>

                                    {/* Profile Button */}
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowDropdown(!showDropdown)}
                                            className="flex items-center space-x-3 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                                        >
                                            {profile?.avatarUrl ? (
                                                <img src={profile.avatarUrl} alt="Avatar" className="w-7 h-7 rounded-full object-cover border border-emerald-500/50" />
                                            ) : (
                                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500" />
                                            )}
                                            <span className="text-sm font-medium text-slate-200">{profile?.username || "Commander"}</span>
                                        </button>

                                        {/* Dropdown */}
                                        <AnimatePresence>
                                            {showDropdown && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: 10 }}
                                                    className="absolute right-0 mt-2 w-48 rounded-xl border border-white/10 bg-[#0f172a]/95 backdrop-blur-xl shadow-xl overflow-hidden"
                                                >
                                                    <div className="p-3 border-b border-white/5">
                                                        <p className="text-xs text-slate-500">Signed in as</p>
                                                        <p className="text-sm font-medium text-white truncate">{user.email}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            setShowDropdown(false);
                                                            setIsCreditsModalOpen(true);
                                                        }}
                                                        className="w-full flex items-center space-x-2 px-4 py-3 text-sm text-purple-400 hover:bg-white/5 transition-colors text-left"
                                                    >
                                                        <Coins className="w-4 h-4" />
                                                        <span>My Credits</span>
                                                    </button>
                                                    {(!profile || !profile.username) && (
                                                        <button
                                                            onClick={() => window.location.reload()}
                                                            className="w-full flex items-center space-x-2 px-4 py-3 text-sm text-emerald-400 hover:bg-white/5 transition-colors text-left"
                                                        >
                                                            <User className="w-4 h-4" />
                                                            <span>Complete Profile</span>
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={handleSignOut}
                                                        className="w-full flex items-center space-x-2 px-4 py-3 text-sm text-red-400 hover:bg-white/5 transition-colors text-left"
                                                    >
                                                        <LogOut className="w-4 h-4" />
                                                        <span>Sign Out</span>
                                                    </button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setIsAuthModalOpen(true)}
                                    className="flex items-center space-x-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-emerald-500/50 transition-all duration-300 group"
                                >
                                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 flex items-center justify-center">
                                        <User className="w-3.5 h-3.5 text-white" />
                                    </div>
                                    <span className="text-sm font-medium text-slate-200 group-hover:text-white">Sign In</span>
                                </button>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="md:hidden">
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="md:hidden bg-[#030712]/95 backdrop-blur-xl border-b border-white/10"
                        >
                            <div className="px-4 pt-4 pb-6 space-y-4">
                                {navLinks.map((link) => (
                                    link.external ? (
                                        <a
                                            key={link.name}
                                            href={link.href}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            target={link.href.startsWith("mailto") ? undefined : "_blank"}
                                            rel={link.href.startsWith("mailto") ? undefined : "noopener noreferrer"}
                                            className="block text-base font-medium text-slate-400 hover:text-emerald-400 transition-colors"
                                        >
                                            {link.name}
                                        </a>
                                    ) : (
                                        <Link
                                            key={link.name}
                                            href={link.href}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="block text-base font-medium text-slate-400 hover:text-emerald-400 transition-colors"
                                        >
                                            {link.name}
                                        </Link>
                                    )
                                ))}

                                {/* Mobile Auth */}
                                {user ? (
                                    <div className="pt-4 border-t border-white/10 space-y-3">
                                        <div className="flex items-center space-x-3 px-2">
                                            {profile?.avatarUrl ? (
                                                <img src={profile.avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full object-cover border border-emerald-500/50" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500" />
                                            )}
                                            <div>
                                                <p className="text-sm font-medium text-white">{profile?.username || "Commander"}</p>
                                                <p className="text-xs text-slate-500">{user.email}</p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => {
                                                setIsMobileMenuOpen(false);
                                                setIsPurchaseModalOpen(true);
                                            }}
                                            className="w-full flex items-center space-x-2 px-2 py-2 text-purple-400 hover:bg-white/5 rounded-lg transition-colors"
                                        >
                                            <Coins className="w-4 h-4" />
                                            <span>Get Credits</span>
                                        </button>

                                        <button
                                            onClick={() => {
                                                setIsMobileMenuOpen(false);
                                                setIsCreditsModalOpen(true);
                                            }}
                                            className="w-full flex items-center space-x-2 px-2 py-2 text-indigo-400 hover:bg-white/5 rounded-lg transition-colors"
                                        >
                                            <Clock className="w-4 h-4" />
                                            <span>My Credits</span>
                                        </button>

                                        <button
                                            onClick={handleSignOut}
                                            className="w-full flex items-center space-x-2 px-2 py-2 text-red-400 hover:bg-white/5 rounded-lg transition-colors"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            <span>Sign Out</span>
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setIsMobileMenuOpen(false);
                                            setIsAuthModalOpen(true);
                                        }}
                                        className="w-full mt-4 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-medium"
                                    >
                                        <User className="w-4 h-4" />
                                        <span>Sign In</span>
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Credits Display Modal */}
                <CreditsDisplayModal
                    isOpen={isCreditsModalOpen}
                    onClose={() => setIsCreditsModalOpen(false)}
                    onTopUp={() => setIsPurchaseModalOpen(true)}
                />



                {/* Auth Modal */}
                <AuthModal
                    isOpen={isAuthModalOpen}
                    onClose={() => setIsAuthModalOpen(false)}
                />

                {/* Credit Purchase Modal */}
                <CreditPurchaseModal
                    isOpen={isPurchaseModalOpen}
                    onClose={() => setIsPurchaseModalOpen(false)}
                />
            </motion.nav>
        </>
    );
}
