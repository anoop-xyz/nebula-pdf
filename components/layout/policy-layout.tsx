import Link from "next/link";

export const policyConfig = {
    companyName: "Nebula PDF",
    contactEmail: "support@nebulapdf.com",
    address: "New Delhi, India", // Placeholder
};

export default function PolicyLayout({ title, children }: { title: string, children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-black text-slate-300 p-8 md:p-24 font-light">
            <div className="max-w-3xl mx-auto space-y-8">
                <Link href="/" className="text-secondary hover:text-white transition-colors mb-8 block">&larr; Back to Home</Link>
                <h1 className="text-3xl md:text-5xl font-bold text-white mb-8">{title}</h1>
                <div className="prose prose-invert prose-slate max-w-none">
                    {children}
                </div>
            </div>
        </div>
    );
}
