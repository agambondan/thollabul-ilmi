import { openGraphFor } from "@/lib/site";

export const metadata = {
    alternates: { canonical: "/search" },
    openGraph: openGraphFor("/search"),
    title: "Search",
    description:
        "Search Quran verses and hadiths by keywords in Indonesian, Arabic, or transliteration.",
};
export default function SearchLayout({ children }) {
    return children;
}
