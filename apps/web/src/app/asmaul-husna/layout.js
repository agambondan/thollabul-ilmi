import { openGraphFor } from "@/lib/site";

export const metadata = {
    alternates: { canonical: "/asmaul-husna" },
    openGraph: openGraphFor("/asmaul-husna"),
    title: "Asmaul Husna",
    description:
        "The 99 beautiful names of Allah with meanings, transliteration, and deeper explanations.",
};
export default function AsmaulHusnaLayout({ children }) {
    return children;
}
