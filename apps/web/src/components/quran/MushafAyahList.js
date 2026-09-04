"use client";

import { getLocalizedField } from "@/lib/translation";
import { useQuranFont } from "@/lib/useQuranFont";
import Link from "next/link";
import { sanitizeHtml } from "@/lib/sanitizeHtml";

const getSurahReaderSlug = (ayah, lang) => {
    const surah = ayah?.surah ?? {};
    return (
        surah?.translation?.latin_en ||
        surah?.translation?.latin_idn ||
        surah?.slug ||
        surah?.identifier ||
        ayah?.surah_slug ||
        ayah?.surahSlug ||
        ayah?.surah_identifier ||
        ayah?.surahIdentifier ||
        ayah?.surah_name ||
        ayah?.surahName ||
        ayah?.surah_latin ||
        ayah?.surahLatin ||
        getLocalizedField(surah, "name", lang) ||
        surah?.number ||
        ayah?.surah_number ||
        ayah?.surahNumber ||
        surah?.id ||
        ""
    );
};

const getSurahDisplayName = (ayah, lang) => {
    const surah = ayah?.surah ?? {};
    return (
        getLocalizedField(surah, "name", lang) ||
        surah?.translation?.latin_en ||
        surah?.translation?.latin_idn ||
        surah?.translation?.name ||
        ayah?.surah_name ||
        ayah?.surahName ||
        ayah?.surah_latin ||
        ayah?.surahLatin ||
        ayah?.surah_slug ||
        ayah?.surahSlug ||
        surah?.slug ||
        surah?.identifier ||
        ""
    );
};

const getSurahNumber = (ayah) =>
    ayah?.surah?.number || ayah?.surah_number || ayah?.surahNumber;

const getArabicHTML = (ayah) =>
    ayah?.translation?.ar_html ||
    ayah?.translation?.ar ||
    ayah?.ar_html ||
    ayah?.arabic ||
    "";

const getAyahTranslation = (ayah, lang) => {
    const key = lang === "EN" ? "en" : "idn";
    return (
        ayah?.translation?.[key] ||
        ayah?.translation?.idn ||
        ayah?.translation?.en ||
        ""
    );
};

export default function MushafAyahList({
    ayahs,
    lang,
    readerBasePath = "/quran/surah",
    t,
}) {
    const { arabicFontSize, fontCls, translationFontSize } = useQuranFont();

    if (!ayahs.length) return null;

    return (
        <div className='space-y-3'>
            <p className='text-xs text-gray-500 dark:text-gray-300 dark:text-gray-400 mb-2'>
                {ayahs.length} {t("mushaf.ayah_unit")}
            </p>
            {ayahs.map((ayah) => {
                const slug = getSurahReaderSlug(ayah, lang);
                const displayName = getSurahDisplayName(ayah, lang);
                const surahNumber = getSurahNumber(ayah);
                const arabicHtml = getArabicHTML(ayah);
                const translation = getAyahTranslation(ayah, lang);
                const href = `${readerBasePath}/${encodeURIComponent(slug)}#ayah-${ayah.number}`;

                return (
                    <div
                        key={ayah.id}
                        className='bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4'
                    >
                        <div className='flex min-w-0 items-center justify-between gap-3 mb-2 text-xs text-gray-400'>
                            <Link
                                href={href}
                                className='min-w-0 truncate font-semibold text-emerald-700 dark:text-emerald-400 hover:underline'
                            >
                                {surahNumber}. {displayName}
                            </Link>
                            <span>
                                {t("mushaf.ayah")} {ayah.number}
                            </span>
                        </div>
                        <p
                            className={`${fontCls} text-right text-emerald-900 dark:text-white`}
                            style={{
                                direction: "rtl",
                                fontSize: `${arabicFontSize}px`,
                                lineHeight: "2.1",
                            }}
                            dangerouslySetInnerHTML={{
                                __html: sanitizeHtml(arabicHtml),
                            }}
                        />
                        {translation && (
                            <p
                                className='text-gray-600 dark:text-gray-300 mt-2'
                                style={{
                                    fontSize: `${translationFontSize}px`,
                                    lineHeight: "1.75",
                                }}
                            >
                                {translation}
                            </p>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
