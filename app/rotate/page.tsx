import { Metadata } from "next";
import RotatePage from "./client";
import { ToolStructuredData } from "@/components/seo/structured-data";

export const metadata: Metadata = {
  title: "Rotate PDF | Rotate PDF Pages Left or Right",
  description: "Rotate specific pages or the entire PDF document permanently. Secure, online, and free.",
  alternates: {
    canonical: '/rotate'
  }
};

export default function Page() {
  return (
    <>
      <ToolStructuredData
        name="Rotate PDF"
        description="Rotate specific pages or the entire PDF document permanently. Secure, online, and free."
        path="/rotate"
      />
      <RotatePage />
    </>
  );
}
