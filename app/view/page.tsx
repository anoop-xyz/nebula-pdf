import { Metadata } from "next";
import ViewPage from "./client";

export const metadata: Metadata = {
    title: "View PDF | Read and View PDF Files Online",
    description: "Open and view PDF files instantly in your browser. No software installation required.",
    alternates: {
        canonical: '/view'
    }
};

export default function Page() {
    return <ViewPage />;
}
