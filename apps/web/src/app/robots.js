const SITE_URL =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://tholabul-ilmi.com";

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
