import { openGraphFor } from "@/lib/site";

export const metadata = {
    alternates: { canonical: "/fiqh" },
    openGraph: openGraphFor("/fiqh"),
    title: "Fiqh Ringkas",
    description:
        "Panduan praktis hukum Islam sehari-hari: bersuci, sholat, puasa, zakat, haji, dan muamalah, disertai dalil dari Al-Quran dan Hadits.",
};
export default function FiqhLayout({ children }) {
    return children;
}
