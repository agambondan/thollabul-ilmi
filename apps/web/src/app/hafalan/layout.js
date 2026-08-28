import { openGraphFor } from "@/lib/site";

export const metadata = {
    alternates: { canonical: "/hafalan" },
    openGraph: openGraphFor("/hafalan"),
    title: "Memorization Tracker",
    description:
        "Record and track Quran memorization progress by surah, including memorized, in progress, and not started statuses.",
};
export default function HafalanLayout({ children }) {
    return children;
}
