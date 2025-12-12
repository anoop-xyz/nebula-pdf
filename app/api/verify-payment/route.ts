import crypto from "crypto";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

        const keySecret = process.env.RAZORPAY_KEY_SECRET || "Bx89YdEwz2BkZW5op1dbdO1z";

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", keySecret)
            .update(body.toString())
            .digest("hex");

        const isAuthentic = expectedSignature === razorpay_signature;

        if (isAuthentic) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ success: false, error: "Invalid Signature" }, { status: 400 });
        }

    } catch (error) {
        console.error("Error verifying payment:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
