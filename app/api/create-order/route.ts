import Razorpay from "razorpay";
import { NextResponse } from "next/server";

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || "rzp_live_RvZKWRg5XIItyz",
    key_secret: process.env.RAZORPAY_KEY_SECRET || "hqohXak7K7qPjQhETC3bFTNC",
});

export async function POST(req: Request) {
    try {
        const { amount } = await req.json();

        if (!amount) {
            return NextResponse.json({ error: "Amount is required" }, { status: 400 });
        }

        const order = await razorpay.orders.create({
            amount: amount * 100, // Amount in paise
            currency: "INR",
            receipt: "receipt_" + Math.random().toString(36).substring(7),
        });

        return NextResponse.json({
            orderId: order.id,
            keyId: process.env.RAZORPAY_KEY_ID || "rzp_live_RvZKWRg5XIItyz"
        });

    } catch (error) {
        console.error("Error creating Razorpay order:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
