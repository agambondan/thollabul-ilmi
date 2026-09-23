"use client";

import Image from "next/image";
import { SkeletonInline } from "@/components/skeleton/Skeleton";
import { blogApi } from "@/lib/api";
import { useLocale } from "@/context/Locale";
import { useLayoutMode } from "@/lib/useLayoutMode";
import { getLocalizedField } from "@/lib/translation";
import Link from "next/link";
import { useEffect, useRef, useState, useMemo } from "react";
import { BsSearch, BsTag, BsPerson, BsCalendar, BsClock } from "react-icons/bs";

const PAGE_SIZE = 10;

const getCategoryLabel = (category, lang) => {
    if (!category) return "";
    if (typeof category === "string") return category;
    if (typeof category.name === "string") return category.name;
    return getLocalizedField(category, "name", lang) || category.slug || "";
};

const getCategoryValue = (category, lang) => {
    if (!category) return "";
    if (typeof category === "string") return category;
    return String(
        category.slug ?? category.id ?? getCategoryLabel(category, lang),
    );
};

const getAuthorName = (author) => {
    if (!author) return "";
    if (typeof author === "string") return author;
    return author.name ?? author.email ?? "";
};

const getTagLabel = (tag, lang) => {
    if (!tag) return "";
    if (typeof tag === "string") return tag;
    if (typeof tag.name === "string") return tag.name;
    return getLocalizedField(tag, "name", lang) || tag.slug || "";
};

