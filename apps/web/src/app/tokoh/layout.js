import { OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata = {
    title: "Tokoh Tarikh — Thullaabul 'Ilmi",
    description:
        "Biografi para sahabat, tabi'in, tabi'ut tabi'in, imam mazhab, ulama klasik, dan ilmuwan Islam terkemuka.",
    alternates: {
        canonical: `${SITE_URL}/tokoh`,
    },
    openGraph: {
        title: "Tokoh Tarikh — Thullaabul 'Ilmi",
        description:
            "Biografi para sahabat, tabi'in, tabi'ut tabi'in, imam mazhab, ulama klasik, dan ilmuwan Islam terkemuka.",
        url: `${SITE_URL}/tokoh`,
        siteName: SITE_NAME,
        images: [OG_IMAGE],
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Tokoh Tarikh — Thullaabul 'Ilmi",
        description:
            "Biografi para sahabat, tabi'in, tabi'ut tabi'in, imam mazhab, ulama klasik, dan ilmuwan Islam terkemuka.",
        images: [OG_IMAGE.url],
    },
};

export default function TokohLayout({ children }) {
    return children;
}
