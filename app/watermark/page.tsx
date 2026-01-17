import { Metadata } from "next";
import WatermarkPage from "./client";

export const metadata: Metadata = {
    title: "Watermark PDF | Add Text Watermark to PDF",
    description: "Stamp custom text watermarks on your PDF documents. Customize font, size, opacity, and rotation.",
    alternates: {
        canonical: '/watermark'
    }
};

export default function Page() {
    return <WatermarkPage />;
}
