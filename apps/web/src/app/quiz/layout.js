import { openGraphFor } from "@/lib/site";

export const metadata = {
    alternates: { canonical: "/quiz" },
    openGraph: openGraphFor("/quiz"),
    title: "Islamic Quiz",
    description:
        "Test Islamic knowledge with interactive quizzes about the Quran, Hadith, Fiqh, and Islamic History. Questions are shuffled each session.",
};
export default function QuizLayout({ children }) {
    return children;
}
