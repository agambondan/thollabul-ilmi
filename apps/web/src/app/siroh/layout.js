import { openGraphFor } from "@/lib/site";

export const metadata = {
    alternates: { canonical: "/siroh" },
    openGraph: openGraphFor("/siroh"),
    title: "Prophet's Biography",
    description:
        "Read the biography of Prophet Muhammad ﷺ in clear, chapter-based lessons.",
};
export default function SirohLayout({ children }) {
    return children;
}
