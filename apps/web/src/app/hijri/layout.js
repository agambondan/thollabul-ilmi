import { openGraphFor } from "@/lib/site";

export const metadata = {
    alternates: { canonical: "/hijri" },
    openGraph: openGraphFor("/hijri"),
    title: "Hijri Calendar",
    description:
        "Convert Gregorian dates to Hijri, check today in the Hijri calendar, and view important Islamic dates throughout the year.",
};
export default function HijriLayout({ children }) {
    return children;
}
