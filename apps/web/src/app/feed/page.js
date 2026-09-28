import FeedPage, { FeedContent } from "@/app/feed/FeedPageClient";
import { openGraphFor } from "@/lib/site";

export const metadata = {
    title: "Feed Komunitas",
    description:
        "Feed berbagi kabar dan renungan komunitas Thullaabul 'Ilmi — baca, sukai, dan komentari postingan sesama penuntut ilmu.",
    alternates: { canonical: "/feed" },
    openGraph: openGraphFor("/feed"),
};

export { FeedContent };
export default FeedPage;
