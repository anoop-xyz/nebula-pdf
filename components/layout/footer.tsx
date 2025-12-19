import Link from "next/link";
import { policyConfig } from "./policy-layout";

export function Footer() {
    return (
        <footer className="border-t border-slate-800/50 bg-slate-950/20 backdrop-blur-md py-12 px-8 z-10 relative">
            <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-slate-500">
                <div className="flex flex-col gap-2 text-center md:text-left">
                    <span className="font-semibold text-slate-300">{policyConfig.companyName}</span>
                    <span>&copy; {new Date().getFullYear()} All rights reserved.</span>
                </div>

                <div className="flex flex-wrap justify-center gap-6">
                    <Link href="/policies/privacy" className="hover:text-slate-300 transition-colors">Privacy</Link>
                    <Link href="/policies/terms" className="hover:text-slate-300 transition-colors">Terms</Link>
                    <Link href="/policies/refund" className="hover:text-slate-300 transition-colors">Refunds</Link>
                    <Link href="/policies/shipping" className="hover:text-slate-300 transition-colors">Shipping</Link>
                    <Link href="/policies/contact" className="hover:text-slate-300 transition-colors">Contact</Link>
                </div>
            </div>
        </footer>
    );
}
