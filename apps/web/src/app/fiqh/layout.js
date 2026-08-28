import { openGraphFor } from "@/lib/site";

export const metadata = {
    alternates: { canonical: "/fiqh" },
    openGraph: openGraphFor("/fiqh"),
    title: "Brief Fiqh",
    description:
        "A practical guide to daily Islamic rulings: purification, prayer, fasting, zakat, hajj, and transactions, supported by evidence from the Quran and Hadith.",
};
export default function FiqhLayout({ children }) {
    return children;
}
