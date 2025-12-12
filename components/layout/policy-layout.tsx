import Link from "next/link";
import { cn } from "@/lib/utils";

export const policyConfig = {
    companyName: "Nebula PDF",
    contactEmail: "therealanoopkumar@gmail.com",
    address: "Papireddynagar, near Assbestas Colony, Jagathgirigutta and Balanagar",
};

export default function PolicyLayout({ title, children }: { title: string, children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-slate-950 relative overflow-hidden font-sans selection:bg-purple-500/30">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-purple-500/10 blur-[120px] rounded-full" />
                <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] bg-blue-500/10 blur-[100px] rounded-full" />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto px-6 py-12 md:py-20">
                <Link
                    href="/"
                    className="inline-flex items-center text-sm text-slate-400 hover:text-white transition-colors mb-12 group"
                >
                    <span className="mr-2 group-hover:-translate-x-1 transition-transform">&larr;</span>
                    Back to Tools
                </Link>

                <div className="space-y-4 mb-16">
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
                        {title}
                    </h1>
                    <div className="h-1 w-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full" />
                </div>

                <div className="prose prose-invert prose-lg max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-purple-400 hover:prose-a:text-purple-300 prose-strong:text-slate-100 prose-li:text-slate-300 text-slate-400">
                    <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-2xl p-8 md:p-12 shadow-xl">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
