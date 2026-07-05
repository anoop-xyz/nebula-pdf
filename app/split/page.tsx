import { Metadata } from "next";
import SplitPage from "./client";
import { ToolStructuredData } from "@/components/seo/structured-data";

export const metadata: Metadata = {
  title: "Split PDF | Extract Pages from PDF",
  description: "Split your PDF into multiple files. Extract specific pages or split by range. Free and secure.",
  alternates: {
    canonical: '/split'
  }
};

export default function Page() {
  return (
    <>
      <ToolStructuredData
        name="Split PDF"
        description="Split your PDF into multiple files. Extract specific pages or split by range. Free and secure."
        path="/split"
      />
      <SplitPage />
    </>
  );
}
