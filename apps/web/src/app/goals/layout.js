import { openGraphFor } from "@/lib/site";

export const metadata = {
    alternates: { canonical: "/goals" },
    openGraph: openGraphFor("/goals"),
    title: "Learning Goals",
    description:
        "Set and track memorization, recitation, and hadith learning goals. Build a structured and consistent Islamic learning journey with Thullaabul Ilmi.",
};
export default function GoalsLayout({ children }) {
    return children;
}
