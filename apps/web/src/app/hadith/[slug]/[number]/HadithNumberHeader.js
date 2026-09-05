"use client";

import { useLocale } from "@/context/Locale";
import Link from "next/link";

export default function HadithNumberHeader({
    basePath,
    slug,
    title,
    sunnahUrl,
}) {
    const { t } = useLocale();

    return (
        <>
            <Link
                href={`${basePath}/${slug}`}
                className='inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline mb-4'
            >
                {t("hadith.back_to_list") || "← Kembali ke daftar hadith"}
            </Link>
            <div className='mb-4 rounded-xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/70 dark:bg-emerald-900/10 px-4 py-3'>
                <p className='text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-400 dark:text-emerald-300 font-semibold'>
                    {t("hadith.detail_title") || "Detail Hadith"}
                </p>
                <h1 className='text-xl font-bold text-emerald-950 dark:text-emerald-300 dark:text-white mt-1'>
                    {title}
                </h1>
                {sunnahUrl ? (
                    <a
                        href={sunnahUrl}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='mt-2 inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 underline hover:text-blue-800'
                    >
                        {t("hadith.open_sunnah") || "Buka di sunnah.com →"}
                    </a>
                ) : null}
            </div>
        </>
    );
}
