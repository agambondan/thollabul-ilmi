import { openGraphFor } from "@/lib/site";

export const metadata = {
    alternates: { canonical: "/wirid" },
    openGraph: openGraphFor("/wirid"),
    title: "Wird & Sunnah Readings",
    description:
        "A collection of wird and sunnah readings for special moments, including Friday, Ramadan, Arafah Day, Laylatul Qadr, Eid al-Fitr, and Eid al-Adha.",
};
export default function WiridLayout({ children }) {
    return children;
}
