"use client";

import Section from "@/components/Section";
import { useLocale } from "@/context/Locale";
import { useLayoutMode } from "@/lib/useLayoutMode";
import { tafsirApi } from "@/lib/api";
import {
    getTafsirPrimary,
    getTafsirSecondary,
    normalizeTafsirEntry,
} from "@/lib/tafsirContent";
import Link from "next/link";
import { useEffect, useState, use } from "react";
import {
    BsChevronDown,
    BsChevronLeft,
    BsChevronUp,
    BsSearch,
} from "react-icons/bs";
import { MdOutlineAutoStories } from "react-icons/md";
import InlineError from "@/components/InlineError";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export const TafsirSurahContent = ({
    slug,
    tafsirBasePath = "/tafsir",
    quranBasePath = "/quran/surah",
}) => {
    const { t } = useLocale();
    const { isWide } = useLayoutMode();
    const decodedSlug = decodeURIComponent(slug);

    const [surah, setSurah] = useState(null);
    const [ayahs, setAyahs] = useState([]);
    const [tafsirMap, setTafsirMap] = useState({});
    const [isLoadingAyah, setIsLoadingAyah] = useState(true);
    const [ayahLoadFailed, setAyahLoadFailed] = useState(false);
    const [isLoadingTafsir, setIsLoadingTafsir] = useState(true);
    const [open, setOpen] = useState(new Set());
    const [showLatin, setShowLatin] = useState(true);
    const [showTranslation, setShowTranslation] = useState(true);
    const [search, setSearch] = useState("");
    const [kitabFilter, setKitabFilter] = useState("all");
    const [sideBySide, setSideBySide] = useState(false);

    useEffect(() => {
        setIsLoadingAyah(true);
        fetch(
            `${API_URL}/api/v1/surah/name/${encodeURIComponent(decodedSlug)}?page=0&size=300`,
        )
            .then((r) => r.json())
            .then((data) => {
                setSurah(data);
                setAyahs(data?.ayahs ?? []);
                if (data?.number) {
                    loadTafsir(data.number);
                }
            })
            .catch(() => setAyahLoadFailed(true))
            .finally(() => setIsLoadingAyah(false));
    }, [decodedSlug]);

    const loadTafsir = (surahNumber) => {
        setIsLoadingTafsir(true);
        tafsirApi
            .bySurah(surahNumber)
            .then((r) => r.json())
            .then((data) => {
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
                setTafsirMap(map);
            })
            .catch(() => setTafsirMap({}))
            .finally(() => setIsLoadingTafsir(false));
    };

    const toggle = (id) => {
        setOpen((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const expandAll = () => setOpen(new Set(ayahs.map((a) => a.id)));
    const collapseAll = () => setOpen(new Set());

    const hasTafsirData = Object.keys(tafsirMap).length > 0;
    const isLoading = isLoadingAyah;
    const showLoadError = ayahLoadFailed && !isLoadingAyah;
    const query = search.trim().toLowerCase();
    const visibleAyahs = ayahs.filter((ayah) => {
        if (!query) return true;
        const tafsir = tafsirMap[ayah.id] ?? tafsirMap[ayah.number];
        const haystack = [
            ayah.number,
            ayah.translation?.ar,
            ayah.text,
            ayah.arab,
            ayah.translation?.latin_idn,
            ayah.transliteration,
            ayah.translation?.idn,
            ayah.translation?.en,
            ayah.terjemahan,
            ayah.meaning,
            tafsir?.content,
            tafsir?.text,
            tafsir?.description,
            tafsir?.primaryTafsir,
            tafsir?.secondaryTafsir,
            tafsir?.source,
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
        return haystack.includes(query);
    });

    return (
        <div
            className={
                isWide ? "w-full px-4" : "container mx-auto px-4 max-w-2xl"
            }
        >
            {/* Back + header */}
            <div className='flex items-center gap-3 mb-6'>
                <Link
                    href={tafsirBasePath}
                    className='p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-gray-500 dark:text-gray-400'
                >
                    <BsChevronLeft />
                </Link>
                <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center'>
                        <MdOutlineAutoStories className='text-xl text-emerald-700 dark:text-emerald-400' />
                    </div>
                    <div>
                        <h1 className='text-xl font-bold text-emerald-900 dark:text-white'>
                            {surah
                                ? `${surah.translation?.latin_en ?? decodedSlug} — Tafsir`
                                : t("tafsir.surah_title")}
                        </h1>
                        {surah && (
                            <p className='text-xs text-gray-500 dark:text-gray-400'>
                                {t("tafsir.surah_number_prefix")}
                                {surah.number} ·{" "}
                                {surah.number_of_ayahs ?? ayahs.length}{" "}
                                {t("common.verse")}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Display controls */}
            <div className='flex items-center gap-2 mb-4 flex-wrap'>
                <button
                    onClick={() => setShowLatin((v) => !v)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${showLatin ? "bg-emerald-700 text-white" : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300"}`}
                >
                    Latin
                </button>
                <button
                    onClick={() => setShowTranslation((v) => !v)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${showTranslation ? "bg-emerald-700 text-white" : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300"}`}
                >
                    {t("tafsir.translation_toggle")}
                </button>
                <select
                    value={kitabFilter}
                    onChange={(e) => setKitabFilter(e.target.value)}
                    className='px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-400'
                >
                    <option value='all'>
                        {t("tafsir.kitab_all") ?? "Semua Tafsir"}
                    </option>
                    <option value='kemenag'>
                        {t("tafsir.kitab_kemenag") ?? "Tafsir Kemenag"}
                    </option>
                    <option value='ibnu_katsir'>
                        {t("tafsir.kitab_ibnu_katsir") ?? "Tafsir Al-Mishbah"}
                    </option>
                </select>
                <button
                    onClick={() => setSideBySide((v) => !v)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${sideBySide ? "bg-emerald-700 text-white" : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300"}`}
                >
                    {t("tafsir.side_by_side") ?? "Bandingkan"}
                </button>
                <div className='ml-auto flex gap-2'>
                    <button
                        onClick={expandAll}
                        className='text-xs text-emerald-600 dark:text-emerald-400 hover:underline'
                    >
                        {t("tafsir.expand_all")}
                    </button>
                    <button
                        onClick={collapseAll}
                        className='text-xs text-gray-400 hover:underline'
                    >
                        {t("tafsir.collapse_all")}
                    </button>
                </div>
            </div>

            <div className='flex items-center gap-2 mb-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 px-3 py-2'>
                <BsSearch className='text-gray-400 shrink-0' />
                <input
                    type='text'
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t("tafsir.surah_search_placeholder")}
                    className='flex-1 bg-transparent text-sm text-gray-700 dark:text-gray-200 outline-none'
                />
                {search && (
                    <button
                        type='button'
                        onClick={() => setSearch("")}
                        className='text-xs font-medium text-emerald-600 dark:text-emerald-400'
                    >
                        {t("common.clear")}
                    </button>
                )}
            </div>

            {!isLoading && ayahs.length > 0 && (
                <div className='mb-3 flex items-center justify-between text-xs text-gray-400'>
                    <span>
                        {t("common.showing")} {visibleAyahs.length}{" "}
                        {t("common.of")} {ayahs.length} {t("common.verse")}
                    </span>
                    {search && (
                        <button
                            type='button'
                            onClick={() => setSearch("")}
                            className='font-medium text-emerald-600 dark:text-emerald-400'
                        >
                            {t("common.reset_search")}
                        </button>
                    )}
                </div>
            )}

            {/* Tafsir data status */}
            {!isLoadingTafsir && !hasTafsirData && ayahs.length > 0 && (
                <div className='bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/40 rounded-xl px-4 py-3 mb-5'>
                    <p className='text-xs text-amber-700 dark:text-amber-400'>
                        {t("tafsir.surah_unavailable")}
                    </p>
                </div>
            )}

            {/* Loading */}
            {showLoadError && <InlineError />}
            {isLoading && (
                <div className='space-y-2'>
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div
                            key={i}
                            className='h-16 bg-gray-100 dark:bg-slate-700 rounded-xl animate-pulse'
                        />
                    ))}
                </div>
            )}

            {/* Error state */}
            {!isLoading && !showLoadError && ayahs.length === 0 && (
                <div className='text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700'>
                    <MdOutlineAutoStories className='text-5xl text-gray-200 dark:text-slate-600 mx-auto mb-3' />
                    <p className='text-gray-500 dark:text-gray-400 mb-1'>
                        {t("quran.not_found")}
                    </p>
                    <Link
                        href={tafsirBasePath}
                        className='mt-3 inline-block text-sm text-emerald-600 dark:text-emerald-400 hover:underline'
                    >
                        {t("tafsir.back_to_surah_list")}
                    </Link>
                </div>
            )}

            {/* Ayah list */}
            {!isLoading && ayahs.length > 0 && visibleAyahs.length > 0 && (
                <div className='space-y-2'>
                    {visibleAyahs.map((ayah) => {
                        const tafsir =
                            tafsirMap[ayah.id] ?? tafsirMap[ayah.number];
                        const isOpen = open.has(ayah.id);
                        const primaryTafsir = getTafsirPrimary(tafsir);
                        const secondaryTafsir = getTafsirSecondary(tafsir);
                        return (
                            <div
                                key={ayah.id}
                                className='bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden'
                            >
                                {/* Ayah header */}
                                <button
                                    onClick={() => toggle(ayah.id)}
                                    className='w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors text-left'
                                >
                                    <span className='w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center justify-center flex-shrink-0'>
                                        {ayah.number}
                                    </span>
                                    <div className='flex-1 min-w-0'>
                                        <p
                                            dir='rtl'
                                            className='text-base font-arabic text-gray-900 dark:text-white text-right leading-relaxed line-clamp-1'
                                        >
                                            {ayah.translation?.ar ??
                                                ayah.text ??
                                                ayah.arab}
                                        </p>
                                    </div>
                                    {isOpen ? (
                                        <BsChevronUp className='text-gray-400 flex-shrink-0' />
                                    ) : (
                                        <BsChevronDown className='text-gray-400 flex-shrink-0' />
                                    )}
                                </button>

                                {/* Ayah content */}
                                {isOpen && (
                                    <div className='border-t border-gray-100 dark:border-slate-700 px-4 py-4 space-y-3'>
                                        {/* Arabic */}
                                        <p
                                            dir='rtl'
                                            className='text-2xl leading-loose font-arabic text-gray-900 dark:text-white text-right'
                                        >
                                            {ayah.translation?.ar ??
                                                ayah.text ??
                                                ayah.arab}
                                        </p>

                                        {/* Latin */}
                                        {showLatin &&
                                            (ayah.translation?.latin_idn ??
                                                ayah.transliteration) && (
                                                <p className='text-sm text-emerald-700 dark:text-emerald-400 italic'>
                                                    {ayah.translation
                                                        ?.latin_idn ??
                                                        ayah.transliteration}
                                                </p>
                                            )}

                                        {/* Translation */}
                                        {showTranslation && (
                                            <p className='text-sm text-gray-600 dark:text-gray-300 leading-relaxed border-l-2 border-emerald-200 dark:border-emerald-800 pl-3'>
                                                {ayah.translation?.idn ??
                                                    ayah.translation?.en ??
                                                    ayah.terjemahan ??
                                                    ayah.meaning ??
                                                    "—"}
                                            </p>
                                        )}

                                        {/* Tafsir */}
                                        {primaryTafsir || secondaryTafsir ? (
                                            sideBySide &&
                                            kitabFilter === "all" &&
                                            primaryTafsir &&
                                            secondaryTafsir ? (
                                                <div className='grid grid-cols-2 gap-3'>
                                                    <div className='bg-emerald-50 dark:bg-emerald-900/20 rounded-lg px-4 py-3'>
                                                        <p className='text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide mb-1'>
                                                            {t(
                                                                "tafsir.kitab_kemenag_label",
                                                            ) ??
                                                                "Tafsir Kemenag"}
                                                        </p>
                                                        <p className='text-sm text-gray-700 dark:text-gray-300 leading-relaxed'>
                                                            {primaryTafsir}
                                                        </p>
                                                    </div>
                                                    <div className='bg-sky-50 dark:bg-sky-900/20 rounded-lg px-4 py-3'>
                                                        <p className='text-xs font-semibold text-sky-700 dark:text-sky-400 uppercase tracking-wide mb-1'>
                                                            {t(
                                                                "tafsir.kitab_ibnu_katsir_label",
                                                            ) ??
                                                                "Tafsir Al-Mishbah"}
                                                        </p>
                                                        <p className='text-sm text-gray-700 dark:text-gray-300 leading-relaxed'>
                                                            {secondaryTafsir}
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className='space-y-3'>
                                                    {primaryTafsir &&
                                                    kitabFilter !==
                                                        "ibnu_katsir" ? (
                                                        <div className='bg-emerald-50 dark:bg-emerald-900/20 rounded-lg px-4 py-3'>
                                                            <p className='text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide mb-1'>
                                                                {t(
                                                                    "tafsir.kitab_kemenag_label",
                                                                ) ??
                                                                    "Tafsir Kemenag"}
                                                            </p>
                                                            <p className='text-sm text-gray-700 dark:text-gray-300 leading-relaxed'>
                                                                {primaryTafsir}
                                                            </p>
                                                        </div>
                                                    ) : null}
                                                    {secondaryTafsir &&
                                                    kitabFilter !==
                                                        "kemenag" ? (
                                                        <div className='bg-sky-50 dark:bg-sky-900/20 rounded-lg px-4 py-3'>
                                                            <p className='text-xs font-semibold text-sky-700 dark:text-sky-400 uppercase tracking-wide mb-1'>
                                                                {t(
                                                                    "tafsir.kitab_ibnu_katsir_label",
                                                                ) ??
                                                                    "Tafsir Al-Mishbah"}
                                                            </p>
                                                            <p className='text-sm text-gray-700 dark:text-gray-300 leading-relaxed'>
                                                                {
                                                                    secondaryTafsir
                                                                }
                                                            </p>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            )
                                        ) : (
                                            <div className='bg-gray-50 dark:bg-slate-700/40 rounded-lg px-4 py-3'>
                                                <p className='text-xs text-gray-400 italic'>
                                                    {t("ayah.tafsir_empty")}
                                                </p>
                                            </div>
                                        )}

                                        {/* Link to quran */}
                                        <Link
                                            href={`${quranBasePath}/${encodeURIComponent(decodedSlug)}#ayah-${ayah.number}`}
                                            className='text-xs text-emerald-600 dark:text-emerald-400 hover:underline'
                                        >
                                            {t("tafsir.read_in_quran")}
                                        </Link>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {!isLoading && ayahs.length > 0 && visibleAyahs.length === 0 && (
                <div className='text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700'>
                    <BsSearch className='text-5xl text-gray-200 dark:text-slate-600 mx-auto mb-3' />
                    <p className='text-gray-500 dark:text-gray-400 mb-1'>
                        {t("tafsir.no_search_match")}
                    </p>
                    <button
                        type='button'
                        onClick={() => setSearch("")}
                        className='mt-3 inline-block text-sm text-emerald-600 dark:text-emerald-400 hover:underline'
                    >
                        {t("common.clear_search")}
                    </button>
                </div>
            )}
        </div>
    );
};

const TafsirSurahPage = (props) => {
    const params = use(props.params);

    return (
        <main className='min-h-screen flex flex-col'>
            <Section>
                <TafsirSurahContent slug={params.slug} />
            </Section>
        </main>
    );
};

export default TafsirSurahPage;
