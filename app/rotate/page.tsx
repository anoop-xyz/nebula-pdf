import { Metadata } from "next";
import RotatePage from "./client";

export const metadata: Metadata = {
    title: "Rotate PDF | Rotate PDF Pages Left or Right",
    description: "Rotate specific pages or the entire PDF document permanently. Secure, online, and free.",
    alternates: {
        canonical: '/rotate'
    }
};

export default function Page() {
    return <RotatePage />;
}
