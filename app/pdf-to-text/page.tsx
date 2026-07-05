import { Metadata } from "next";
import PdfToTextPage from "./client";
import { ToolStructuredData } from "@/components/seo/structured-data";

export const metadata: Metadata = {
  title: "PDF to Text | Extract Text from PDF",
  description: "Extract text content from your PDF documents instantly. Copy to clipboard or download as TXT. No uploads required.",
  alternates: {
    canonical: '/pdf-to-text'
  }
};

export default function Page() {
  return (
    <>
      <ToolStructuredData
        name="PDF to Text"
        description="Extract text content from your PDF documents instantly. Copy to clipboard or download as TXT. No uploads required."
        path="/pdf-to-text"
      />
      <PdfToTextPage />
    </>
  );
}
