import { openGraphFor } from "@/lib/site";

export const metadata = {
    alternates: { canonical: "/dzikir" },
    openGraph: openGraphFor("/dzikir"),
    title: "Dzikir & Wirid",
    description:
        "Kumpulan dzikir pagi-petang, wirid harian, dan dzikir situasional dari kitab Hisnul Muslim dan Al-Adzkar.",
};
export default function DzikirLayout({ children }) {
    return children;
}
