import FaraidhPage, { FaraidhContent } from "@/app/faraidh/FaraidhPageClient";
import { openGraphFor } from "@/lib/site";

export const metadata = {
    title: "Kalkulator Faraidh (Warisan Islam)",
    description:
        "Hitung pembagian warisan Islam (faraidh) sesuai dalil Al-Quran dan hadits — masukkan ahli waris, lihat pembagian bagian, dan pohon keluarga interaktif.",
    alternates: { canonical: "/faraidh" },
    openGraph: openGraphFor("/faraidh"),
};

export { FaraidhContent };
export default FaraidhPage;
