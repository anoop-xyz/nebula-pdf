import { Metadata } from "next";
import ImagesToPdfPage from "./client";

export const metadata: Metadata = {
    title: "Images to PDF | Convert JPG, PNG to PDF",
    description: "Convert your images (JPG, PNG) to a single PDF document. Drag and drop, reorder, and convert instantly in your browser.",
    alternates: {
        canonical: '/images-to-pdf'
    }
};

export default function Page() {
    return <ImagesToPdfPage />;
}
