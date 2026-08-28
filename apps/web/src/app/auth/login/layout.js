import { openGraphFor } from "@/lib/site";

export const metadata = {
    alternates: { canonical: "/auth/login" },
    openGraph: openGraphFor("/auth/login"),
    title: "Sign In",
    description:
        "Sign in to Thullaabul Ilmi to access memorization, recitation tracking, daily deeds, and other personal features.",
    robots: { index: false, follow: false },
};
export default function LoginLayout({ children }) {
    return children;
}
