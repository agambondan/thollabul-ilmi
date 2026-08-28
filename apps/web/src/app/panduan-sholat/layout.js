import { openGraphFor } from "@/lib/site";

export const metadata = {
    alternates: { canonical: "/panduan-sholat" },
    openGraph: openGraphFor("/panduan-sholat"),
    title: "Prayer Guide",
    description:
        "A complete five daily prayers guide with intentions, opening takbir, readings for each movement, and translations.",
};
export default function PanduanSholatLayout({ children }) {
    return children;
}
