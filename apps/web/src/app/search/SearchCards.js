import GradeBadge from "@/components/GradeBadge";
import { getSurahName } from "@/lib/surahList";
import { getLocalizedTranslation } from "@/lib/translation";
import Link from "next/link";
import React from "react";

export const getTotal = (data, key) => data?.[`${key}_total`] ?? 0;

export const getItems = (data, key) => data?.[key] ?? data?.[`${key}s`] ?? [];

export const AyahCard = ({ item, lang, hrefBuilder }) => {
    const surahName =
        getSurahName(item?.surah, lang) ||
        getLocalizedTranslation(item?.surah?.translation, lang) ||
        item?.surah?.translation?.latin_en ||
        "";
    const number = item?.number ?? "";
    const arabic = item?.translation?.ar ?? item?.ar ?? "";
    const latin =
        item?.translation?.latin_idn ?? item?.translation?.latin_en ?? "";
    const meaning =
        getLocalizedTranslation(item?.translation, lang) || item?.idn || "";
    const surahSlug =
        item?.surah?.translation?.latin_en ?? item?.surah_latin ?? "";

    return (
        <Link
            href={hrefBuilder({ item, surahSlug, number })}
            className='block p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors'
        >
            <span className='text-xs font-medium text-emerald-600 dark:text-emerald-400'>
                {surahName} : {number}
            </span>
            <p
                className='text-right text-xl mb-1 font-kitab'
                style={{ direction: "rtl" }}
            >
                {arabic}
            </p>
            {latin && (
                <p className='text-xs text-gray-400 italic mb-1'>{latin}</p>
            )}
            <p className='text-sm text-gray-600 dark:text-gray-300 line-clamp-2'>
                {meaning}
            </p>
        </Link>
    );
};

export const HadithCard = ({ item, lang, hrefBuilder }) => {
    const bookName =
        getLocalizedTranslation(item?.book?.translation, lang) ||
        item?.book?.slug ||
        "";
    const number = item?.number ?? "";
    const arabic = item?.translation?.ar ?? item?.ar ?? "";
    const latin =
        item?.translation?.latin_idn ?? item?.translation?.latin_en ?? "";
    const meaning =
        getLocalizedTranslation(item?.translation, lang) || item?.idn || "";
    const bookSlug = item?.book?.slug ?? "";

    return (
        <Link
            href={hrefBuilder({ item, bookSlug, number })}
            className='block p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors'
        >
            <div className='flex justify-between items-start mb-2'>
                <span className='text-xs font-medium text-emerald-600 dark:text-emerald-400'>
                    {bookName} : {number}
                </span>
                <GradeBadge grade={item.grade} />
            </div>
            <p
                className='text-right text-xl mb-1 font-kitab'
                style={{ direction: "rtl" }}
            >
                {arabic}
            </p>
            {latin && (
                <p className='text-xs text-gray-400 italic mb-1'>{latin}</p>
            )}
            <p className='text-sm text-gray-600 dark:text-gray-300 line-clamp-2'>
                {meaning}
            </p>
        </Link>
    );
};

export const GenericCard = ({ title, excerpt, href }) => (
    <Link
        href={href}
        className='block p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors'
    >
        <p className='text-sm font-medium text-emerald-700 dark:text-emerald-400'>
            {title}
        </p>
        {excerpt && (
            <p className='text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2'>
                {excerpt}
            </p>
        )}
    </Link>
);

const SEMANTIC_SOURCE_HREF = {
    hadith: ({ metadata }) =>
        metadata?.book_slug
            ? `/hadith/${metadata.book_slug}#${metadata.number ?? ""}`
            : null,
    kajian: ({ metadata }) => metadata?.timestamp_url || null,
    doa: () => "/doa",
};

export function SemanticResultCard({ result, typeLabels = {} }) {
    let metadata = {};
    try {
        metadata = JSON.parse(result.metadata || "{}");
    } catch {
        metadata = {};
    }
    const href = SEMANTIC_SOURCE_HREF[result.content_type]?.({ metadata });
    const typeLabel =
        typeLabels[result.content_type] || result.content_type;

    const body = (
        <>
            <span className='inline-block text-[11px] font-semibold uppercase tracking-wide text-purple-600 dark:text-purple-400 mb-1'>
                {typeLabel}
            </span>
            <p className='text-sm text-gray-700 dark:text-gray-200 line-clamp-4 whitespace-pre-line'>
                {result.chunk_text}
            </p>
        </>
    );

    const cardClass =
        "block p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700 transition-colors";

    if (href) {
        const isExternal = href.startsWith("http");
        return isExternal ? (
            <a
                href={href}
                target='_blank'
                rel='noreferrer'
                className={cardClass}
            >
                {body}
            </a>
        ) : (
            <Link href={href} className={cardClass}>
                {body}
            </Link>
        );
    }

    return <div className={cardClass}>{body}</div>;
}

export function ResultSection({
    label,
    total,
    items,
    renderCard,
    seeAllHref,
    type,
    onLoadMore,
    hasMore,
}) {
    if (!items || items.length === 0) return null;

    return (
        <div>
            <div className='flex items-center justify-between mb-3'>
                <h2 className='text-sm font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide'>
                    {label}{" "}
                    {total > 0 && (
                        <span className='text-gray-400'>({total})</span>
                    )}
                </h2>
                {seeAllHref && total > items.length && (
                    <Link
                        href={seeAllHref}
                        className='text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline'
                    >
                        Lihat Semua &rarr;
                    </Link>
                )}
            </div>
            <div className='space-y-2'>
                {items.map((item, i) => (
                    <div
                        key={
                            item?.id
                                ? `${type || "sec"}-${item.id}-${i}`
                                : `${type || "sec"}-${i}`
                        }
                    >
                        {renderCard(item, i)}
                    </div>
                ))}
            </div>
            {hasMore && onLoadMore && (
                <div className='flex justify-center pt-3'>
                    <button
                        onClick={onLoadMore}
                        className='px-5 py-2 rounded-xl bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors'
                    >
                        Muat Lainnya
                    </button>
                </div>
            )}
        </div>
    );
}
