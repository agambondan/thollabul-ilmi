"use client";

import { SkeletonInline } from "@/components/skeleton/Skeleton";
import ContentWidth from "@/components/layout/ContentWidth";
import { useLocale } from "@/context/Locale";
import { getLocalizedTranslation } from "@/lib/translation";
import Link from "next/link";
import { useEffect, useState } from "react";

const ByTheme = ({ themeBasePath = "/hadith/theme" }) => {
    const { t, lang } = useLocale();
    const [isLoading, SetIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);
    const [themes, setThemes] = useState([]);

    const getThemeLabel = (theme) =>
        getLocalizedTranslation(theme?.translation, lang) ||
        `${t("hadith.tab_theme")} ${theme?.id}`;

    const fetchThemes = async () => {
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/v1/themes?size=250`,
        );
        return await res.json();
    };

    useEffect(() => {
        fetchThemes()
            .then((res) => {
                setThemes(res);
                SetIsLoading(false);
            })
            .catch(() => {
                setIsError(true);
                SetIsLoading(false);
            });
    }, []);

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
        <ContentWidth
            compact='max-w-6xl'
            className='grid xl:grid-cols-3 md:grid-cols-2 sm:grid-cols-1 gap-4 px-4'
        >
            {(themes?.items ?? []).map((theme) => {
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
                        : "-";

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
        </ContentWidth>
    );
};

export default ByTheme;
