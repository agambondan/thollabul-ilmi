import { openGraphFor } from "@/lib/site";

export const metadata = {
    alternates: { canonical: "/asbabun-nuzul" },
    openGraph: openGraphFor("/asbabun-nuzul"),
    title: "Asbabun Nuzul",
    description:
        "Study the reasons behind Quranic revelation to understand the historical context of each verse.",
};
export default function AsbabunNuzulLayout({ children }) {
    return children;
}
