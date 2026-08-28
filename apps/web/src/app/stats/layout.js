import { openGraphFor } from "@/lib/site";

export const metadata = {
    alternates: { canonical: "/stats" },
    openGraph: openGraphFor("/stats"),
    title: "Learning Statistics",
    description:
        "Track your Islamic learning activity, including verses read, hadiths read, daily streaks, and memorization progress.",
};
export default function StatsLayout({ children }) {
    return children;
}
