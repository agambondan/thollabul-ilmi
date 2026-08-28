import { openGraphFor } from "@/lib/site";

export const metadata = {
    alternates: { canonical: "/kajian" },
    openGraph: openGraphFor("/kajian"),
    title: "Islamic Studies",
    description:
        "A curated collection of Islamic lecture and study links from trusted teachers across aqidah, fiqh, tazkiyah, sirah, tafsir, and hadith.",
};
export default function KajianLayout({ children }) {
    return children;
}
