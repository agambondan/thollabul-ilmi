import { openGraphFor } from "@/lib/site";
import HomePageClient from "./HomePageClient";

export const metadata = {
    alternates: { canonical: "/" },
    openGraph: openGraphFor("/"),
};

export default function Home() {
    return <HomePageClient />;
}
