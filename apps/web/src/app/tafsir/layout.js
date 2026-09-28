import { openGraphFor } from "@/lib/site";

export const metadata = {
    alternates: { canonical: "/tafsir" },
    openGraph: openGraphFor("/tafsir"),
    title: "Tafsir Al-Quran",
    description:
        "Baca tafsir Al-Quran per surah dan ayat untuk memahami makna Al-Quran lebih dalam lewat penjelasan ulama terpercaya.",
};
export default function TafsirLayout({ children }) {
    return children;
}
