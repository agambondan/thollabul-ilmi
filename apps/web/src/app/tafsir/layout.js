import { openGraphFor } from "@/lib/site";

export const metadata = {
    alternates: { canonical: "/tafsir" },
    openGraph: openGraphFor("/tafsir"),
    title: "Tafsir Al-Quran",
    description:
        "Read Quran tafsir by surah and verse to understand Quranic meanings more deeply through trusted scholarly explanations.",
};
export default function TafsirLayout({ children }) {
    return children;
}
