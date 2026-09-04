"use client";

import { useLocale } from "@/context/Locale";
import { hadithApi } from "@/lib/api";
import { getLocalizedTranslation } from "@/lib/translation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ImBook } from "react-icons/im";

export default function DailyHadithWidget({ basePath = "/hadith" }) {
    const { t, lang } = useLocale();
    const [hadith, setHadith] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        hadithApi
            .daily()
            .then((r) => {
                if (!r.ok) throw new Error("not ok");
                return r.json();
            })
            .then((data) => {
                const h = data?.data ?? data;
                setHadith(h);
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className='animate-pulse h-32 bg-gray-100 dark:bg-slate-800 rounded-2xl' />
        );
    }

    if (error || !hadith) {
        return null;
    }

    const arab = hadith.translation?.ar ?? hadith.arab ?? "";
    const trans =
        getLocalizedTranslation(hadith.translation, lang) ||
        hadith.translation?.idn ||
        "";
    const bookName = hadith.book?.translation
        ? getLocalizedTranslation(hadith.book.translation, lang)
        : (hadith.book?.slug ?? hadith.book_slug ?? "");
    const number = hadith.number ?? hadith.id;
    const slug = hadith.book?.slug ?? hadith.book_slug ?? "";

    return (
        <div className='bg-gradient-to-br from-amber-50 to-emerald-50 dark:from-amber-900/20 dark:to-emerald-900/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl p-5'>
            <div className='flex items-center gap-2 mb-3'>
                <ImBook className='text-amber-600 dark:text-amber-400 text-lg' />
                <p className='text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider'>
                    {t("hadith.daily_label")}
                </p>
            </div>

            {arab && (
                <p
                    dir='rtl'
                    className='font-arabic text-xl text-gray-800 dark:text-gray-200 dark:text-gray-100 leading-loose mb-3 line-clamp-3'
                >
                    {arab}
                </p>
            )}

            {trans && (
                <p className='text-sm text-gray-700 dark:text-gray-200 dark:text-gray-300 leading-relaxed mb-3 line-clamp-4'>
                    &ldquo;{trans}&rdquo;
                </p>
            )}

            <div className='flex items-center justify-between text-xs'>
                <span className='text-emerald-700 dark:text-emerald-400 font-medium'>
                    HR. {bookName}
                    {number ? ` No. ${number}` : ""}
                </span>
                {slug && (
                    <Link
                        href={
                            number
                                ? `${basePath}/${slug}/${number}`
                                : `${basePath}/${slug}`
                        }
                        className='text-emerald-600 dark:text-emerald-400 hover:underline font-medium'
                    >
                        {t("hadith.read_more")} →
                    </Link>
                )}
            </div>
        </div>
    );
}
