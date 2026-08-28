import { SITE_URL } from "@/lib/site";
const API_URL =
    process.env.API_INTERNAL_URL ||
    process.env.API_PROXY_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:29900";

const url = (path, priority = 0.7, changeFrequency = "weekly") => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
});

const staticRoutes = [
    url("/", 1.0, "daily"),
    url("/quran", 0.9, "weekly"),
    url("/hadith", 0.9, "weekly"),
    url("/doa", 0.8, "weekly"),
    url("/dzikir", 0.8, "weekly"),
    url("/asmaul-husna", 0.8, "weekly"),
    url("/siroh", 0.8, "weekly"),
    url("/blog", 0.8, "daily"),
    url("/tafsir", 0.7, "weekly"),
    url("/asbabun-nuzul", 0.7, "weekly"),
    url("/hijri", 0.6, "daily"),
    url("/jadwal-sholat", 0.7, "daily"),
    url("/kiblat", 0.6, "weekly"),
    url("/kamus", 0.6, "weekly"),
    url("/leaderboard", 0.6, "daily"),
    url("/quiz", 0.6, "weekly"),
    url("/fiqh", 0.7, "weekly"),
    url("/kajian", 0.7, "weekly"),
    url("/panduan-sholat", 0.7, "weekly"),
    url("/wirid", 0.7, "weekly"),
    url("/zakat", 0.7, "weekly"),
    url("/contact", 0.5, "monthly"),
    url("/search", 0.5, "weekly"),
];

async function getSurahRoutes() {
    try {
        const res = await fetch(
            `${API_URL}/api/v1/surah?size=114&sort=number`,
            {
                next: { revalidate: 86400 },
            },
        );
        if (!res.ok) return [];
        const data = await res.json();
        const items = data?.items ?? data?.data ?? [];
        return items.map((s) =>
            url(
                `/quran/surah/${s.translation?.latin_en ?? s.slug ?? s.id}`,
                0.8,
                "weekly",
            ),
        );
    } catch {
        return [];
    }
}

async function getHadithRoutes() {
    try {
        const res = await fetch(`${API_URL}/api/v1/books?size=20`, {
            next: { revalidate: 86400 },
        });
        if (!res.ok) return [];
        const data = await res.json();
        return (data?.items ?? []).map((b) =>
            url(`/hadith/${b.slug}`, 0.8, "weekly"),
        );
    } catch {
        return [];
    }
}

async function getSirohRoutes() {
    try {
        const res = await fetch(
            `${API_URL}/api/v1/siroh/contents?page=0&size=200`,
            { next: { revalidate: 86400 } },
        );
        if (!res.ok) return [];
        const data = await res.json();
        const items = data?.items ?? data?.data ?? [];
        return items.map((c) =>
            url(`/siroh/${c.slug ?? c.id}`, 0.7, "monthly"),
        );
    } catch {
        return [];
    }
}

async function getBlogRoutes() {
    try {
        const res = await fetch(
            `${API_URL}/api/v1/blog/posts?page=0&size=200`,
            {
                next: { revalidate: 3600 },
            },
        );
        if (!res.ok) return [];
        const data = await res.json();
        const items = data?.items ?? data?.data ?? [];
        return items.map((p) => url(`/blog/${p.slug}`, 0.7, "monthly"));
    } catch {
        return [];
    }
}

export default async function sitemap() {
    const [surahRoutes, hadithRoutes, sirohRoutes, blogRoutes] =
        await Promise.all([
            getSurahRoutes(),
            getHadithRoutes(),
            getSirohRoutes(),
            getBlogRoutes(),
        ]);

    return [
        ...staticRoutes,
        ...surahRoutes,
        ...hadithRoutes,
        ...sirohRoutes,
        ...blogRoutes,
    ];
}
