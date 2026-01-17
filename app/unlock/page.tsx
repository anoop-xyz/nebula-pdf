import { Metadata } from "next";
import UnlockPage from "./client";

export const metadata: Metadata = {
    title: "Unlock PDF | Remove PDF Passwords",
    description: "Remove passwords from secured PDF files. Unlock your documents for editing and printing.",
    alternates: {
        canonical: '/unlock'
    }
};

export default function Page() {
    return <UnlockPage />;
}
