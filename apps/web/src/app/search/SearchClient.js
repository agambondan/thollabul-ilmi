"use client";

import ContentWidth from "@/components/layout/ContentWidth";
import { SkeletonInline } from "@/components/skeleton/Skeleton";
import { useLocale } from "@/context/Locale";
import { usePathname, useRouter } from "next/navigation";
import { searchApi, semanticSearchApi } from "@/lib/api";
import { getLocalizedField, getLocalizedTranslation } from "@/lib/translation";
import { useCallback, useEffect, useRef, useState } from "react";
import { BsSearch } from "react-icons/bs";
import { getRouteMap } from "./searchRoutes";
import {
    AyahCard,
    HadithCard,
    GenericCard,
    SemanticResultCard,
    ResultSection,
    getTotal,
    getItems,
} from "./SearchCards";

const PAGE_SIZE = 20;

const TYPE_VALUES = [
    "all",
    "ayah",
    "hadith",
    "doa",
    "dictionary",
    "kajian",
    "perawi",
];

const SEMANTIC_TYPES = [
    { value: "", label: "Semua" },
    { value: "quran", label: "Quran" },
    { value: "hadith", label: "Hadith" },
    { value: "tafsir", label: "Tafsir" },
    { value: "asbabun_nuzul", label: "Asbabun Nuzul" },
    { value: "doa", label: "Doa" },
    { value: "fiqh", label: "Fiqh" },
    { value: "sirah", label: "Sirah" },
    { value: "kajian", label: "Kajian" },
];

const SEMANTIC_TYPE_LABELS = SEMANTIC_TYPES.reduce((acc, t) => {
    if (t.value) acc[t.value] = t.label;
    return acc;
}, {});

const SECTION_DEFS = [
    {
        type: "ayah",
        labelKey: "search.type.ayah",
        itemsKey: "ayahs",
        renderCard: (item, lang, routeMap) => (
            <AyahCard item={item} lang={lang} hrefBuilder={routeMap.ayah} />
        ),
        seeAllHref: (routeMap, q) => routeMap.section.ayah(q),
    },
    {
        type: "hadith",
        labelKey: "search.type.hadith",
        itemsKey: "hadiths",
        renderCard: (item, lang, routeMap) => (
            <HadithCard item={item} lang={lang} hrefBuilder={routeMap.hadith} />
        ),
        seeAllHref: (routeMap, q) => routeMap.section.hadith(q),
    },
    {
        type: "doa",
        labelKey: "search.type.doa",
        itemsKey: "doas",
        renderCard: (item, lang, routeMap) => (
            <GenericCard
                title={
                    item.title ||
                    getLocalizedTranslation(item?.translation, lang)
                }
                excerpt={getLocalizedTranslation(item?.translation, lang)}
                href={routeMap.doa({ item, id: item.id })}
            />
        ),
        seeAllHref: (routeMap, q) => routeMap.section.doa(q),
    },
    {
        type: "dictionary",
        labelKey: "search.type.dictionary",
        itemsKey: "dictionaries",
        renderCard: (item, _lang, routeMap) => (
            <GenericCard
                title={item.term}
                excerpt={item.definition}
                href={routeMap.dictionary({ item, term: item.term })}
            />
        ),
        seeAllHref: (routeMap, q) => routeMap.section.dictionary(q),
    },
    {
        type: "kajian",
        labelKey: "search.type.kajian",
        itemsKey: "kajians",
        renderCard: (item, lang, routeMap) => (
            <GenericCard
                title={
                    item.title ||
                    getLocalizedTranslation(item?.translation, lang)
                }
                excerpt={
                    getLocalizedField(item, "description", lang) || item.speaker
                }
                href={routeMap.kajian({ item, id: item.id })}
            />
        ),
        seeAllHref: (routeMap, q) => routeMap.section.kajian(q),
    },
    {
        type: "perawi",
        labelKey: "search.type.perawi",
        itemsKey: "perawis",
        renderCard: (item, _lang, routeMap) => (
            <GenericCard
                title={item.nama_latin || item.nama_arab}
                excerpt={item.nama_lengkap}
                href={routeMap.perawi({ item, id: item.id })}
            />
        ),
        seeAllHref: (routeMap, q) => routeMap.section.perawi(q),
    },
];

