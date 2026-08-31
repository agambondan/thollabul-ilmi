"use client";

import { useQuranFont } from "@/lib/useQuranFont";
import { useLocale } from "@/context/Locale";
import { useMemo } from "react";

const toArabicNumber = (n) => {
    const digits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
    return String(n)
        .split("")
        .map((d) => (/\d/.test(d) ? digits[Number(d)] : d))
        .join("");
};

const getSurahNumber = (ayah) =>
    ayah?.surah?.number || ayah?.surah_number || ayah?.surahNumber;

const getSurahName = (ayah) => {
    const s = ayah?.surah ?? {};
    return (
        s?.translation?.latin_en ||
        s?.translation?.latin_idn ||
        s?.slug ||
        s?.identifier ||
        ""
    );
};

const getSurahTranslation = (ayah, lang) => {
    const s = ayah?.surah ?? {};
    const key = lang === "EN" ? "latin_en" : "latin_idn";
    return (
        s?.translation?.[key] || s?.translation?.en || s?.translation?.idn || ""
    );
};

const getAyahArabic = (ayah) =>
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

const getAyahJuz = (ayah) => ayah?.juz || ayah?.juz_number || null;
const getAyahPage = (ayah) => ayah?.page || ayah?.page_number || null;

const getAyahSurahEnd = (ayah) =>
    ayah?.surah_ending || ayah?.is_surah_ending || ayah?.surahEnd || false;

const getAyahJuzEnd = (ayah) =>
    ayah?.juz_ending || ayah?.is_juz_ending || ayah?.juzEnd || false;

const getAyahHizbEnd = (ayah) =>
    ayah?.hizb_ending || ayah?.is_hizb_ending || ayah?.hizbEnd || false;

const getAyahNumberInSurah = (ayah) => {
    if (typeof ayah?.number_in_surah === "number") return ayah.number_in_surah;
    if (typeof ayah?.numberInSurah === "number") return ayah.numberInSurah;
    if (typeof ayah?.ayah_number === "number") return ayah.ayah_number;
    return null;
};

const stripTags = (html) => (html || "").replace(/<[^>]+>/g, "");

export default function MushafContinuousView({
    ayahs,
    lang,
    showTranslation = true,
    readerBasePath = "/quran/surah",
}) {
    const { fontCls, arabicFontSize, translationFontSize, setArabicFontSize } =
        useQuranFont();
    const { t } = useLocale();

    const groups = useMemo(() => {
        const result = [];
        let current = null;
        for (const ayah of ayahs) {
            const surahNumber = getSurahNumber(ayah);
            if (!current || current.surahNumber !== surahNumber) {
                current = {
                    surahNumber,
                    surahName: getSurahName(ayah),
                    surahTranslation: getSurahTranslation(ayah, lang),
                    ayahs: [],
                };
                result.push(current);
            }
            current.ayahs.push(ayah);
        }
        return result;
    }, [ayahs, lang]);

    if (!ayahs.length) return null;

    return (
        <div className='space-y-8'>
            {groups.map((group) => {
                const arabicText = group.ayahs
                    .map((a) => {
                        const num = getAyahNumberInSurah(a) ?? a?.number;
                        return `${stripTags(getAyahArabic(a))} ﴿${toArabicNumber(num)}﴾`;
                    })
                    .join(" ");
                return (
                    <article
                        key={group.surahNumber}
                        className='bg-white dark:bg-slate-800 rounded-2xl border-2 border-emerald-200/70 dark:border-emerald-900/60 shadow-sm overflow-hidden'
                    >
                        <header className='bg-emerald-700 text-white text-center py-3 border-b-2 border-emerald-800'>
                            <p className='text-xs tracking-widest uppercase opacity-80'>
                                {group.surahNumber}
                            </p>
                            <h3 className='text-lg font-bold'>
                                {group.surahTranslation || group.surahName}
                            </h3>
                        </header>

                        <div className='p-5 sm:p-7'>
                            <p
                                className={`${fontCls} text-right text-emerald-900 dark:text-emerald-100`}
                                style={{
                                    direction: "rtl",
                                    fontSize: `${arabicFontSize}px`,
                                    lineHeight: "2.3",
                                    textAlign: "justify",
                                    textJustify: "inter-word",
                                    wordSpacing: "0.05em",
                                }}
                            >
                                {arabicText}
                            </p>

                            {showTranslation && (
                                <div className='mt-6 pt-5 border-t border-gray-100 dark:border-slate-700 space-y-3'>
                                    {group.ayahs.map((ayah) => {
                                        const num =
                                            getAyahNumberInSurah(ayah) ??
                                            ayah?.number;
                                        const translation = getAyahTranslation(
                                            ayah,
                                            lang,
                                        );
                                        return (
                                            <p
                                                key={ayah.id ?? num}
                                                className='text-gray-700 dark:text-gray-300'
                                                style={{
                                                    fontSize: `${translationFontSize}px`,
                                                    lineHeight: "1.75",
                                                }}
                                            >
                                                <span className='inline-block min-w-[2rem] font-semibold text-emerald-700 dark:text-emerald-400'>
                                                    {num}.
                                                </span>{" "}
                                                {translation}
                                            </p>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </article>
                );
            })}

            <div className='sticky bottom-4 flex justify-center'>
                <div className='bg-white/90 dark:bg-slate-800/90 backdrop-blur rounded-full shadow-lg border border-gray-200 dark:border-slate-700 flex items-center gap-1 p-1'>
                    <button
                        type='button'
                        onClick={() => setArabicFontSize(arabicFontSize - 4)}
                        className='w-9 h-9 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 text-lg font-bold text-emerald-700 dark:text-emerald-400'
                        aria-label={t("mushaf.zoom_out")}
                    >
                        −
                    </button>
                    <span className='px-2 text-xs tabular-nums text-gray-600 dark:text-gray-300 min-w-[3rem] text-center'>
                        {arabicFontSize}px
                    </span>
                    <button
                        type='button'
                        onClick={() => setArabicFontSize(arabicFontSize + 4)}
                        className='w-9 h-9 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 text-lg font-bold text-emerald-700 dark:text-emerald-400'
                        aria-label={t("mushaf.zoom_in")}
                    >
                        +
                    </button>
                </div>
            </div>
        </div>
    );
}
