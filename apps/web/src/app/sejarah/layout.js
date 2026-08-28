import { openGraphFor } from "@/lib/site";

export const metadata = {
    alternates: { canonical: "/sejarah" },
    openGraph: openGraphFor("/sejarah"),
    title: "Islamic History — Thullaabul Ilmi",
    description:
        "A timeline of Islamic history from the era of Prophet Muhammad ﷺ to the modern period, covering major events, figures, and dynasties.",
};

const SejarahLayout = ({ children }) => children;

export default SejarahLayout;
