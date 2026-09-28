import { openGraphFor } from "@/lib/site";

export const metadata = {
    alternates: { canonical: "/leaderboard" },
    openGraph: openGraphFor("/leaderboard"),
    title: "Papan Peringkat",
    description:
        "Peringkat hafalan Al-Quran dan streak belajar pengguna Thullaabul 'Ilmi, dirancang untuk motivasi yang sehat.",
};
export default function LeaderboardLayout({ children }) {
    return children;
}
