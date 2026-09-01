"use client";

import Section from "@/components/Section";
import { SkeletonList } from "@/components/skeleton/Skeleton";
import { sirohApi } from "@/lib/api";
import { useLocale } from "@/context/Locale";
import { useLayoutMode } from "@/lib/useLayoutMode";
import { getLocalizedField } from "@/lib/translation";
import Link from "next/link";
import { useEffect, useState, use } from "react";
import SourceBadges from "@/components/SourceBadges";

const SirohDetailPage = (props) => {
    const params = use(props.params);
    const { t, lang } = useLocale();
    const { isWide } = useLayoutMode();
    const [content, setContent] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        sirohApi
            .detail(params.id)
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
            .finally(() => setIsLoading(false));
    }, [params.id]);

    if (isLoading) return <SkeletonList title={false} rows={5} />;

    return (
        <main className='min-h-screen flex flex-col'>
            <Section>
                <div
                    className={
                        isWide
                            ? "w-full px-4"
                            : "container mx-auto px-4 max-w-3xl"
                    }
                >
                    <Link
                        href='/siroh'
                        className='inline-flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400 hover:underline mb-6'
                    >
                        ← {t("siroh.back_to_siroh")}
                    </Link>

                    {error && (
                        <div className='text-center py-12'>
                            <p className='text-gray-500 dark:text-gray-400'>
                                {t("siroh.not_found")}
                            </p>
                        </div>
                    )}

                    {content && (
                        <article>
                            <h1 className='text-2xl font-bold text-emerald-900 dark:text-white mb-2'>
                                {getLocalizedField(content, "title", lang)}
                            </h1>
                            {getLocalizedField(content, "subtitle", lang) && (
                                <p className='text-gray-500 dark:text-gray-400 mb-6'>
                                    {getLocalizedField(
                                        content,
                                        "subtitle",
                                        lang,
                                    )}
                                </p>
                            )}
                            <div className='prose dark:prose-invert prose-emerald max-w-none text-gray-700 dark:text-gray-300 leading-relaxed'>
                                {(
                                    getLocalizedField(
                                        content,
                                        "content",
                                        lang,
                                    ) || content.content
                                )
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
                                    <p className='text-xs text-gray-400'>
                                        {t("common.source")}:
                                    </p>
                                    <SourceBadges source={content.source} />
                                </div>
                            )}
                        </article>
                    )}
                </div>
            </Section>
        </main>
    );
};

export default SirohDetailPage;
