import { SITE_URL } from "@/lib/site";
import { SURAH_LIST } from "@/lib/surahList";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

const API_URL =
    process.env.API_INTERNAL_URL ||
    process.env.API_PROXY_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:29900";

const FALLBACK_HADITH_BOOKS = [
    "bukhari",
    "muslim",
    "abudaud",
    "tirmidzi",
    "nasai",
    "ibnumajah",
    "malik",
    "ahmad",
    "darimi",
];

const url = (
    path,
    priority = 0.7,
    changeFrequency = "weekly",
    lastModified = new Date(),
) => ({
    url: `${SITE_URL}${path}`,
    lastModified:
        lastModified instanceof Date
            ? lastModified
            : new Date(lastModified || Date.now()),
    changeFrequency,
    priority,
});

const staticRoutes = [
    url("/", 1.0, "daily"),
    url("/quran", 0.9, "weekly"),
    url("/quran/page-mushaf", 0.8, "weekly"),
    url("/hadith", 0.9, "weekly"),
    url("/doa", 0.8, "weekly"),
    url("/dzikir", 0.8, "weekly"),
    url("/asmaul-husna", 0.8, "weekly"),
    url("/asmaul-husna/wirid", 0.7, "weekly"),
    url("/asmaul-husna/flashcard", 0.7, "weekly"),
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
    url("/wirid-custom", 0.6, "weekly"),
    url("/zakat", 0.7, "weekly"),
    url("/zakat/history", 0.5, "monthly"),
    url("/belajar", 0.7, "weekly"),
    url("/belajar/lessons", 0.7, "weekly"),
    url("/faraidh", 0.6, "monthly"),
    url("/forum", 0.6, "daily"),
    url("/forum/ask", 0.6, "weekly"),
    url("/hadits", 0.7, "weekly"),
    url("/imsakiyah", 0.6, "daily"),
    url("/khatam", 0.6, "weekly"),
    url("/komunitas", 0.6, "weekly"),
    url("/library", 0.7, "weekly"),
    url("/manasik", 0.7, "monthly"),
    url("/perawi", 0.6, "weekly"),
    url("/peta", 0.6, "weekly"),
    url("/sejarah", 0.7, "weekly"),
    url("/tasbih", 0.6, "weekly"),
    url("/tokoh", 0.6, "weekly"),
    url("/muroja-ah", 0.6, "weekly"),
    url("/feed", 0.6, "daily"),
    url("/contact", 0.5, "monthly"),
    url("/extension", 0.7, "monthly"),
    url("/search", 0.5, "weekly"),
];

const privateRoutes = [
    "/admin/",
    "/auth/",
    "/dashboard/",
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
];

const publicStaticRoutes = staticRoutes.filter(
    (route) =>
        !privateRoutes.some((path) =>
            route.url.startsWith(`${SITE_URL}${path}`),
        ),
);

async function getSurahAndTafsirRoutes() {
    try {
        const res = await fetch(
            `${API_URL}/api/v1/surah?size=114&sort=number`,
            {
                next: { revalidate: 86400 },
            },
        );
        if (res.ok) {
            const data = await res.json();
            const items = data?.items ?? data?.data ?? [];
            if (Array.isArray(items) && items.length > 0) {
                const quranRoutes = items.map((s) =>
                    url(
                        `/quran/surah/${s.slug ?? s.translation?.latin_en ?? s.number ?? s.id}`,
                        0.8,
                        "weekly",
                    ),
                );
                const tafsirRoutes = items.map((s) =>
                    url(`/tafsir/${s.number ?? s.id}`, 0.7, "weekly"),
                );
                return [...quranRoutes, ...tafsirRoutes];
            }
        }
    } catch {
        // Fallback to SURAH_LIST
    }

    const quranRoutes = SURAH_LIST.map((s) =>
        url(`/quran/surah/${s.number}`, 0.8, "weekly"),
    );
    const tafsirRoutes = SURAH_LIST.map((s) =>
        url(`/tafsir/${s.number}`, 0.7, "weekly"),
    );
    return [...quranRoutes, ...tafsirRoutes];
}

async function getHadithRoutes() {
    try {
        const res = await fetch(`${API_URL}/api/v1/books?size=20`, {
            next: { revalidate: 86400 },
        });
        if (res.ok) {
            const data = await res.json();
            const items = data?.items ?? data?.data ?? [];
            if (Array.isArray(items) && items.length > 0) {
                return items.map((b) =>
                    url(`/hadith/${b.slug}`, 0.8, "weekly"),
                );
            }
        }
    } catch {
        // Fallback
    }

    return FALLBACK_HADITH_BOOKS.map((slug) =>
        url(`/hadith/${slug}`, 0.8, "weekly"),
    );
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
            url(
                `/siroh/${c.slug ?? c.id}`,
                0.7,
                "monthly",
                c.updated_at || c.created_at,
            ),
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
        return items.map((p) =>
            url(
                `/blog/${p.slug}`,
                0.7,
                "monthly",
                p.published_at || p.updated_at || p.created_at,
            ),
        );
    } catch {
        return [];
    }
}

async function getLibraryRoutes() {
    try {
        const res = await fetch(
            `${API_URL}/api/v1/library/books?page=0&size=200`,
            {
                next: { revalidate: 86400 },
            },
        );
        if (!res.ok) return [];
        const data = await res.json();
        const items = data?.items ?? data?.data ?? [];
        return items.map((b) =>
            url(
                `/library/${b.slug ?? b.id}`,
                0.7,
                "monthly",
                b.updated_at || b.created_at,
            ),
        );
    } catch {
        return [];
    }
}

async function getPerawiRoutes() {
    try {
        const res = await fetch(`${API_URL}/api/v1/perawi?page=0&size=200`, {
            next: { revalidate: 86400 },
        });
        if (!res.ok) return [];
        const data = await res.json();
        const items = data?.items ?? data?.data ?? [];
        return items.map((p) =>
            url(
                `/perawi/${p.id}`,
                0.6,
                "monthly",
                p.updated_at || p.created_at,
            ),
        );
    } catch {
        return [];
    }
}

export default async function sitemap() {
    const [
        surahAndTafsirRoutes,
        hadithRoutes,
        sirohRoutes,
        blogRoutes,
        libraryRoutes,
        perawiRoutes,
    ] = await Promise.all([
        getSurahAndTafsirRoutes(),
        getHadithRoutes(),
        getSirohRoutes(),
        getBlogRoutes(),
        getLibraryRoutes(),
        getPerawiRoutes(),
    ]);

    return [
        ...publicStaticRoutes,
        ...surahAndTafsirRoutes,
        ...hadithRoutes,
        ...sirohRoutes,
        ...blogRoutes,
        ...libraryRoutes,
        ...perawiRoutes,
    ];
}
