"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useLocale } from "@/context/Locale";
import { useLayoutMode } from "@/lib/useLayoutMode";
import { getLocalizedTranslation } from "@/lib/translation";
import HadithPage from "@/app/hadith/[slug]/HadithPage";
import { BsSearch, BsBook, BsBookmarkCheck, BsCollection, BsArrowLeft } from "react-icons/bs";
import classNames from "classnames";
import ContentWidth from "@/components/layout/ContentWidth";

export default function HadithThemeClient({ hadiths = [], theme = null, slug = "" }) {
    const { t, lang } = useLocale();
    const { isWide } = useLayoutMode();
    const [selectedBook, setSelectedBook] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");

    // Determine theme title
    const themeTranslation = theme?.translation || hadiths[0]?.theme?.translation;
    const themeName = themeTranslation
        ? getLocalizedTranslation(themeTranslation, lang)
        : (slug ? slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " ") : t("hadith.tab_theme") || "Tema");

    const themeArabic = themeTranslation?.ar || "";

    // Extract unique books available in this theme
    const bookStats = useMemo(() => {
        const counts = {};
        const bookMap = {};
        
        hadiths.forEach((h) => {
            const bSlug = h.book?.slug || "unknown";
            counts[bSlug] = (counts[bSlug] || 0) + 1;
            if (!bookMap[bSlug] && h.book) {
                bookMap[bSlug] = {
                    slug: bSlug,
                    name: h.book.translation
                        ? getLocalizedTranslation(h.book.translation, lang)
                        : (h.book.name || bSlug),
                };
            }
        });

        return { counts, bookMap };
    }, [hadiths, lang]);

    // Filtered hadiths based on selected book & search query
    const filteredHadiths = useMemo(() => {
        return hadiths.filter((h) => {
            // Book filter
            if (selectedBook !== "all" && h.book?.slug !== selectedBook) {
                return false;
            }

            // Search query filter (matches translation, arabic, narrator, number)
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const transIdn = (h.translation?.idn || "").toLowerCase();
                const transEn = (h.translation?.en || "").toLowerCase();
                const ar = (h.translation?.ar || "");
                const num = String(h.number || "");
                const bookName = (h.book?.slug || "").toLowerCase();

                return (
                    transIdn.includes(q) ||
                    transEn.includes(q) ||
                    ar.includes(q) ||
                    num.includes(q) ||
                    bookName.includes(q)
                );
            }

            return true;
        });
    }, [hadiths, selectedBook, searchQuery]);

    const bookKeys = Object.keys(bookStats.bookMap);

    return (
        <ContentWidth
            compact='max-w-4xl'
            className='transition-all duration-200 py-4 px-4'
        >
            {/* Breadcrumb Navigation */}
            <nav className='flex items-center gap-2 text-xs md:text-sm text-gray-500 dark:text-gray-400 mb-4' aria-label='Breadcrumb'>
                <Link
                    href='/hadith'
                    className='hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1'
                >
                    <BsArrowLeft className='text-xs' />
                    {t("hadith.title") || "Hadis"}
                </Link>
                <span>/</span>
                <Link
                    href='/hadith'
                    className='hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors'
                >
                    {t("hadith.tab_theme") || "Tema"}
                </Link>
                <span>/</span>
                <span className='text-emerald-700 dark:text-emerald-400 font-semibold truncate max-w-[200px] md:max-w-none'>
                    {themeName}
                </span>
            </nav>

            {/* Hero / Header Card */}
            <header className='relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white p-6 md:p-8 shadow-xl mb-6 border border-emerald-700/40'>
                {/* Decorative background pattern */}
                <div className='absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none' />
                <div className='absolute right-4 top-4 text-emerald-300/10 text-7xl font-arabic font-bold select-none pointer-events-none'>
                    {themeArabic || "حديث"}
                </div>

                <div className='relative z-10'>
                    <div className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-700/60 border border-emerald-500/30 text-emerald-200 text-xs font-medium mb-3 backdrop-blur-sm'>
                        <BsCollection className='text-xs' />
                        <span>{t("hadith.tab_theme") || "Tema Hadis"}</span>
                    </div>

                    <div className='flex flex-col md:flex-row md:items-baseline md:justify-between gap-2'>
                        <div>
                            <h1 className='text-2xl md:text-4xl font-bold tracking-tight'>
                                {themeName}
                            </h1>
                            {themeArabic && (
                                <p className='text-lg md:text-xl font-arabic text-emerald-200/90 mt-1 font-medium'>
                                    {themeArabic}
                                </p>
                            )}
                        </div>

                        <div className='flex items-center gap-2 mt-2 md:mt-0'>
                            <span className='inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-sm font-semibold text-emerald-100 shadow-sm'>
                                <BsBook className='text-xs text-emerald-300' />
                                {hadiths.length} {t("hadith.unit") || "Hadits"}
                            </span>
                        </div>
                    </div>

                    {/* Quick filter & search toolbar */}
                    <div className='mt-6 pt-5 border-t border-emerald-700/50 flex flex-col md:flex-row gap-3 md:items-center md:justify-between'>
                        {/* Book Filter Pills */}
                        <div className='flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none'>
                            <button
                                type='button'
                                onClick={() => setSelectedBook("all")}
                                className={classNames(
                                    "px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shadow-sm",
                                    selectedBook === "all"
                                        ? "bg-white text-emerald-900 shadow-emerald-950/20"
                                        : "bg-emerald-800/60 text-emerald-200 hover:bg-emerald-700/60 border border-emerald-600/30"
                                )}
                            >
                                Semua ({hadiths.length})
                            </button>
                            {bookKeys.map((bSlug) => {
                                const b = bookStats.bookMap[bSlug];
                                const count = bookStats.counts[bSlug] || 0;
                                const isActive = selectedBook === bSlug;
                                return (
                                    <button
                                        key={bSlug}
                                        type='button'
                                        onClick={() => setSelectedBook(bSlug)}
                                        className={classNames(
                                            "px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shadow-sm",
                                            isActive
                                                ? "bg-white text-emerald-900 shadow-emerald-950/20"
                                                : "bg-emerald-800/60 text-emerald-200 hover:bg-emerald-700/60 border border-emerald-600/30"
                                        )}
                                    >
                                        {b.name} ({count})
                                    </button>
                                );
                            })}
                        </div>

                        {/* Instant Search in Theme */}
                        <div className='relative min-w-[200px] md:w-64'>
                            <BsSearch className='absolute left-3 top-1/2 -translate-y-1/2 text-emerald-300/70 text-xs' />
                            <input
                                type='text'
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={t("hadith.search_placeholder") || "Cari dalam tema ini..."}
                                className='w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-emerald-950/40 border border-emerald-600/40 text-white placeholder-emerald-300/50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-emerald-950/60 transition-all'
                            />
                            {searchQuery && (
                                <button
                                    type='button'
                                    onClick={() => setSearchQuery("")}
                                    className='absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] bg-emerald-700/80 hover:bg-emerald-600 text-white rounded-full w-4 h-4 flex items-center justify-center'
                                >
                                    ×
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Results Info if filtering */}
            {(selectedBook !== "all" || searchQuery.trim()) && (
                <div className='mb-4 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 px-1'>
                    <span>
                        Menampilkan <strong>{filteredHadiths.length}</strong> dari {hadiths.length} hadis
                        {selectedBook !== "all" && ` dalam ${bookStats.bookMap[selectedBook]?.name || selectedBook}`}
                        {searchQuery.trim() && ` untuk kata kunci "${searchQuery}"`}
                    </span>
                    <button
                        type='button'
                        onClick={() => {
                            setSelectedBook("all");
                            setSearchQuery("");
                        }}
                        className='text-emerald-600 dark:text-emerald-400 hover:underline font-medium'
                    >
                        Reset Filter
                    </button>
                </div>
            )}

            {/* Hadiths Content Feed */}
            {filteredHadiths.length === 0 ? (
                <div className='py-16 px-4 text-center rounded-2xl border border-dashed border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 my-6'>
                    <p className='text-gray-500 dark:text-gray-400 text-sm font-medium'>
                        Tidak ada hadits yang sesuai dengan kriteria pencarian atau filter kitab.
                    </p>
                    <button
                        type='button'
                        onClick={() => {
                            setSelectedBook("all");
                            setSearchQuery("");
                        }}
                        className='mt-3 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-sm'
                    >
                        Tampilkan Semua Hadits
                    </button>
                </div>
            ) : (
                <div className='flex flex-col gap-5'>
                    {filteredHadiths.map((hadith) => (
                        <article
                            key={hadith.id}
                            className='rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden transition-all hover:shadow-md'
                        >
                            <HadithPage
                                params={{ slug: hadith.book?.slug || slug }}
                                book={hadith.book}
                                hadith={hadith}
                            />
                        </article>
                    ))}
                </div>
            )}
        </ContentWidth>
    );
}
