import { openGraphFor } from "@/lib/site";

export const metadata = {
    alternates: { canonical: "/kiblat" },
    openGraph: openGraphFor("/kiblat"),
    title: "Arah Kiblat",
    description:
        "Temukan arah kiblat menuju Ka'bah dari lokasimu memakai GPS dan kompas perangkat, lengkap dengan jarak ke Makkah.",
};
export default function KiblatLayout({ children }) {
    return children;
}
