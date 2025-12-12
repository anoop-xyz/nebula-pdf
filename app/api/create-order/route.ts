import Razorpay from "razorpay";
import { NextResponse } from "next/server";

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_RqjHTvwZRojtnh",
    key_secret: process.env.RAZORPAY_KEY_SECRET || "Bx89YdEwz2BkZW5op1dbdO1z",
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
            keyId: process.env.RAZORPAY_KEY_ID || "rzp_test_RqjHTvwZRojtnh"
        });

    } catch (error) {
        console.error("Error creating Razorpay order:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
