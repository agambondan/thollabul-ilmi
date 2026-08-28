import { openGraphFor } from "@/lib/site";

export const metadata = {
    alternates: { canonical: "/muhasabah" },
    openGraph: openGraphFor("/muhasabah"),
    title: "Daily Muhasabah",
    description:
        "Write daily muhasabah journals and reflections to review deeds, intentions, and personal growth.",
};
export default function MuhasabahLayout({ children }) {
    return children;
}
