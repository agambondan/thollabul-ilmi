import Section from "@/components/Section";
import { TafsirSurahContent } from "@/app/tafsir/[slug]/TafsirDetailClient";
import { normalizeTafsirEntry } from "@/lib/tafsirContent";

export const revalidate = 86400;

const API_URL =
    process.env.API_INTERNAL_URL ||
    process.env.API_PROXY_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "https://api.thollabulilmi.site";

async function getSurahData(slug) {
    try {
        const res = await fetch(
            `${API_URL}/api/v1/surah/name/${encodeURIComponent(slug)}?page=0&size=300`,
            { next: { revalidate: 86400 } },
        );
        if (!res.ok) return null;
        return res.json();
    } catch {
        return null;
    }
}

async function getTafsirMap(surahNumber) {
    if (!surahNumber) return {};
    try {
        const res = await fetch(
            `${API_URL}/api/v1/tafsir/surah/${surahNumber}`,
            { next: { revalidate: 86400 } },
        );
        if (!res.ok) return {};
        const data = await res.json();
        const map = {};
        const list = Array.isArray(data)
            ? data
            : (data?.tafsirs ?? data?.items ?? []);
        list.forEach((entry, index) => {
            const normalized = normalizeTafsirEntry(entry, index);
            [entry.ayah_id, entry.ayah?.id, normalized.ayahNumber]
                .filter(Boolean)
                .forEach((key) => {
                    map[key] = normalized;
                });
        });
        return map;
    } catch {
        return {};
    }
}

const TafsirSurahPage = async (props) => {
    const params = await props.params;
    const decodedSlug = decodeURIComponent(params.slug);

    const initialSurah = await getSurahData(decodedSlug);
    const initialTafsirMap = await getTafsirMap(initialSurah?.number);

    return (
        <main className='min-h-screen flex flex-col'>
            <Section>
                <TafsirSurahContent
                    slug={params.slug}
                    initialSurah={initialSurah}
                    initialTafsirMap={initialTafsirMap}
                />
            </Section>
        </main>
    );
};

export { TafsirSurahContent };
export default TafsirSurahPage;
