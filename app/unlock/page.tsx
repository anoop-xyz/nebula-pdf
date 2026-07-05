import { Metadata } from "next";
import UnlockPage from "./client";
import { ToolStructuredData } from "@/components/seo/structured-data";

export const metadata: Metadata = {
  title: "Unlock PDF | Remove PDF Passwords",
  description: "Remove passwords from secured PDF files. Unlock your documents for editing and printing.",
  alternates: {
    canonical: '/unlock'
  }
};

export default function Page() {
  return (
    <>
      <ToolStructuredData
        name="Unlock PDF"
        description="Remove passwords from secured PDF files. Unlock your documents for editing and printing."
        path="/unlock"
      />
      <UnlockPage />
    </>
  );
}
