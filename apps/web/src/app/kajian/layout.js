import { openGraphFor } from "@/lib/site";

export const metadata = {
    alternates: { canonical: "/kajian" },
    openGraph: openGraphFor("/kajian"),
    title: "Kajian Islam",
    description:
        "Kumpulan tautan kajian dan ceramah dari ustadz-ustadz terpercaya, mencakup aqidah, fiqh, tazkiyah, sirah, tafsir, dan hadits.",
};
export default function KajianLayout({ children }) {
    return children;
}
