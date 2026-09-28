import { openGraphFor } from "@/lib/site";

export const metadata = {
    alternates: { canonical: "/asbabun-nuzul" },
    openGraph: openGraphFor("/asbabun-nuzul"),
    title: "Asbabun Nuzul",
    description:
        "Pelajari sebab-sebab turunnya ayat Al-Quran untuk memahami konteks historis di balik setiap ayat.",
};
export default function AsbabunNuzulLayout({ children }) {
    return children;
}
