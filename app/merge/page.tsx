import { Metadata } from "next";
import MergePage from "./client";

export const metadata: Metadata = {
    title: "Merge PDF | Combine PDF Files Online for Free",
    description: "Combine multiple PDF files into one document instantly. No watermark, no signup, and secure processing in your browser.",
    alternates: {
        canonical: '/merge'
    }
};

export default function Page() {
    return <MergePage />;
}
