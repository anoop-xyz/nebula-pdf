import { Metadata } from "next";
import CompressPage from "./client";

export const metadata: Metadata = {
    title: "Compress PDF | Reduce PDF File Size Online",
    description: "Compress your PDF files online for free. Reduce file size while maintaining quality. Secure, fast, and no uploads required.",
    alternates: {
        canonical: '/compress'
    }
};

export default function Page() {
    return <CompressPage />;
}
