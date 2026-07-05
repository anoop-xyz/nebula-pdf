import { Metadata } from "next";
import SignPage from "./client";
import { ToolStructuredData } from "@/components/seo/structured-data";

export const metadata: Metadata = {
  title: "Sign PDF | Create and Add Digital Signatures",
  description: "Draw your signature or upload an image signature and add it to your PDF. Free online PDF signer.",
  alternates: {
    canonical: '/sign'
  }
};

export default function Page() {
  return (
    <>
      <ToolStructuredData
        name="Sign PDF"
        description="Draw your signature or upload an image signature and add it to your PDF. Free online PDF signer."
        path="/sign"
      />
      <SignPage />
    </>
  );
}
