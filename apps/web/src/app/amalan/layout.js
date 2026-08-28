import { openGraphFor } from "@/lib/site";

export const metadata = {
    alternates: { canonical: "/amalan" },
    openGraph: openGraphFor("/amalan"),
    title: "Daily Deeds",
    description:
        "A daily sunnah deeds checklist for tahajjud, dhuha, fasting, dhikr, and charity to track worship consistency.",
};
export default function AmalanLayout({ children }) {
    return children;
}
