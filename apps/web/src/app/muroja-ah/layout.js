import { openGraphFor } from "@/lib/site";

export const metadata = {
    alternates: { canonical: "/muroja-ah" },
    openGraph: openGraphFor("/muroja-ah"),
    title: "Review",
    description:
        "Schedule and track Quran memorization review, including last reviewed surahs and review priorities.",
};
export default function MurojaahLayout({ children }) {
    return children;
}
