import { Metadata } from "next";
import OrganizePage from "./client";

export const metadata: Metadata = {
    title: "Organize PDF | Rearrange, Remove, and Rotate PDF Pages",
    description: "Organize your PDF pages. Reorder, rotate individual pages, or delete unwanted pages. All client-side.",
    alternates: {
        canonical: '/organize'
    }
};

export default function Page() {
    return <OrganizePage />;
}
