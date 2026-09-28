import { openGraphFor } from "@/lib/site";

export const metadata = {
    alternates: { canonical: "/jadwal-sholat" },
    openGraph: openGraphFor("/jadwal-sholat"),
    title: "Jadwal Sholat",
    description:
        "Jadwal sholat 5 waktu untuk kota-kota di Indonesia, dengan deteksi lokasi otomatis, penanda sholat berikutnya, dan metode perhitungan Kemenag RI.",
};
export default function JadwalSholatLayout({ children }) {
    return children;
}
