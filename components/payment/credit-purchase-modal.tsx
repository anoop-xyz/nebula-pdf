import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Zap, Star, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/auth-provider";
import { doc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface CreditPurchaseModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const PLANS = [
    {
        id: "starter",
        name: "Starter Pack",
        credits: 10,
        price: 29,
        perCredit: "₹2.9",
        popular: false,
        icon: Zap
    },
    {
        id: "pro",
        name: "Pro Pack",
        credits: 50,
        price: 99,
        perCredit: "₹1.9",
        popular: true,
        icon: Star
    },
    {
        id: "power",
        name: "Power User",
        credits: 200,
        price: 299,
        perCredit: "₹1.5",
        popular: false,
        icon: ShieldCheck
    }
];

export function CreditPurchaseModal({ isOpen, onClose }: CreditPurchaseModalProps) {
    const { user } = useAuth();
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handlePurchase = async (plan: typeof PLANS[0]) => {
        if (!user) {
            toast.error("Please sign in to buy credits.");
            return;
        }

        setLoadingPlan(plan.id);

        try {
            // 1. Load Script
            const res = await loadRazorpayScript();
            if (!res) {
                toast.error("Failed to load payment gateway. Check connection.");
                return;
            }

            // 2. Create Order
            const orderRes = await fetch("/api/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: plan.price }),
            });
            const orderJson = await orderRes.json();

            if (orderJson.error) throw new Error(orderJson.error);

            const options = {
                key: orderJson.keyId,
                amount: plan.price * 100,
                currency: "INR",
                name: "Nebula PDF",
                description: `${plan.credits} Credits Top-up`,
                order_id: orderJson.orderId,
                handler: async function (response: any) {
                    try {
                        // 3. Verify Payment Signature
                        const verifyRes = await fetch("/api/verify-payment", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                            }),
                        });

                        const verifyJson = await verifyRes.json();
                        if (!verifyJson.success) throw new Error("Verification Failed");

                        // 4. Update Firestore (Client Side Update)
                        // Note: Ideally done via Webhook/Admin SDK for absolute security.
                        const userRef = doc(db, 'users', user.uid);
                        await updateDoc(userRef, {
                            "credits.paid": increment(plan.credits)
                        });

                        toast.success("Payment Successful! Credits added.");
                        onClose();

                    } catch (err) {
                        console.error(err);
                        toast.error("Payment verification failed. Contact support.");
                    }
                },
                prefill: {
                    name: user.displayName || "User",
                    email: user.email || "",
                },
                theme: {
                    color: "#a855f7", // Purple-500
                },
            };

            const rzp1 = new (window as any).Razorpay(options);
            rzp1.open();

        } catch (error) {
            console.error("Payment Error:", error);
            toast.error("Something went wrong initializing payment.");
        } finally {
            setLoadingPlan(null);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg bg-slate-950 border-slate-800 text-slate-100">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
                        Top Up Credits
                    </DialogTitle>
                    <p className="text-sm text-slate-400">
                        Credits never expire. Use them for any secure tool.
                    </p>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {PLANS.map((plan) => (
                        <div
                            key={plan.id}
                            className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer hover:bg-slate-900 group
                                ${plan.popular ? 'border-purple-500/50 bg-slate-900/40' : 'border-slate-800 bg-slate-900/20'}
                            `}
                            onClick={() => !loadingPlan && handlePurchase(plan)}
                        >
                            {plan.popular && (
                                <div className="absolute -top-3 right-4 bg-purple-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-lg shadow-purple-500/20">
                                    Best Value
                                </div>
                            )}

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${plan.popular ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-800 text-slate-400'}`}>
                                        <plan.icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">{plan.credits} Credits</h3>
                                        <p className="text-xs text-slate-400">{plan.name} • {plan.perCredit}/credit</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xl font-bold">₹{plan.price}</div>
                                    {loadingPlan === plan.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin ml-auto text-purple-400" />
                                    ) : (
                                        <span className="text-xs text-purple-400 group-hover:underline">Buy Now &rarr;</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 mt-2">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Secure Payment secured by Razorpay</span>
                </div>
            </DialogContent>
        </Dialog>
    );
}