const getPostExcerpt = (post, lang) => {
    const translation = post?.translation ?? {};
    const text =
        getLocalizedField(post, "excerpt", lang) ||
        (lang === "EN" &&
            (translation.description_en || translation.descriptionEnglish)) ||
        translation.description_idn ||
        translation.descriptionIdn ||
        post?.description_idn ||
        post?.descriptionIdn ||
        "";
    return text
        .replace(/<[^>]*>/g, " ")
        .replace(/[#>*_`\[\]()]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
};

const getReadTime = (post) => {
    if (!post) return 0;
    const text =
        post.content_idn ||
        post.contentIdn ||
        post.content_en ||
        post.contentEn ||
        post.description_idn ||
        post.descriptionIdn ||
        "";
    const wordCount = text.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(wordCount / 200));
};

const uniqueTags = (posts) => {
    const seen = new Set();
    return posts
        .flatMap((post) => post.tags || [])
        .filter((tag) => {
            const key = tag.slug ?? tag.id ?? JSON.stringify(tag);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        })
        .sort((a, b) => getTagLabel(a, "ID").localeCompare(getTagLabel(b, "ID")));
};

const SORT_OPTIONS = [
    { value: "newest", labelKey: "blog.sort_newest" },
    { value: "oldest", labelKey: "blog.sort_oldest" },
    { value: "title-asc", labelKey: "blog.sort_title_asc" },
    { value: "title-desc", labelKey: "blog.sort_title_desc" },
];

export default function BlogClient({
    initialPosts = [],
    initialCategories = [],
    basePath = "/blog",
}) {
    const { t, lang } = useLocale();
    const { isWide } = useLayoutMode();
    const [posts, setPosts] = useState(initialPosts);
    const [categories, setCategories] = useState(initialCategories);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(initialPosts.length >= PAGE_SIZE);
    const [page, setPage] = useState(0);
    const [error, setError] = useState(false);
    const [search, setSearch] = useState("");
    const [selectedTags, setSelectedTags] = useState([]);
    const [sort, setSort] = useState("newest");
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const sentinelRef = useRef(null);

    const fetchPage = (pageNum, append) => {
        if (append) setIsLoadingMore(true);
        else setIsLoading(true);
        blogApi
            .list(pageNum, PAGE_SIZE)
            .then((r) => r.json())
            .then((data) => {
                const items = data?.items ?? data ?? [];
                setPosts((prev) => (append ? [...prev, ...items] : items));
                setHasMore(items.length >= PAGE_SIZE);
            })
            .catch(() => {
                setError(true);
                setHasMore(false);
            })
            .finally(() => {
                if (append) setIsLoadingMore(false);
                else setIsLoading(false);
            });
    };

    useEffect(() => {
        if (initialCategories.length === 0) {
            blogApi
                .listCategories()
                .then((r) => r.json())
                .then((data) => {
                    const items = data?.items ?? data?.data ?? data ?? [];
                    setCategories(Array.isArray(items) ? items : []);
                })
                .catch(() => setCategories([]));
        }
    }, [initialCategories.length]);

    useEffect(() => {
        if (page === 0) return;
        fetchPage(page, true);
    }, [page]);

    useEffect(() => {
        const el = sentinelRef.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([entry]) => {
                if (
                    entry.isIntersecting &&
                    hasMore &&
                    !isLoading &&
                    !isLoadingMore
                ) {
                    setPage((p) => p + 1);
                }
            },
            { rootMargin: "100px" },
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, [hasMore, isLoading, isLoadingMore]);

    useEffect(() => {
        setVisibleCount(PAGE_SIZE);
    }, [search, selectedTags, sort]);

    const allTags = useMemo(() => uniqueTags(posts), [posts]);

    const filteredPosts = useMemo(() => {
        const query = search.trim().toLowerCase();
        return posts.filter((post) => {
            const title = getLocalizedField(post, "title", lang);
            const excerpt = getPostExcerpt(post, lang);
            const authorName = getAuthorName(post.author);
            const categoryLabel =
                getCategoryLabel(post.category, lang) ||
                getLocalizedField(post, "category", lang);
            const matchesQuery =
                !query ||
                title?.toLowerCase().includes(query) ||
                excerpt?.toLowerCase().includes(query) ||
                authorName?.toLowerCase().includes(query) ||
                categoryLabel?.toLowerCase().includes(query);
            const matchesTags =
                selectedTags.length === 0 ||
                selectedTags.every((selectedTag) =>
                    (post.tags || []).some(
                        (postTag) =>
                            postTag.slug === selectedTag.slug ||
                            postTag.id === selectedTag.id ||
                            JSON.stringify(postTag) === JSON.stringify(selectedTag)
                    )
                );
            return matchesQuery && matchesTags;
        });
    }, [posts, search, selectedTags, lang]);

    const sortedPosts = useMemo(() => {
        const cloned = [...filteredPosts];
        switch (sort) {
            case "oldest":
                return cloned.sort(
                    (a, b) =>
                        new Date(a.published_at).getTime() -
                        new Date(b.published_at).getTime(),
                );
            case "title-asc":
                return cloned.sort((a, b) => {
                    const ta = getLocalizedField(a, "title", lang);
                    const tb = getLocalizedField(b, "title", lang);
                    return ta.localeCompare(tb);
                });
            case "title-desc":
                return cloned.sort((a, b) => {
                    const ta = getLocalizedField(a, "title", lang);
                    const tb = getLocalizedField(b, "title", lang);
                    return tb.localeCompare(ta);
                });
            case "newest":
            default:
                return cloned.sort(
                    (a, b) =>
                        new Date(b.published_at).getTime() -
                        new Date(a.published_at).getTime(),
                );
        }
    }, [filteredPosts, sort, lang]);

    const visiblePosts = sortedPosts.slice(0, visibleCount);
    const canLoadMore = visiblePosts.length < sortedPosts.length;

    const isTagEqual = (a, b) => {
        if (a === b) return true;
        const keyA = a?.slug ?? a?.id ?? a;
        const keyB = b?.slug ?? b?.id ?? b;
        return keyA === keyB;
    };

    const toggleTag = (tag) => {
        setSelectedTags((current) => {
            const exists = current.some((t) => isTagEqual(t, tag));
            const updated = exists
                ? current.filter((value) => !isTagEqual(value, tag))
                : [...current, tag];
            return updated.sort((a, b) =>
                getTagLabel(a, lang).localeCompare(getTagLabel(b, lang)),
            );
        });
    };

    const clearFilters = () => {
        setSearch("");
        setSelectedTags([]);
        setSort("newest");
    };

    const removeSelectedTag = (tag) => {
        setSelectedTags((current) =>
            current.filter((value) => !isTagEqual(value, tag)),
        );
    };

    const summaryText =
        sortedPosts.length === 0
            ? ""
            : `${visiblePosts.length} / ${sortedPosts.length} ${t("blog.showing")}`;

    const featuredPost = sortedPosts[0];
    const regularPosts = sortedPosts.slice(1);

    return (
        <div
            className={
                isWide
                    ? "w-full px-4"
                    : "container mx-auto px-4 max-w-3xl"
            }
        >
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-emerald-900 dark:text-white mb-1">
                    {t("blog.title")}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t("blog.subtitle")}
                </p>
            </div>

            <div className="mb-6 space-y-4">
                <div className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 px-3 py-2">
                    <BsSearch className="text-gray-400 shrink-0" />
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t("blog.search_placeholder")}
                        className="flex-1 bg-transparent text-sm text-gray-700 dark:text-gray-200 outline-none"
                    />
                </div>

                {allTags.length > 0 && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <p className="type-caption blog-body font-medium">
                                {t("blog.filter_by_tags")}
                                {selectedTags.length > 0 && (
                                    <span className="ml-2 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 rounded text-xs">
                                        {selectedTags.length}
                                    </span>
                                )}
                            </p>
                            {selectedTags.length > 0 && (
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
                                >
                                    {t("blog.clear_filters")}
                                </button>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {allTags.map((tag) => {
                                const active = selectedTags.some((t) => isTagEqual(t, tag));
                                const tagKey = tag.slug ?? tag.id ?? JSON.stringify(tag);
                                return (
                                    <button
                                        key={tagKey}
                                        type="button"
                                        onClick={() => toggleTag(tag)}
                                        aria-pressed={active}
                                        className={`
                                            px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-colors flex items-center gap-1 ${
                                                active
                                                    ? "bg-emerald-700 text-white"
                                                    : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-emerald-100 dark:hover:bg-slate-600"
                                            }
                                        `}
                                    >
                                        <BsTag className="w-3 h-3" />
                                        {getTagLabel(tag, lang)}
                                    </button>
                                );
                            })}
                        </div>
                        {selectedTags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                <span className="type-caption blog-body font-medium">
                                    {t("blog.selected_tags")}
                                </span>
                                {selectedTags.map((tag) => (
                                    <button
                                        key={`selected-${tag.slug ?? tag.id ?? JSON.stringify(tag)}`}
                                        type="button"
                                        onClick={() => removeSelectedTag(tag)}
                                        className="blog-tag-filter blog-tag-filter-active px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 flex items-center gap-1"
                                    >
                                        {getTagLabel(tag, lang)}
                                        <span className="ml-1">×</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-3">
                    <label
                        htmlFor="blog-sort-select"
                        className="type-caption blog-body font-medium whitespace-nowrap"
                    >
                        {t("blog.sort_label")}
                    </label>
                    <select
                        id="blog-sort-select"
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                        className="blog-sort-select w-auto rounded-md border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 outline-none"
                    >
                        {SORT_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {t(opt.labelKey)}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {isLoading && <SkeletonInline rows={4} />}

            {error && posts.length === 0 && !isLoading && (
                <div className="text-center py-12">
                    <p className="text-red-500 dark:text-red-400 text-sm">
                        {t("blog.load_error")}
                    </p>
                </div>
            )}

            {!error && !isLoading && sortedPosts.length === 0 && (
                <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700">
                    <p
                        className="text-4xl text-emerald-300 dark:text-emerald-700 mb-3"
                        style={{ fontFamily: "Amiri, serif" }}
                    >
                        كِتَابَةً
                    </p>
                    <p className="text-gray-500 dark:text-gray-400 font-medium mb-1">
                        {t("blog.empty_title")}
                    </p>
                    <p className="text-sm text-gray-400">
                        {t("blog.empty_hint")}
                    </p>
                </div>
            )}

            {!error && !isLoading && posts.length > 0 && sortedPosts.length === 0 && (
                <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700">
                    <p className="text-gray-500 dark:text-gray-400 font-medium mb-1">
                        {t("blog.no_match_title")}
                    </p>
                    <p className="text-sm text-gray-400 mb-4">
                        {t("blog.no_match_hint")}
                    </p>
                    <button
                        type="button"
                        onClick={clearFilters}
                        className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-medium transition-colors"
                    >
                        {t("blog.reset_filter")}
                    </button>
                </div>
            )}

            {!error && !isLoading && sortedPosts.length > 0 && (
                <>
                    {featuredPost && (
                        <article
                            className="relative group overflow-hidden rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 mb-6 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-lg transition-all"
                        >
                            <Link
                                href={`${basePath}/${featuredPost.slug}`}
                                className="block"
                            >
                                {featuredPost.cover_image && (
                                    <div className="relative w-full h-64 md:h-80 lg:h-96">
                                        <Image
                                            src={featuredPost.cover_image}
                                            alt={getLocalizedField(featuredPost, "title", lang)}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 80vw"
                                            priority
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
                                        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
                                            <div className="flex flex-wrap items-center gap-2 mb-2 sm:mb-3">
                                                {getCategoryLabel(featuredPost.category, lang) && (
                                                    <span className="inline-block px-2.5 py-0.5 sm:px-3 sm:py-1 bg-emerald-600 text-white text-[11px] sm:text-xs font-semibold uppercase tracking-wide rounded">
                                                        {getCategoryLabel(featuredPost.category, lang)}
                                                    </span>
                                                )}
                                                {featuredPost.tags && featuredPost.tags.length > 0 && (
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {featuredPost.tags.slice(0, 3).map((tag, i) => (
                                                            <span
                                                                key={i}
                                                                className="px-2 py-0.5 bg-black/40 text-emerald-300 rounded text-[11px] font-medium border border-white/10"
                                                            >
                                                                {getTagLabel(tag, lang)}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <h2 className="font-bold text-white text-lg sm:text-xl md:text-2xl lg:text-3xl line-clamp-2 mb-2">
                                                {getLocalizedField(featuredPost, "title", lang)}
                                            </h2>
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-white/80">
                                                {getAuthorName(featuredPost.author) && (
                                                    <span className="flex items-center gap-1">
                                                        <BsPerson className="w-3.5 h-3.5" />
                                                        {getAuthorName(featuredPost.author)}
                                                    </span>
                                                )}
                                                {featuredPost.published_at && (
                                                    <span className="flex items-center gap-1">
                                                        <BsCalendar className="w-3.5 h-3.5" />
                                                        {new Date(featuredPost.published_at).toLocaleDateString("id-ID", {
                                                            day: "numeric",
                                                            month: "long",
                                                            year: "numeric",
                                                        })}
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1">
                                                    <BsClock className="w-3.5 h-3.5" />
                                                    {getReadTime(featuredPost)} {t("blog.reading_time")}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {!featuredPost.cover_image && (
                                    <div className="p-6 md:p-8">
                                        <div className="flex flex-wrap items-center gap-2 mb-3">
                                            {getCategoryLabel(featuredPost.category, lang) && (
                                                <span className="inline-block px-3 py-1 bg-emerald-600 text-white text-xs font-semibold uppercase tracking-wide rounded">
                                                    {getCategoryLabel(featuredPost.category, lang)}
                                                </span>
                                            )}
                                            {featuredPost.tags && featuredPost.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {featuredPost.tags.slice(0, 3).map((tag, i) => (
                                                        <span
                                                            key={i}
                                                            className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 rounded text-xs font-medium"
                                                        >
                                                            {getTagLabel(tag, lang)}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <h2 className="font-bold text-emerald-900 dark:text-white text-xl md:text-2xl lg:text-3xl line-clamp-2 mb-3">
                                            {getLocalizedField(featuredPost, "title", lang)}
                                        </h2>
                                        {getPostExcerpt(featuredPost, lang) && (
                                            <p className="text-gray-600 dark:text-gray-400 line-clamp-3 mb-4">
                                                {getPostExcerpt(featuredPost, lang)}
                                            </p>
                                        )}
                                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                            {getAuthorName(featuredPost.author) && (
                                                <span className="flex items-center gap-1">
                                                    <BsPerson className="w-3.5 h-3.5" />
                                                    {getAuthorName(featuredPost.author)}
                                                </span>
                                            )}
                                            {featuredPost.published_at && (
                                                <span className="flex items-center gap-1">
                                                    <BsCalendar className="w-3.5 h-3.5" />
                                                    {new Date(featuredPost.published_at).toLocaleDateString("id-ID", {
                                                        day: "numeric",
                                                        month: "long",
                                                        year: "numeric",
                                                    })}
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1">
                                                <BsClock className="w-3.5 h-3.5" />
                                                {getReadTime(featuredPost)} {t("blog.reading_time")}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </Link>
                        </article>
                    )}

                    {regularPosts.length > 0 && (
                        <section className="space-y-4" aria-label={t("blog.articles")}>
                            {regularPosts.map((post, idx) => {
                                const visibleIdx = idx + 1;
                                if (visibleIdx > visibleCount) return null;
                                return (
                                    <article
                                        key={post.id ?? post.slug}
                                        className="relative overflow-hidden bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-sm transition-all"
                                    >
                                        <Link
                                            href={`${basePath}/${post.slug}`}
                                            className="block"
                                        >
                                            <div className="flex flex-col md:flex-row">
                                                {post.cover_image && (
                                                    <div className="relative w-full md:w-64 md:flex-shrink-0 h-44 md:h-auto min-h-[160px]">
                                                        <Image
                                                            src={post.cover_image}
                                                            alt={getLocalizedField(post, "title", lang)}
                                                            fill
                                                            className="object-cover"
                                                            sizes="(max-width: 768px) 100vw, 256px"
                                                        />
                                                    </div>
                                                )}
                                                {!post.cover_image && (
                                                    <div className="relative w-full md:w-64 md:flex-shrink-0 h-44 md:h-auto min-h-[160px] bg-gradient-to-br from-emerald-100 via-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:via-emerald-800/20 dark:to-teal-900/30 flex items-center justify-center">
                                                        <div className="text-emerald-300 dark:text-emerald-700 text-center px-4">
                                                            <BsCalendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                                            <p className="text-sm font-medium">{t("blog.no_image")}</p>
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="p-4 md:p-5 flex flex-col justify-between flex-1 min-w-0">
                                                    <div>
                                                        <div className="flex items-center justify-between gap-2 mb-2">
                                                            {getCategoryLabel(post.category, lang) && (
                                                                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                                                                    {getCategoryLabel(post.category, lang)}
                                                                </span>
                                                            )}
                                                            {post.tags && post.tags.length > 0 && (
                                                                <div className="flex flex-wrap gap-1">
                                                                    {post.tags.slice(0, 2).map((tag, i) => (
                                                                        <span
                                                                            key={i}
                                                                            className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 rounded text-[10px] font-medium"
                                                                        >
                                                                            {getTagLabel(tag, lang)}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <h3 className="font-bold text-emerald-900 dark:text-white mb-1 line-clamp-2">
                                                            {getLocalizedField(post, "title", lang)}
                                                        </h3>
                                                        {getPostExcerpt(post, lang) && (
                                                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                                                                {getPostExcerpt(post, lang)}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-3 pt-3 border-t border-gray-100 dark:border-slate-700">
                                                        {getAuthorName(post.author) && (
                                                            <span className="flex items-center gap-1">
                                                                <BsPerson className="w-3 h-3" />
                                                                {getAuthorName(post.author)}
                                                            </span>
                                                        )}
                                                        {post.published_at && (
                                                            <span className="flex items-center gap-1">
                                                                <BsCalendar className="w-3 h-3" />
                                                                {new Date(post.published_at).toLocaleDateString("id-ID", {
                                                                    day: "numeric",
                                                                    month: "short",
                                                                    year: "numeric",
                                                                })}
                                                            </span>
                                                        )}
                                                        <span className="flex items-center gap-1">
                                                            <BsClock className="w-3 h-3" />
                                                            {getReadTime(post)} {t("blog.reading_time")}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    </article>
                                );
                            })}
                        </section>
                    )}

                    {canLoadMore && (
                        <div className="flex justify-center py-6">
                            <button
                                type="button"
                                onClick={() =>
                                    setVisibleCount((count) => count + PAGE_SIZE)
                                }
                                className="px-6 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-medium transition-colors flex items-center gap-2"
                            >
                                {t("blog.load_more")}
                            </button>
                        </div>
                    )}

                    {!canLoadMore && sortedPosts.length > 0 && !isLoading && (
                        <p className="text-center text-xs text-gray-400 dark:text-gray-600 py-4">
                            {t("blog.all_shown")}
                        </p>
                    )}
                </>
            )}

            {isLoadingMore && (
                <div className="flex justify-center py-6">
                    <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
            )}

            <div ref={sentinelRef} className="h-1" />
        </div>
    );
}

export const BlogContent = BlogClient;
