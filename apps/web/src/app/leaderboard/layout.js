import { openGraphFor } from "@/lib/site";

export const metadata = {
    alternates: { canonical: "/leaderboard" },
    openGraph: openGraphFor("/leaderboard"),
    title: "Leaderboard",
    description:
        "Quran memorization and learning streak rankings for Thullaabul Ilmi users, designed for healthy motivation.",
};
export default function LeaderboardLayout({ children }) {
    return children;
}
