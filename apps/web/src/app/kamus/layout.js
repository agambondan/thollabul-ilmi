import { openGraphFor } from "@/lib/site";

export const metadata = {
    alternates: { canonical: "/kamus" },
    openGraph: openGraphFor("/kamus"),
    title: "Kamus Arab-Indonesia",
    description:
        "Kamus Arab-Indonesia untuk kosakata Al-Quran dan istilah Islam, lengkap dengan arti, transliterasi, dan akar kata.",
};
export default function KamusLayout({ children }) {
    return children;
}
