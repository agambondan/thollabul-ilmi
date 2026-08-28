import { openGraphFor } from "@/lib/site";

export const metadata = {
    alternates: { canonical: "/sholat-tracker" },
    openGraph: openGraphFor("/sholat-tracker"),
    title: "Prayer Tracker",
    description:
        "Record and track the five daily prayers to build a consistent prayer habit with a personal tracker in Thullaabul Ilmi.",
};
export default function SholatTrackerLayout({ children }) {
    return children;
}
