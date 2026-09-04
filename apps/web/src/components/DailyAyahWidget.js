"use client";

import { useLocale } from "@/context/Locale";
import { getLocalizedTranslation } from "@/lib/translation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FaQuran } from "react-icons/fa";

const TOTAL_AYAH = 6236;
const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

const getDailyAyahNumber = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now - start) / 86400000);
    return (dayOfYear % TOTAL_AYAH) + 1;
};

export default function DailyAyahWidget({
    basePath = "/quran",
    buildHref = ({ surahSlug, ayahNum }) =>
        `${basePath}/surah/${surahSlug}#${ayahNum}`,
}) {
    const { t, lang } = useLocale();
    const [ayah, setAyah] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetch(`${API_URL}/api/v1/ayah/daily${lang ? `?lang=${encodeURIComponent(lang)}` : ""}`)
            .then((r) => {
                if (!r.ok) throw new Error("not ok");
                return r.json();
            })
            .then((data) => {
                const payload = data?.data ?? data;
                if (Array.isArray(payload?.items)) {
                    const ayahNumber = getDailyAyahNumber();
                    setAyah(
                        payload.items[ayahNumber % payload.items.length] ??
                            null,
                    );
                    return;
                }
                setAyah(payload);
            })
            .catch(() => setAyah(null))
            .finally(() => setLoading(false));
    }, [lang]);

    if (loading) {
        return (
            <div className='animate-pulse h-36 bg-gray-100 dark:bg-slate-800 rounded-2xl' />
        );
    }

    if (!ayah) return null;

    const arabic = ayah.translation?.ar ?? ayah.ar ?? "";
    const meaning =
        getLocalizedTranslation(ayah.translation, lang) ||
        (lang === "EN"
            ? ayah.translation?.en || ayah.translation?.latin_en
            : ayah.translation?.idn) ||
        "";
    const surahName =
        getLocalizedTranslation(ayah.surah?.translation, lang) ||
        (lang === "EN"
            ? ayah.surah?.translation?.latin_en
            : ayah.surah?.translation?.latin_idn) ||
        "";
    const ayahNum = ayah.number ?? "";
    const surahSlug = ayah.surah?.translation?.latin_en?.toLowerCase() ?? "";
    const readHref = surahSlug ? buildHref({ ayah, surahSlug, ayahNum }) : "";

    return (
        <div className='bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-5'>
            <div className='flex items-center gap-2 mb-3'>
                <FaQuran className='text-emerald-600 dark:text-emerald-400 text-lg' />
                <p className='text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider'>
                    {t("quran.daily_ayah_label")}
                </p>
            </div>

            {arabic && (
                <p
                    dir='rtl'
                    className='font-kitab text-2xl text-gray-800 dark:text-gray-200 dark:text-gray-100 leading-loose mb-3 line-clamp-3'
                >
                    {arabic}
                </p>
            )}

            {meaning && (
                <p className='text-sm text-gray-700 dark:text-gray-200 dark:text-gray-300 leading-relaxed mb-3 line-clamp-3'>
                    &ldquo;{meaning}&rdquo;
                </p>
            )}

            <div className='flex items-center justify-between text-xs'>
                <span className='text-emerald-700 dark:text-emerald-400 font-medium'>
                    {surahName}
                    {ayahNum ? `: ${ayahNum}` : ""}
                </span>
                {readHref && (
                    <Link
                        href={readHref}
                        className='text-emerald-600 dark:text-emerald-400 hover:underline font-medium'
                    >
                        {t("hadith.read_more")} →
                    </Link>
                )}
            </div>
        </div>
    );
}
