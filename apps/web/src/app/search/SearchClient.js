"use client";

import GradeBadge from "@/components/GradeBadge";
import { SkeletonInline } from "@/components/skeleton/Skeleton";
import { useLocale } from "@/context/Locale";
import { useLayoutMode } from "@/lib/useLayoutMode";
import { searchApi } from "@/lib/api";
import { getLocalizedTranslation } from "@/lib/translation";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { BsSearch } from "react-icons/bs";

const PAGE_SIZE = 20;

const SECTION_LABELS = {
    ayah: "search.type.ayah",
    hadith: "search.type.hadith",
    dictionary: "Kamus",
    doa: "Doa",
    kajian: "Kajian",
    perawi: "Perawi",
};

const TYPE_VALUES = [
    "all",
    "ayah",
    "hadith",
    "doa",
    "dictionary",
    "kajian",
    "perawi",
];

const searchHref = (basePath, q, type) =>
    `${basePath}?q=${encodeURIComponent(q)}&type=${type}`;

const PUBLIC_ROUTES = {
    section: {
        ayah: (q) => searchHref("/search", q, "ayah"),
        hadith: (q) => searchHref("/search", q, "hadith"),
        dictionary: (q) => `/kamus?q=${encodeURIComponent(q)}`,
        doa: (q) => `/doa?q=${encodeURIComponent(q)}`,
        kajian: (q) => `/kajian?q=${encodeURIComponent(q)}`,
        perawi: (q) => `/perawi?q=${encodeURIComponent(q)}`,
    },
    ayah: ({ surahSlug, number }) => `/quran/surah/${surahSlug}#${number}`,
    hadith: ({ bookSlug, number }) => `/hadith/${bookSlug}#${number}`,
    doa: ({ id }) => `/doa#${id}`,
    dictionary: ({ term }) => `/kamus?q=${encodeURIComponent(term ?? "")}`,
    kajian: ({ id }) => `/kajian/${id}`,
    perawi: ({ id }) => `/perawi/${id}`,
};

const DASHBOARD_ROUTES = {
    section: {
        ayah: (q) => searchHref("/dashboard/search", q, "ayah"),
        hadith: (q) => searchHref("/dashboard/search", q, "hadith"),
        dictionary: (q) => searchHref("/dashboard/search", q, "dictionary"),
        doa: (q) => searchHref("/dashboard/search", q, "doa"),
        kajian: (q) => searchHref("/dashboard/search", q, "kajian"),
        perawi: (q) => searchHref("/dashboard/search", q, "perawi"),
    },
    ayah: ({ surahSlug, number }) => `/dashboard/quran/${surahSlug}#${number}`,
    hadith: ({ bookSlug, number }) => `/dashboard/hadith/${bookSlug}#${number}`,
    doa: ({ id }) => `/dashboard/doa#${id}`,
    dictionary: ({ term }) =>
        `/dashboard/kamus?q=${encodeURIComponent(term ?? "")}`,
    kajian: ({ id }) => `/dashboard/kajian#${id}`,
    perawi: ({ id }) => `/dashboard/perawi/${id}`,
};

const getRouteMap = (routeScope) =>
    routeScope === "dashboard" ? DASHBOARD_ROUTES : PUBLIC_ROUTES;

const getTotal = (data, key) => data?.[`${key}_total`] ?? 0;

const getItems = (data, key) => data?.[key] ?? data?.[`${key}s`] ?? [];

const AyahCard = ({ item, lang, hrefBuilder }) => {
    const surahName =
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
                <p className='text-xs text-gray-400 italic mb-1'>
                    {latin}
                </p>
            )}
            <p className='text-sm text-gray-600 dark:text-gray-300 line-clamp-2'>
                {meaning}
            </p>
        </Link>
    );
};

const HadithCard = ({ item, lang, hrefBuilder }) => {
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
                <p className='text-xs text-gray-400 italic mb-1'>
                    {latin}
                </p>
            )}
            <p className='text-sm text-gray-600 dark:text-gray-300 line-clamp-2'>
                {meaning}
            </p>
        </Link>
    );
};

