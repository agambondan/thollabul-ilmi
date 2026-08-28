import { openGraphFor } from "@/lib/site";

export const metadata = {
    alternates: { canonical: "/doa" },
    openGraph: openGraphFor("/doa"),
    title: "Prayer Collection",
    description:
        "A collection of daily and situational prayers from the Quran and Sunnah, including morning, evening, meal, sleep, travel, and worship prayers.",
};
export default function DoaLayout({ children }) {
    return children;
}
