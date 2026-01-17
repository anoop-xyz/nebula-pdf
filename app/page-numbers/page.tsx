import { Metadata } from "next";
import PageNumbersPage from "./client";

export const metadata: Metadata = {
    title: "Page Numbers | Add Page Numbers to PDF",
    description: "Add sequential page numbers to your PDF document. Customize position and style. Fast, free, and secure.",
    alternates: {
        canonical: '/page-numbers'
    }
};

export default function Page() {
    return <PageNumbersPage />;
}