const GenericCard = ({ item, title, excerpt, href }) => (
    <Link
        href={href}
        className='block p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors'
    >
        <p className='text-sm font-medium text-emerald-700 dark:text-emerald-300'>
            {title}
        </p>
        {excerpt && (
            <p className='text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2'>
                {excerpt}
            </p>
        )}
    </Link>
);

function ResultSection({
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
                {items.map((item, i) => renderCard(item, i))}
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

export default function SearchClient({
    initialQuery = "",
    initialType = "all",
    routeScope = "public",
}) {
    const { t, lang } = useLocale();
    const { isWide } = useLayoutMode();
    const routeMap = getRouteMap(routeScope);
    const TYPES = [
        { value: "all", label: t("search.type.all") },
        { value: "ayah", label: t("search.type.ayah") },
        { value: "hadith", label: t("search.type.hadith") },
        { value: "doa", label: "Doa" },
        { value: "dictionary", label: "Kamus" },
        { value: "kajian", label: "Kajian" },
        { value: "perawi", label: "Perawi" },
    ];
    const [query, setQuery] = useState(initialQuery);
    const [type, setType] = useState(
        TYPE_VALUES.includes(initialType) ? initialType : "all",
    );
    const [results, setResults] = useState(null);
    const [page, setPage] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState("");
    const inputRef = useRef(null);

    const doSearch = useCallback(
        async (q, tp, pg, append) => {
            if (!q.trim()) return;
            if (append) setIsLoadingMore(true);
            else setIsLoading(true);
            setError("");
            try {
                const res = await searchApi.search(q, tp, lang, pg, PAGE_SIZE);
                const data = await res.json();
                setResults((prev) =>
                    append ? mergeResults(prev, data) : data,
                );
            } catch {
                setError(t("search.error") || "Terjadi kesalahan");
            } finally {
                setIsLoading(false);
                setIsLoadingMore(false);
            }
        },
        [lang, t],
    );

    const mergeResults = (prev, next) => {
        if (!prev) return next;
        const merged = { ...next };
        [
            "ayah",
            "hadith",
            "dictionaries",
            "doas",
            "kajians",
            "perawis",
        ].forEach((key) => {
            if (next[key] && prev[key]) {
                merged[key] = [...prev[key], ...next[key]];
            }
        });
        return merged;
    };

    useEffect(() => {
        if (initialQuery) {
            doSearch(initialQuery, type, 0, false);
        }
        inputRef.current?.focus();
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        setPage(0);
        doSearch(query, type, 0, false);
    };

    const handleTypeChange = (newType) => {
        setType(newType);
        setPage(0);
        if (query.trim()) doSearch(query, newType, 0, false);
    };

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        doSearch(query, type, nextPage, true);
    };

    const isAll = type === "all";

    return (
        <div
            className={
                isWide ? "w-full px-4" : "container mx-auto px-4 max-w-3xl"
            }
        >
            <h1 className='text-2xl font-bold text-emerald-900 dark:text-white mb-6'>
                {t("search.title")}
            </h1>

            <form onSubmit={handleSubmit} className='flex gap-2 mb-4'>
                <input
                    ref={inputRef}
                    type='text'
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t("search.placeholder")}
                    className='flex-1 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500'
                />
                <button
                    type='submit'
                    className='px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2'
                >
                    <BsSearch />
                    {t("common.search")}
                </button>
            </form>

            <div className='flex gap-2 mb-6 flex-wrap'>
                {TYPES.map((typeItem) => (
                    <button
                        key={typeItem.value}
                        onClick={() => handleTypeChange(typeItem.value)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            type === typeItem.value
                                ? "bg-emerald-700 text-white"
                                : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-emerald-100 dark:hover:bg-slate-600"
                        }`}
                    >
                        {typeItem.label}
                    </button>
                ))}
            </div>

            {isLoading && <SkeletonInline rows={4} />}

            {error && (
                <p className='text-sm text-red-500 dark:text-red-400'>
                    {error}
                </p>
            )}

            {results && !isLoading && (
                <div className='space-y-8'>
                    {isAll ? (
                        <>
                            <ResultSection
                                label={t("search.type.ayah")}
                                total={getTotal(results, "ayah")}
                                items={getItems(results, "ayah")}
                                renderCard={(item) => (
                                    <AyahCard
                                        key={item.id}
                                        item={item}
                                        lang={lang}
                                        hrefBuilder={routeMap.ayah}
                                    />
                                )}
                                seeAllHref={routeMap.section.ayah(query)}
                            />
                            <ResultSection
                                label={t("search.type.hadith")}
                                total={getTotal(results, "hadith")}
                                items={getItems(results, "hadith")}
                                renderCard={(item) => (
                                    <HadithCard
                                        key={item.id}
                                        item={item}
                                        lang={lang}
                                        hrefBuilder={routeMap.hadith}
                                    />
                                )}
                                seeAllHref={routeMap.section.hadith(query)}
                            />
                            <ResultSection
                                label='Doa'
                                total={getTotal(results, "doa")}
                                items={getItems(results, "doas")}
                                renderCard={(item) => (
                                    <GenericCard
                                        key={item.id}
                                        title={
                                            item.title ||
                                            getLocalizedTranslation(
                                                item?.translation,
                                                lang,
                                            )
                                        }
                                        excerpt={
                                            item.translation?.idn ||
                                            item.translation?.en
                                        }
                                        href={routeMap.doa({
                                            item,
                                            id: item.id,
                                        })}
                                    />
                                )}
                                seeAllHref={routeMap.section.doa(query)}
                            />
                            <ResultSection
                                label='Kamus'
                                total={getTotal(results, "dictionary")}
                                items={getItems(results, "dictionaries")}
                                renderCard={(item) => (
                                    <GenericCard
                                        key={item.id}
                                        title={item.term}
                                        excerpt={item.definition}
                                        href={routeMap.dictionary({
                                            item,
                                            term: item.term,
                                        })}
                                    />
                                )}
                                seeAllHref={routeMap.section.dictionary(query)}
                            />
                            <ResultSection
                                label='Kajian'
                                total={getTotal(results, "kajian")}
                                items={getItems(results, "kajians")}
                                renderCard={(item) => (
                                    <GenericCard
                                        key={item.id}
                                        title={
                                            item.title ||
                                            getLocalizedTranslation(
                                                item?.translation,
                                                lang,
                                            )
                                        }
                                        excerpt={
                                            item.speaker || item.description
                                        }
                                        href={routeMap.kajian({
                                            item,
                                            id: item.id,
                                        })}
                                    />
                                )}
                                seeAllHref={routeMap.section.kajian(query)}
                            />
                            <ResultSection
                                label='Perawi'
                                total={getTotal(results, "perawi")}
                                items={getItems(results, "perawis")}
                                renderCard={(item) => (
                                    <GenericCard
                                        key={item.id}
                                        title={
                                            item.nama_latin || item.nama_arab
                                        }
                                        excerpt={item.nama_lengkap}
                                        href={routeMap.perawi({
                                            item,
                                            id: item.id,
                                        })}
                                    />
                                )}
                                seeAllHref={routeMap.section.perawi(query)}
                            />
                        </>
                    ) : (
                        <>
                            {type === "ayah" && (
                                <ResultSection
                                    label={t("search.type.ayah")}
                                    total={getTotal(results, "ayah")}
                                    items={getItems(results, "ayah")}
                                    renderCard={(item) => (
                                        <AyahCard
                                            key={item.id}
                                            item={item}
                                            lang={lang}
                                            hrefBuilder={routeMap.ayah}
                                        />
                                    )}
                                    hasMore={
                                        getItems(results, "ayah").length <
                                        getTotal(results, "ayah")
                                    }
                                    onLoadMore={handleLoadMore}
                                />
                            )}
                            {type === "hadith" && (
                                <ResultSection
                                    label={t("search.type.hadith")}
                                    total={getTotal(results, "hadith")}
                                    items={getItems(results, "hadith")}
                                    renderCard={(item) => (
                                        <HadithCard
                                            key={item.id}
                                            item={item}
                                            lang={lang}
                                            hrefBuilder={routeMap.hadith}
                                        />
                                    )}
                                    hasMore={
                                        getItems(results, "hadith").length <
                                        getTotal(results, "hadith")
                                    }
                                    onLoadMore={handleLoadMore}
                                />
                            )}
                            {type === "doa" && (
                                <ResultSection
                                    label='Doa'
                                    total={getTotal(results, "doa")}
                                    items={getItems(results, "doas")}
                                    renderCard={(item) => (
                                        <GenericCard
                                            key={item.id}
                                            title={
                                                item.title ||
                                                getLocalizedTranslation(
                                                    item?.translation,
                                                    lang,
                                                )
                                            }
                                            excerpt={
                                                item.translation?.idn ||
                                                item.translation?.en
                                            }
                                            href={routeMap.doa({
                                                item,
                                                id: item.id,
                                            })}
                                        />
                                    )}
                                    hasMore={
                                        getItems(results, "doas").length <
                                        getTotal(results, "doa")
                                    }
                                    onLoadMore={handleLoadMore}
                                />
                            )}
                            {type === "dictionary" && (
                                <ResultSection
                                    label='Kamus'
                                    total={getTotal(results, "dictionary")}
                                    items={getItems(results, "dictionaries")}
                                    renderCard={(item) => (
                                        <GenericCard
                                            key={item.id}
                                            title={item.term}
                                            excerpt={item.definition}
                                            href={routeMap.dictionary({
                                                item,
                                                term: item.term,
                                            })}
                                        />
                                    )}
                                    hasMore={
                                        getItems(results, "dictionaries")
                                            .length <
                                        getTotal(results, "dictionary")
                                    }
                                    onLoadMore={handleLoadMore}
                                />
                            )}
                            {type === "kajian" && (
                                <ResultSection
                                    label='Kajian'
                                    total={getTotal(results, "kajian")}
                                    items={getItems(results, "kajians")}
                                    renderCard={(item) => (
                                        <GenericCard
                                            key={item.id}
                                            title={
                                                item.title ||
                                                getLocalizedTranslation(
                                                    item?.translation,
                                                    lang,
                                                )
                                            }
                                            excerpt={
                                                item.speaker || item.description
                                            }
                                            href={routeMap.kajian({
                                                item,
                                                id: item.id,
                                            })}
                                        />
                                    )}
                                    hasMore={
                                        getItems(results, "kajians").length <
                                        getTotal(results, "kajian")
                                    }
                                    onLoadMore={handleLoadMore}
                                />
                            )}
                            {type === "perawi" && (
                                <ResultSection
                                    label='Perawi'
                                    total={getTotal(results, "perawi")}
                                    items={getItems(results, "perawis")}
                                    renderCard={(item) => (
                                        <GenericCard
                                            key={item.id}
                                            title={
                                                item.nama_latin ||
                                                item.nama_arab
                                            }
                                            excerpt={item.nama_lengkap}
                                            href={routeMap.perawi({
                                                item,
                                                id: item.id,
                                            })}
                                        />
                                    )}
                                    hasMore={
                                        getItems(results, "perawis").length <
                                        getTotal(results, "perawi")
                                    }
                                    onLoadMore={handleLoadMore}
                                />
                            )}
                        </>
                    )}

                    {!results.total && (
                        <div className='text-center py-12'>
                            <p className='text-gray-500 dark:text-gray-400 text-sm'>
                                {t("common.no_results")} &quot;{query}&quot;
                            </p>
                        </div>
                    )}
                </div>
            )}

            {isLoadingMore && <SkeletonInline rows={2} />}
        </div>
    );
}
