import { openGraphFor } from "@/lib/site";

export const metadata = {
    alternates: { canonical: "/hadith" },
    openGraph: openGraphFor("/hadith"),
    title: "Hadith",
    description:
        "Explore authentic hadith collections from 9 major books, including Bukhari, Muslim, Abu Dawud, and more.",
};

export default function HadithLayout({ children }) {
    return children;
}
