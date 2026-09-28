import { openGraphFor } from "@/lib/site";

export const metadata = {
    alternates: { canonical: "/quiz" },
    openGraph: openGraphFor("/quiz"),
    title: "Kuis Islami",
    description:
        "Uji wawasan keislamanmu lewat kuis interaktif seputar Al-Quran, Hadits, Fiqh, dan Sejarah Islam. Soal diacak setiap sesi.",
};
export default function QuizLayout({ children }) {
    return children;
}
