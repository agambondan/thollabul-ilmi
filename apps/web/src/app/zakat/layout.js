import { openGraphFor } from "@/lib/site";

export const metadata = {
    alternates: { canonical: "/zakat" },
    openGraph: openGraphFor("/zakat"),
    title: "Kalkulator Zakat",
    description:
        "Hitung zakat maal, fitrah, dan penghasilan sesuai ketentuan syariat, dengan estimasi nisab otomatis berdasarkan harga emas terkini.",
};
export default function ZakatLayout({ children }) {
    return children;
}
