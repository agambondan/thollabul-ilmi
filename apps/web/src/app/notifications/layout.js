import { openGraphFor } from "@/lib/site";

export const metadata = {
    alternates: { canonical: "/notifications" },
    openGraph: openGraphFor("/notifications"),
    title: "Notification Settings",
    description:
        "Configure daily reminders for Quran reading, Hadith, and dhikr to maintain consistent worship habits.",
};
export default function NotificationsLayout({ children }) {
    return children;
}
