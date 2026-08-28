import { openGraphFor } from "@/lib/site";

export const metadata = {
    alternates: { canonical: "/kamus" },
    openGraph: openGraphFor("/kamus"),
    title: "Arabic Dictionary",
    description:
        "An Arabic-Indonesian dictionary for Quranic and Islamic vocabulary, with meanings, transliteration, and roots.",
};
export default function KamusLayout({ children }) {
    return children;
}
