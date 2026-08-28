import { openGraphFor } from "@/lib/site";

export const metadata = {
    alternates: { canonical: "/zakat" },
    openGraph: openGraphFor("/zakat"),
    title: "Zakat Calculator",
    description:
        "Calculate maal, fitrah, and income zakat according to Islamic rules, with automatic nisab estimation based on current gold prices.",
};
export default function ZakatLayout({ children }) {
    return children;
}
