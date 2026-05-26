'use client';

import { getLocalizedField } from '@/lib/translation';
import { useQuranFont } from '@/lib/useQuranFont';
import Link from 'next/link';

const getSurahReaderSlug = (surah, lang) =>
    surah?.translation?.latin_en ||
    surah?.translation?.latin_idn ||
    surah?.slug ||
    surah?.identifier ||
    getLocalizedField(surah, 'name', lang) ||
    surah?.number ||
    surah?.id ||
    '';

const getSurahDisplayName = (surah, lang) =>
    getLocalizedField(surah, 'name', lang) ||
    surah?.translation?.latin_en ||
    surah?.translation?.latin_idn ||
    surah?.translation?.name ||
    surah?.slug ||
    surah?.identifier ||
    '';

const getArabicHTML = (ayah) =>
    ayah?.translation?.ar_html ||
    ayah?.translation?.ar ||
    ayah?.ar_html ||
    ayah?.arabic ||
    '';

const getAyahTranslation = (ayah, lang) => {
    const key = lang === 'EN' ? 'en' : 'idn';
    return ayah?.translation?.[key] || ayah?.translation?.idn || ayah?.translation?.en || '';
};

export default function MushafAyahList({
    ayahs,
    lang,
    readerBasePath = '/quran/surah',
    t,
}) {
    const { arabicFontSize, fontCls, translationFontSize } = useQuranFont();

    if (!ayahs.length) return null;

    return (
        <div className='space-y-3'>
            <p className='text-xs text-gray-500 dark:text-gray-400 mb-2'>
                {ayahs.length} {t('mushaf.ayah_unit')}
            </p>
            {ayahs.map((ayah) => {
                const surah = ayah.surah ?? {};
                const slug = getSurahReaderSlug(surah, lang);
                const displayName = getSurahDisplayName(surah, lang);
                const arabicHtml = getArabicHTML(ayah);
                const translation = getAyahTranslation(ayah, lang);
                const href = `${readerBasePath}/${encodeURIComponent(slug)}#ayah-${ayah.number}`;

                return (
                    <div
                        key={ayah.id}
                        className='bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4'
                    >
                        <div className='flex items-center justify-between mb-2 text-xs text-gray-400 dark:text-gray-500'>
                            <Link
                                href={href}
                                className='font-semibold text-emerald-700 dark:text-emerald-400 hover:underline'
                            >
                                {surah?.number}. {displayName}
                            </Link>
                            <span>
                                {t('mushaf.ayah')} {ayah.number}
                            </span>
                        </div>
                        <p
                            className={`${fontCls} text-right text-emerald-900 dark:text-white`}
                            style={{
                                direction: 'rtl',
                                fontSize: `${arabicFontSize}px`,
                                lineHeight: '2.1',
                            }}
                            dangerouslySetInnerHTML={{ __html: arabicHtml }}
                        />
                        {translation && (
                            <p
                                className='text-gray-600 dark:text-gray-300 mt-2'
                                style={{ fontSize: `${translationFontSize}px`, lineHeight: '1.75' }}
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
