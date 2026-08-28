import { openGraphFor } from "@/lib/site";

export const metadata = {
    alternates: { canonical: "/profile" },
    openGraph: openGraphFor("/profile"),
    title: "Profile",
    description:
        "Manage your profile, track streaks and learning progress, set language preferences, and update your Thullaabul Ilmi account password.",
};
export default function ProfileLayout({ children }) {
    return children;
}
