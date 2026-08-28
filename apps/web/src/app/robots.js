import { SITE_URL } from "@/lib/site";

export default function robots() {
    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: [
                    "/admin/",
                    "/auth/",
                    "/profile/",
                    "/stats/",
                    "/bookmarks/",
                    "/notes/",
                    "/notifications/",
                    "/goals/",
                    "/muhasabah/",
                    "/sholat-tracker/",
                    "/tilawah/",
                    "/hafalan/",
                    "/amalan/",
                    "/dev/",
                ],
            },
        ],
        sitemap: `${SITE_URL}/sitemap.xml`,
    };
}
