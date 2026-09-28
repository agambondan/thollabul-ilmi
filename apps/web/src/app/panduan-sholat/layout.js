import { openGraphFor } from "@/lib/site";

export const metadata = {
    alternates: { canonical: "/panduan-sholat" },
    openGraph: openGraphFor("/panduan-sholat"),
    title: "Panduan Sholat",
    description:
        "Panduan lengkap sholat 5 waktu — niat, takbiratul ihram, bacaan tiap gerakan, dan terjemahannya.",
};
export default function PanduanSholatLayout({ children }) {
    return children;
}
