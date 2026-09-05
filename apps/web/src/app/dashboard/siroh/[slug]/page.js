"use client";

import { sirohApi } from "@/lib/api";
import { useLocale } from "@/context/Locale";
import { getLocalizedField } from "@/lib/translation";
import Link from "next/link";
import SourceBadges from "@/components/SourceBadges";
import ContentReportModal from "@/components/ContentReportModal";
import { BsExclamationTriangleFill } from "react-icons/bs";
import { useEffect, useState, use } from "react";

const toStr = (v) => {
    if (!v) return "";
    if (typeof v === "string") return v;
    return v.name ?? v.title ?? v.label ?? v.value ?? "";
};

export default function SirohDetailPage(props) {
    const params = use(props.params);
    const { t, lang } = useLocale();
    const [content, setContent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [reportOpen, setReportOpen] = useState(false);

    useEffect(() => {
        sirohApi
            .detail(params.slug)
            // A 404 still parses as JSON, so checking res.ok is what separates
            // "not found" from a real payload — without it the error body was
            // stored as content and the article rendered blank.
            .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
            .then((data) => {
                if (data && (data.title || data.slug || data.id)) {
                    setContent(data);
                } else {
                    setError(true);
                }
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, [params.slug]);

    if (loading) {
        return (
            <div className='p-6'>
                <div className='animate-pulse space-y-4'>
                    <div className='h-6 bg-gray-200 dark:bg-slate-700 rounded w-1/2' />
                    <div className='h-4 bg-gray-200 dark:bg-slate-700 rounded w-full' />
                    <div className='h-4 bg-gray-200 dark:bg-slate-700 rounded w-5/6' />
                    <div className='h-4 bg-gray-200 dark:bg-slate-700 rounded w-full' />
                </div>
            </div>
        );
    }

    if (error || !content) {
        return (
            <div className='p-6 text-center'>
                <p className='text-4xl mb-3'>⚠️</p>
                <p className='text-gray-500 dark:text-gray-300 dark:text-gray-400 text-sm'>
                    {t("siroh.not_found")}
                </p>
                <Link
                    href='/dashboard/siroh'
                    className='mt-4 inline-block text-sm text-blue-600 dark:text-blue-400 hover:underline'
                >
                    ← {t("common.back")}
                </Link>
            </div>
        );
    }

    return (
        <div className='p-6'>
            <Link
                href='/dashboard/siroh'
                className='inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline mb-6'
            >
                ← {t("siroh.back_to_siroh")}
            </Link>

            {content.category && (
                <span className='inline-block px-2 py-0.5 rounded-full text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium mb-3'>
                    {toStr(content.category)}
                </span>
            )}

            <h1 className='text-2xl font-bold text-gray-900 dark:text-gray-100 dark:text-white mb-2'>
                {getLocalizedField(content, "title", lang)}
            </h1>

            {getLocalizedField(content, "subtitle", lang) && (
                <p className='text-gray-500 dark:text-gray-300 dark:text-gray-400 mb-6'>
                    {getLocalizedField(content, "subtitle", lang)}
                </p>
            )}

            <div className='text-gray-700 dark:text-gray-200 dark:text-gray-300 leading-relaxed space-y-4'>
                {String(
                    (getLocalizedField(content, "content", lang) ||
                        content.content) ??
                        "",
                )
                    .split("\n")
                    .filter(Boolean)
                    .map((para, i) => (
                        <p key={i}>{para}</p>
                    ))}
            </div>

            {content.source && (
                <div className='text-xs text-gray-400 mt-8 border-t border-gray-100 dark:border-slate-700 pt-4'>
                    <span className='mr-1'>{t("common.source")}:</span>
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

            {content && reportOpen && (
                <ContentReportModal
                    isOpen={reportOpen}
                    onClose={() => setReportOpen(false)}
                    targetType='siroh'
                    targetId={String(content.id ?? content.slug ?? params.slug)}
                    targetTitle={getLocalizedField(content, "title", lang) || "Siroh"}
                    snippet={getLocalizedField(content, "content", lang)}
                />
            )}
        </div>
    );
}
