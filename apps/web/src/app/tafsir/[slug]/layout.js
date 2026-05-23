const API_URL = process.env.API_INTERNAL_URL || process.env.API_PROXY_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:29900';
const SITE_URL =
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tholabul-ilmi.com';

async function getSurah(slug) {
    try {
        const res = await fetch(
            `${API_URL}/api/v1/surah/name/${encodeURIComponent(slug)}?page=0&size=1`,
            { next: { revalidate: 86400 } },
        );
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

export async function generateMetadata(props) {
    const params = await props.params;
    const decodedSlug = decodeURIComponent(params.slug);
    const surah = await getSurah(decodedSlug);

    const name = surah?.translation?.latin_en ?? decodedSlug;
    const arabicName = surah?.name ?? '';
    const title = surah
        ? `Tafsir Surah ${name}${arabicName ? ` (${arabicName})` : ''}`
        : `Tafsir Surah — Thullaabul 'Ilmi`;
    const description = surah
        ? `Read the complete tafsir of Surah ${name}, with explanations of the meaning and context of each Quranic verse.`
        : `Read tafsir and explanations of Quranic meanings by surah on Thullaabul Ilmi.`;
    const canonicalUrl = `${SITE_URL}/tafsir/${params.slug}`;

    return {
        title,
        description,
        alternates: { canonical: canonicalUrl },
        openGraph: {
            title,
            description,
            url: canonicalUrl,
            images: [{ url: '/og', width: 1200, height: 630 }],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: ['/og'],
        },
    };
}

export default function TafsirSurahLayout({ children }) {
    return children;
}
