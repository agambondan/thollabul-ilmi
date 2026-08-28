import { openGraphFor } from "@/lib/site";

export const metadata = {
    alternates: { canonical: "/notes" },
    openGraph: openGraphFor("/notes"),
    title: "Personal Notes",
    description:
        "Save favorite verses, selected hadiths, Islamic lessons, and personal reflections in notes you can access anytime.",
};
export default function NotesLayout({ children }) {
    return children;
}
