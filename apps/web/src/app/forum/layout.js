import { openGraphFor } from "@/lib/site";

export const metadata = {
    alternates: { canonical: "/forum" },
    openGraph: openGraphFor("/forum"),
    title: "Islamic Forum & Q&A",
    description:
        "Tanya jawab dan diskusi seputar pemahaman Islam, ibadah, fiqh, dan muamalah bersama komunitas Thullaabul 'Ilmi.",
};

export default function ForumLayout({ children }) {
    return children;
}
