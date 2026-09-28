import { openGraphFor } from "@/lib/site";

export const metadata = {
    alternates: { canonical: "/asmaul-husna" },
    openGraph: openGraphFor("/asmaul-husna"),
    title: "Asmaul Husna",
    description:
        "99 nama indah Allah lengkap dengan arti, transliterasi, dan penjelasan lebih mendalam.",
};
export default function AsmaulHusnaLayout({ children }) {
    return children;
}
