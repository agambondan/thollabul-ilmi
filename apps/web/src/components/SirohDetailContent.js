"use client";

import { SkeletonList } from "@/components/skeleton/Skeleton";
import { sirohApi } from "@/lib/api";
import { useLocale } from "@/context/Locale";
import { useLayoutMode } from "@/lib/useLayoutMode";
import { getLocalizedField } from "@/lib/translation";
import Link from "next/link";
import { useEffect, useState } from "react";
import SourceBadges from "@/components/SourceBadges";
import ContentReportModal from "@/components/ContentReportModal";
import { BsExclamationTriangleFill } from "react-icons/bs";

export default function SirohDetailContent({ slug, basePath = "/siroh" }) {
    const { t, lang } = useLocale();
    const { isWide } = useLayoutMode();
    const [content, setContent] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);
    const [reportOpen, setReportOpen] = useState(false);

    useEffect(() => {
        if (!slug) return;
        setIsLoading(true);
        sirohApi
            .detail(slug, lang)
            .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
            .then((data) => {
                if (data && (data.title || data.slug || data.id)) {
                    setContent(data);
                } else {
                    setError(true);
                }
            })
            .catch(() => setError(true))
            .finally(() => setIsLoading(false));
    }, [slug, lang]);

    if (isLoading) return <SkeletonList title={false} rows={5} />;

    return (
        <div className={isWide ? "w-full px-4" : "container mx-auto px-4 max-w-3xl"}>
            <Link
                href={basePath}
                className='inline-flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400 hover:underline mb-6'
            >
                ← {t("siroh.back_to_siroh")}
            </Link>

            {error && (
                <div className='text-center py-12'>
                    <p className='text-gray-500 dark:text-gray-300 dark:text-gray-400'>
                        {t("siroh.not_found")}
                    </p>
                    <Link
                        href={basePath}
                        className='mt-4 inline-block text-sm text-emerald-600 dark:text-emerald-400 hover:underline'
                    >
                        ← {t("common.back")}
                    </Link>
                </div>
            )}

            {content && (
                <article>
                    <h1 className='text-2xl font-bold text-emerald-900 dark:text-emerald-300 dark:text-white mb-2'>
                        {getLocalizedField(content, "title", lang)}
                    </h1>
                    {getLocalizedField(content, "subtitle", lang) && (
                        <p className='text-gray-500 dark:text-gray-300 dark:text-gray-400 mb-6'>
                            {getLocalizedField(content, "subtitle", lang)}
                        </p>
                    )}
                    <div className='prose dark:prose-invert prose-emerald max-w-none text-gray-700 dark:text-gray-200 dark:text-gray-300 leading-relaxed'>
                        {(getLocalizedField(content, "content", lang) || content.content)
                            ?.split("\n")
                            .filter(Boolean)
                            .map((para, i) => (
                                <p key={i} className='mb-4'>
                                    {para}
                                </p>
                            ))}
                    </div>
                    {content.source && (
                        <div className='mt-8 border-t border-gray-100 dark:border-slate-700 pt-4'>
                            <p className='text-xs text-gray-400'>{t("common.source")}:</p>
                            <SourceBadges source={content.source} />
                        </div>
                    )}
                    <div className='mt-6 flex justify-end'>
                        <button
                            type='button'
                            onClick={() => setReportOpen(true)}
                            className='inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors'
                        >
                            <BsExclamationTriangleFill className='text-[10px]' />
                            {t("report.correction_btn") ?? "Laporkan Kesalahan"}
                        </button>
                    </div>
                </article>
            )}

            {content && reportOpen && (
                <ContentReportModal
                    isOpen={reportOpen}
                    onClose={() => setReportOpen(false)}
                    targetType='siroh'
                    targetId={String(content.id ?? content.slug ?? slug)}
                    targetTitle={getLocalizedField(content, "title", lang) || "Siroh"}
                    snippet={getLocalizedField(content, "content", lang)}
                />
            )}
        </div>
    );
}
