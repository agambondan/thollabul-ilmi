import { openGraphFor } from "@/lib/site";

export const metadata = {
    alternates: { canonical: "/dzikir" },
    openGraph: openGraphFor("/dzikir"),
    title: "Dhikr & Wird",
    description:
        "A collection of morning and evening dhikr, daily wird, and situational dhikr from Hisnul Muslim and Al-Adhkar.",
};
export default function DzikirLayout({ children }) {
    return children;
}
