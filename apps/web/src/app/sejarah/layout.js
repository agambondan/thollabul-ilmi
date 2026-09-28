import { openGraphFor } from "@/lib/site";

export const metadata = {
    alternates: { canonical: "/sejarah" },
    openGraph: openGraphFor("/sejarah"),
    title: "Sejarah Islam",
    description:
        "Linimasa sejarah Islam dari masa Nabi Muhammad ﷺ hingga era modern, mencakup peristiwa besar, tokoh, dan dinasti.",
};

const SejarahLayout = ({ children }) => children;

export default SejarahLayout;
