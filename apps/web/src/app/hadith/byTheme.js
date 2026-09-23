"use client";

import { SkeletonInline } from "@/components/skeleton/Skeleton";
import ContentWidth from "@/components/layout/ContentWidth";
import { useLocale } from "@/context/Locale";
import { getLocalizedTranslation } from "@/lib/translation";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const normalizeItems = (data) => data?.items ?? data ?? [];

const ByTheme = ({ themeBasePath = "/hadith/theme" }) => {
    const { t, lang } = useLocale();
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);
    const [themes, setThemes] = useState([]);
    const [books, setBooks] = useState([]);
    const [selectedBookIds, setSelectedBookIds] = useState([]);

    const getThemeLabel = (theme) =>
        getLocalizedTranslation(theme?.translation, lang) ||
        `${t("hadith.tab_theme")} ${theme?.id}`;

    const fetchThemes = async () => {
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/v1/themes?size=250`,
        );
        if (!res.ok) throw new Error(`Themes fetch failed: ${res.status}`);
        return await res.json();
    };

    const fetchBooks = async () => {
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/v1/books?size=50`,
        );
        if (!res.ok) throw new Error(`Books fetch failed: ${res.status}`);
        return await res.json();
    };

    useEffect(() => {
        Promise.all([fetchThemes(), fetchBooks()])
            .then(([themesRes, booksRes]) => {
                setThemes(themesRes);
                setBooks(normalizeItems(booksRes));
                setIsLoading(false);
            })
            .catch(() => {
                setIsError(true);
                setIsLoading(false);
            });
    }, []);

    const themeHasSelectedBook = (theme) => {
        if (!selectedBookIds.length) return true;
        const themeBooks = Array.isArray(theme?.books) ? theme.books : [];
        return themeBooks.some((book) => selectedBookIds.includes(book.id));
    };

    const filteredThemes = useMemo(() => {
        return (themes?.items ?? []).filter(themeHasSelectedBook);
    }, [themes, selectedBookIds]);

    const toggleBook = (bookId) => {
        setSelectedBookIds((prev) =>
            prev.includes(bookId)
                ? prev.filter((id) => id !== bookId)
                : [...prev, bookId],
        );
    };

    const bookLabels = useMemo(() => {
        const map = {};
        books.forEach((book) => {
            map[book.id] = getLocalizedTranslation(book.translation, lang) || book.slug;
        });
        return map;
    }, [books, lang]);

    if (isLoading) return <SkeletonInline rows={4} />;
    if (isError)
        return (
            <div className='flex flex-col items-center justify-center min-h-[40vh] text-center px-4'>
                <p className='text-4xl mb-3'>⚠️</p>
                <h2 className='text-lg font-bold text-emerald-900 dark:text-white mb-2'>
                    {t("hadith.load_error_title")}
                </h2>
                <p className='text-sm text-gray-500 dark:text-gray-400'>
                    {t("hadith.load_error_desc")}
                </p>
            </div>
        );

    return (
        <div className='space-y-4 px-4'>
            <div className='bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4 shadow-sm'>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3'>
                    {t("hadith.filter_perawi") || (lang === "ID" ? "Filter Perawi" : "Filter Narrator")}
                </label>
                <div className='flex flex-wrap gap-2'>
                    {books.slice(0, 9).map((book) => (
                        <label
                            key={book.id}
                            className='inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm cursor-pointer transition-colors bg-white dark:bg-slate-700'
                        >
                            <input
                                type="checkbox"
                                checked={selectedBookIds.includes(book.id)}
                                onChange={() => toggleBook(book.id)}
                                className='w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2'
                            />
                            <span className={selectedBookIds.includes(book.id)
                                ? "text-emerald-700 dark:text-emerald-300 font-medium"
                                : "text-gray-700 dark:text-gray-300"}>
                                {bookLabels[book.id]}
                            </span>
                        </label>
                    ))}
                    {books.length > 9 && (
                        <span className='text-xs text-gray-500 dark:text-gray-400 self-center px-2'>
                            +{books.length - 9} more
                        </span>
                    )}
                </div>
                {selectedBookIds.length > 0 && (
                    <div className='mt-3 flex items-center gap-2'>
                        <span className='text-xs text-gray-500 dark:text-gray-400'>
                            {t("hadith.filter_active") || (lang === "ID" ? "Filter aktif:" : "Active filters:")}
                        </span>
                        <div className='flex flex-wrap gap-1'>
                            {selectedBookIds.map((bookId) => (
                                <span
                                    key={bookId}
                                    className='inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs rounded-full'
                                >
                                    {bookLabels[bookId]}
                                    <button
                                        type="button"
                                        onClick={() => toggleBook(bookId)}
                                        className='ml-1 hover:text-emerald-900 dark:hover:text-emerald-100'
                                        aria-label={t("common.remove") || "Remove"}
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <ContentWidth
                compact='max-w-6xl'
                className='grid xl:grid-cols-3 md:grid-cols-2 sm:grid-cols-1 gap-4 px-4'
            >
                {filteredThemes.map((theme) => {
                    const themeLabel = getThemeLabel(theme);
                    const themeSlug = themeLabel
                        .trim()
                        .toLowerCase()
                        .replace(/\s+/g, "-");
                    const themeBooks = Array.isArray(theme?.books)
                        ? theme.books
                        : [];
                    const themeBooksLabel =
                        themeBooks.length > 0
                            ? themeBooks
                                  .map((book) =>
                                      getLocalizedTranslation(
                                          book?.translation,
                                          lang,
                                      ),
                                  )
                                  .filter(Boolean)
                                  .join(", ")
                            : "&#x2D;";

                    return (
                        <Link
                            href={`${themeBasePath}/${themeSlug}`}
                            key={theme.id}
                            className='flex flex-row bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-700 transition-all overflow-hidden'
                        >
                            <div className='flex flex-col justify-between p-4 flex-1'>
                                <div>
                                    <h5 className='text-base font-bold text-emerald-900 dark:text-white mb-1'>
                                        {themeLabel}
                                    </h5>
                                    <p className='text-sm text-gray-500 dark:text-gray-400 mb-2'>
                                        {theme.total_hadith ?? 0} {t("hadith.unit")}
                                    </p>
                                </div>
                                <p className='text-xs text-gray-400'>
                                    {lang === "ID" ? "Perawi:" : "Narrator:"}{" "}
                                    {themeBooksLabel}
                                </p>
                            </div>
                        </Link>
                    );
                })}
                {filteredThemes.length === 0 && themes.length > 0 && (
                    <div className='col-span-full flex flex-col items-center justify-center min-h-[40vh] text-center px-4'>
                        <p className='text-4xl mb-3'>🔍</p>
                        <h2 className='text-lg font-bold text-emerald-900 dark:text-white mb-2'>
                            {t("hadith.no_match") || (lang === "ID" ? "Tidak ada tema cocok" : "No matching themes")}
                        </h2>
                        <p className='text-sm text-gray-500 dark:text-gray-400'>
                            {t("hadith.try_remove_filter") || (lang === "ID" ? "Coba hapus filter perawi" : "Try removing narrator filter")}
                        </p>
                    </div>
                )}
            </ContentWidth>
        </div>
    );
};

export default ByTheme;
