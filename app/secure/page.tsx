import { Metadata } from "next";
import SecurePage from "./client";

export const metadata: Metadata = {
    title: "Secure PDF | Password Protect PDF Files",
    description: "Encrypt your PDF with a strong password. Prevent unauthorized access using AES-256 encryption.",
    alternates: {
        canonical: '/secure'
    }
};

export default function Page() {
    return <SecurePage />;
}
