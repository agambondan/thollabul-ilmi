import KhatamPage, { KhatamContent } from "@/app/khatam/KhatamPageClient";
import { openGraphFor } from "@/lib/site";

export const metadata = {
    title: "Pelacak Khatam Al-Quran",
    description:
        "Lacak progres khatam Al-Quran harianmu — target juz, capaian ayat, dan pengingat agar konsisten menyelesaikan bacaan Al-Quran.",
    alternates: { canonical: "/khatam" },
    openGraph: openGraphFor("/khatam"),
};

export { KhatamContent };
export default KhatamPage;
