import { openGraphFor } from "@/lib/site";

export const metadata = {
    alternates: { canonical: "/bookmarks" },
    openGraph: openGraphFor("/bookmarks"),
    title: "Bookmarks",
    description:
        "A collection of Quran verses and hadiths you saved to revisit anytime.",
};
export default function BookmarksLayout({ children }) {
    return children;
}
