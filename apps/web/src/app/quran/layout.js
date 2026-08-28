import { openGraphFor } from "@/lib/site";

export const metadata = {
    alternates: { canonical: "/quran" },
    openGraph: openGraphFor("/quran"),
    title: "Al-Quran",
    description:
        "Read the complete 30 juz of the Quran with color-coded Tajweed to support recitation learning.",
};

export default function QuranLayout({ children }) {
    return children;
}
