import { OG_IMAGE, serializeJsonLd, SITE_NAME, SITE_URL } from "@/lib/site";
import { getSurahMeaning, getSurahName } from "@/lib/surahList";
const API_URL =
    process.env.API_INTERNAL_URL ||
    process.env.API_PROXY_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:29900";

async function getSurah(slug) {
    try {
        const res = await fetch(`${API_URL}/api/v1/surah/name/${slug}?size=1`, {
            next: { revalidate: 86400 },
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data?.surah ?? data ?? null;
    } catch {
        return null;
    }
}

export async function generateMetadata(props) {
    const params = await props.params;
    const slugParts = params.slug ?? [];
    const surahSlug = decodeURIComponent(slugParts[1] ?? slugParts[0] ?? "");
    const surah = surahSlug ? await getSurah(surahSlug) : null;

    const name =
        getSurahName(surah, "ID") || surah?.translation?.latin_en || surahSlug;
    const arabicName = surah?.name ?? "";
    const surahNumber = surah?.number ?? "";
    const meaning =
        getSurahMeaning(surah, "ID") ||
        surah?.translation?.idn ||
        surah?.translation?.en ||
        "";

    const title = surah
        ? `Surah ${name}${arabicName ? ` (${arabicName})` : ""} — Al-Quran`
        : `Al-Quran — Thullaabul 'Ilmi`;
    const description = surah
        ? `Read Surah ${name}${surahNumber ? ` (surah no. ${surahNumber})` : ""}${meaning ? `, meaning "${meaning}"` : ""}, with color-coded Tajweed, tafsir, translation, and recitation audio.`
        : `Read the complete 30 juz of the Quran with color-coded Tajweed, tafsir, translation, and recitation audio.`;

    const urlPath = surahSlug ? `/quran/surah/${surahSlug}` : "/quran";
    const canonicalUrl = `${SITE_URL}${urlPath}`;

    return {
        title,
        description,
        alternates: { canonical: canonicalUrl },
        openGraph: {
            type: "website",
            siteName: SITE_NAME,
            title,
            description,
            url: canonicalUrl,
            images: [OG_IMAGE],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [OG_IMAGE.url],
        },
    };
}

export default async function QuranSlugLayout(props) {
    const params = await props.params;
    const { children } = props;
    const slugParts = params?.slug ?? [];
    const surahSlug = decodeURIComponent(slugParts[1] ?? slugParts[0] ?? "");
    const surah = surahSlug ? await getSurah(surahSlug) : null;
    const name =
        getSurahName(surah, "ID") || surah?.translation?.latin_en || surahSlug;
    const urlPath = surahSlug ? `/quran/surah/${surahSlug}` : "/quran";

    const breadcrumbJsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            {
                "@type": "ListItem",
                position: 1,
                name: "Beranda",
                item: `${SITE_URL}/`,
            },
            {
                "@type": "ListItem",
                position: 2,
                name: "Al-Quran",
                item: `${SITE_URL}/quran`,
            },
            ...(surahSlug
                ? [
                      {
                          "@type": "ListItem",
                          position: 3,
                          name: `Surah ${name}`,
                          item: `${SITE_URL}${urlPath}`,
                      },
                  ]
                : []),
        ],
    };

    return (
        <>
            <script
                type='application/ld+json'
                dangerouslySetInnerHTML={{
                    __html: serializeJsonLd(breadcrumbJsonLd),
                }}
            />
            {children}
        </>
    );
}
