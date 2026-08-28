import { openGraphFor } from "@/lib/site";

export const metadata = {
    alternates: { canonical: "/auth/register" },
    openGraph: openGraphFor("/auth/register"),
    title: "Register",
    description:
        "Create a free Thullaabul Ilmi account and start your Islamic learning journey with memorization, recitation, daily deeds, and 40+ features.",
    robots: { index: false, follow: false },
};
export default function RegisterLayout({ children }) {
    return children;
}
