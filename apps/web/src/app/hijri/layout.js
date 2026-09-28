import { openGraphFor } from "@/lib/site";

export const metadata = {
    alternates: { canonical: "/hijri" },
    openGraph: openGraphFor("/hijri"),
    title: "Kalender Hijriyah",
    description:
        "Konversi tanggal Masehi ke Hijriyah, cek tanggal Hijriyah hari ini, dan lihat hari-hari penting Islam sepanjang tahun.",
};
export default function HijriLayout({ children }) {
    return children;
}
