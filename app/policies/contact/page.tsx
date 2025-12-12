import PolicyLayout, { policyConfig } from "@/components/layout/policy-layout";
import { Mail, MapPin, Clock } from "lucide-react";

export default function ContactUs() {
    return (
        <PolicyLayout title="Contact Us">
            <p className="text-xl text-slate-300 font-light leading-relaxed mb-12">
                We're here to help. Whether you have a question about our features, pricing, or need support with a PDF, our team is ready to answer all your questions.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 not-prose">
                {/* Email Card */}
                <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl hover:bg-slate-800 transition-colors group">
                    <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Mail className="w-6 h-6 text-purple-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-200 mb-2">Email Us</h3>
                    <p className="text-slate-400 text-sm mb-4">Our friendly team is here to help.</p>
                    <a href={`mailto:${policyConfig.contactEmail}`} className="text-purple-400 hover:text-purple-300 font-medium">
                        {policyConfig.contactEmail}
                    </a>
                </div>

                {/* Location Card */}
                <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl hover:bg-slate-800 transition-colors group">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <MapPin className="w-6 h-6 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-200 mb-2">Visit Us</h3>
                    <p className="text-slate-400 text-sm mb-4">Come say hello at our office headquarters.</p>
                    <p className="text-slate-300 font-medium">{policyConfig.address}</p>
                </div>
            </div>
        </PolicyLayout>
    );
}
