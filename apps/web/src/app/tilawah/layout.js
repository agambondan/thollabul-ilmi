import { openGraphFor } from "@/lib/site";

export const metadata = {
    alternates: { canonical: "/tilawah" },
    openGraph: openGraphFor("/tilawah"),
    title: "Recitation Tracker",
    description:
        "Record daily Quran pages and juz read, then track recitation statistics, khatam estimates, and daily averages.",
};
export default function TilawahLayout({ children }) {
    return children;
}