export default function SearchClient({
    initialQuery = "",
    initialType = "all",
    routeScope = "public",
}) {
    const { t, lang } = useLocale();
    const routeMap = getRouteMap(routeScope);
    const TYPES = [
        { value: "all", label: t("search.type.all") },
        { value: "ayah", label: t("search.type.ayah") },
        { value: "hadith", label: t("search.type.hadith") },
        { value: "doa", label: t("search.type.doa") },
        { value: "dictionary", label: t("search.type.dictionary") },
        { value: "kajian", label: t("search.type.kajian") },
        { value: "perawi", label: t("search.type.perawi") },
    ];
    const router = useRouter();
    const pathname = usePathname();
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

    const [mode, setMode] = useState("keyword");
    const [semanticType, setSemanticType] = useState("");
    const [semanticResults, setSemanticResults] = useState(null);
    const [askAnswer, setAskAnswer] = useState(null);
    const [isSemanticLoading, setIsSemanticLoading] = useState(false);
    const [semanticError, setSemanticError] = useState("");

    const doSemanticSearch = useCallback(
        async (q, contentType) => {
            if (!q.trim()) return;
            setIsSemanticLoading(true);
            setSemanticError("");
            setAskAnswer(null);
            const types = contentType ? [contentType] : [];
            try {
                const [searchRes, askRes] = await Promise.all([
                    semanticSearchApi.search(q, types, 10),
                    semanticSearchApi.ask(q, types),
                ]);
                const searchData = await searchRes.json();
                const askData = await askRes.json();
                setSemanticResults(searchData);
                setAskAnswer(askData);
            } catch {
                setSemanticError(t("search.error") || "Terjadi kesalahan");
            } finally {
                setIsSemanticLoading(false);
            }
        },
        [t],
    );

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
            "ayahs",
            "hadiths",
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
        if (
            !initialQuery &&
            typeof window !== "undefined" &&
            window.matchMedia("(hover: hover)").matches
        ) {
            inputRef.current?.focus();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const syncUrl = useCallback(
        (q, tp) => {
            const params = new URLSearchParams();
            if (q.trim()) params.set("q", q.trim());
            if (tp && tp !== "all") params.set("type", tp);
            const qs = params.toString();
            router.replace(qs ? `${pathname}?${qs}` : pathname, {
                scroll: false,
            });
        },
        [pathname, router],
    );

    const handleSubmit = (e) => {
        e.preventDefault();
        if (mode === "makna") {
            doSemanticSearch(query, semanticType);
            return;
        }
        setPage(0);
        syncUrl(query, type);
        doSearch(query, type, 0, false);
    };

    const handleTypeChange = (newType) => {
        setType(newType);
        setPage(0);
        syncUrl(query, newType);
        if (query.trim()) doSearch(query, newType, 0, false);
    };

    const handleSemanticTypeChange = (newType) => {
        setSemanticType(newType);
        if (query.trim()) doSemanticSearch(query, newType);
    };

    const handleModeChange = (newMode) => {
        setMode(newMode);
    };

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        doSearch(query, type, nextPage, true);
    };

    const isAll = type === "all";

    return (
        <ContentWidth compact='max-w-3xl' className='px-4'>
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

            <div className='grid grid-cols-2 gap-1.5 mb-4 bg-gray-50 dark:bg-slate-900/50 p-1 rounded-xl max-w-xs'>
                <button
                    type='button'
                    onClick={() => handleModeChange("keyword")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        mode === "keyword"
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-slate-800"
                    }`}
                >
                    🔤 {t("search.mode_keyword") || "Kata Kunci"}
                </button>
                <button
                    type='button'
                    onClick={() => handleModeChange("makna")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        mode === "makna"
                            ? "bg-purple-600 text-white shadow-sm"
                            : "text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-slate-800"
                    }`}
                >
                    🧠 {t("search.mode_makna") || "Makna"}
                </button>
            </div>

            {mode === "keyword" ? (
                <div className='flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide'>
                    {TYPES.map((typeItem) => (
                        <button
                            key={typeItem.value}
                            onClick={() => handleTypeChange(typeItem.value)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${
                                type === typeItem.value
                                    ? "bg-emerald-700 text-white"
                                    : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-emerald-100 dark:hover:bg-slate-600"
                            }`}
                        >
                            {typeItem.label}
                        </button>
                    ))}
                </div>
            ) : (
                <div className='flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide'>
                    {SEMANTIC_TYPES.map((typeItem) => (
                        <button
                            key={typeItem.value || "all"}
                            onClick={() =>
                                handleSemanticTypeChange(typeItem.value)
                            }
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${
                                semanticType === typeItem.value
                                    ? "bg-purple-600 text-white"
                                    : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-slate-600"
                            }`}
                        >
                            {typeItem.label}
                        </button>
                    ))}
                </div>
            )}

            {mode === "makna" ? (
                <>
                    {isSemanticLoading && <SkeletonInline rows={4} />}

                    {semanticError && (
                        <p className='text-sm text-red-500 dark:text-red-400'>
                            {semanticError}
                        </p>
                    )}

                    {!isSemanticLoading && askAnswer && (
                        <div className='mb-6 p-4 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20'>
                            <p className='text-[11px] font-semibold uppercase tracking-wide text-purple-600 dark:text-purple-400 mb-1'>
                                🧠 {t("search.ask_answer") || "Jawaban"}
                            </p>
                            <p className='text-sm text-gray-700 dark:text-gray-200 whitespace-pre-line'>
                                {askAnswer.answer}
                            </p>
                        </div>
                    )}

                    {!isSemanticLoading &&
                        semanticResults &&
                        (semanticResults.results?.length > 0 ? (
                            <div className='space-y-2'>
                                {semanticResults.results.map((r, i) => (
                                    <SemanticResultCard
                                        key={`${r.content_type}-${r.content_id}-${i}`}
                                        result={r}
                                        typeLabels={SEMANTIC_TYPE_LABELS}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className='text-center py-12'>
                                <p className='text-gray-500 dark:text-gray-400 text-sm'>
                                    {t("common.no_results")} &quot;{query}
                                    &quot;
                                </p>
                            </div>
                        ))}
                </>
            ) : (
                <>
                    {isLoading && <SkeletonInline rows={4} />}

                    {error && (
                        <p className='text-sm text-red-500 dark:text-red-400'>
                            {error}
                        </p>
                    )}
                </>
            )}

            {mode === "keyword" && results && !isLoading && (
                <div className='space-y-8'>
                    {isAll ? (
                        <>
                            {SECTION_DEFS.map((sec) => (
                                <ResultSection
                                    key={sec.type}
                                    type={sec.type}
                                    label={t(sec.labelKey)}
                                    total={getTotal(results, sec.type)}
                                    items={getItems(results, sec.itemsKey)}
                                    renderCard={(item) =>
                                        sec.renderCard(item, lang, routeMap)
                                    }
                                    seeAllHref={sec.seeAllHref(
                                        routeMap,
                                        query,
                                    )}
                                />
                            ))}
                            {results.total === 0 && (
                                <div className='text-center py-12'>
                                    <p className='text-gray-500 dark:text-gray-400 text-sm'>
                                        {t("common.no_results")} &quot;{query}
                                        &quot;
                                    </p>
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            {SECTION_DEFS.filter(
                                (sec) => sec.type === type,
                            ).map((sec) => (
                                <ResultSection
                                    key={sec.type}
                                    type={sec.type}
                                    label={t(sec.labelKey)}
                                    total={getTotal(results, sec.type)}
                                    items={getItems(results, sec.itemsKey)}
                                    renderCard={(item) =>
                                        sec.renderCard(item, lang, routeMap)
                                    }
                                    hasMore={
                                        getItems(results, sec.itemsKey).length <
                                        getTotal(results, sec.type)
                                    }
                                    onLoadMore={handleLoadMore}
                                />
                            ))}
                            {getTotal(results, type) === 0 && (
                                <div className='text-center py-12'>
                                    <p className='text-gray-500 dark:text-gray-400 text-sm'>
                                        {t("common.no_results")} &quot;{query}
                                        &quot;
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </ContentWidth>
    );
}
