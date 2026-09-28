import { openGraphFor } from "@/lib/site";

export const metadata = {
    alternates: { canonical: "/muroja-ah" },
    openGraph: openGraphFor("/muroja-ah"),
    title: "Muroja'ah",
    description:
        "Jadwalkan dan lacak muroja'ah hafalan Al-Quran, termasuk surah terakhir diulang dan prioritas pengulangan.",
};
export default function MurojaahLayout({ children }) {
    return children;
}
