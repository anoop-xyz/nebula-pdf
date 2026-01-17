import { Metadata } from "next";
import PdfToImagePage from "./client";

export const metadata: Metadata = {
    title: "PDF to Image | Convert PDF Pages to JPG/PNG",
    description: "Convert each page of your PDF into high-quality images (JPG or PNG). Secure client-side conversion.",
    alternates: {
        canonical: '/pdf-to-image'
    }
};

export default function Page() {
    return <PdfToImagePage />;
}
