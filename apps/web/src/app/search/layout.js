import { openGraphFor } from "@/lib/site";

export const metadata = {
    alternates: { canonical: "/search" },
    openGraph: openGraphFor("/search"),
    title: "Pencarian",
    description:
        "Cari ayat Al-Quran dan hadits berdasarkan kata kunci dalam Bahasa Indonesia, Arab, atau transliterasi.",
};
export default function SearchLayout({ children }) {
    return children;
}
