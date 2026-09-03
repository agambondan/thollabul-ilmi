"use client";
/* eslint-disable @next/next/no-img-element */

import { SkeletonInline } from "@/components/skeleton/Skeleton";
import { blogApi } from "@/lib/api";
import { useLocale } from "@/context/Locale";
import { useLayoutMode } from "@/lib/useLayoutMode";
import { getLocalizedField } from "@/lib/translation";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BsSearch } from "react-icons/bs";

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
    const [selectedCategory, setSelectedCategory] = useState("");
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
    }, [initialCategories]);

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

    const filteredPosts = posts.filter((post) => {
        const query = search.trim().toLowerCase();
        const title = getLocalizedField(post, "title", lang);
        const excerpt = getLocalizedField(post, "excerpt", lang);
        const authorName = getAuthorName(post.author);
        const categoryLabel =
            getCategoryLabel(post.category, lang) ||
            getLocalizedField(post, "category", lang);
        const categoryValue = getCategoryValue(
            post.category ?? categoryLabel,
            lang,
        );
        const matchesQuery =
            !query ||
            title?.toLowerCase().includes(query) ||
            excerpt?.toLowerCase().includes(query) ||
            authorName?.toLowerCase().includes(query) ||
            categoryLabel?.toLowerCase().includes(query);
        const matchesCategory =
            !selectedCategory ||
            categoryValue.toLowerCase() === selectedCategory.toLowerCase();

        if (!query && !selectedCategory) return true;
        return matchesQuery && matchesCategory;
    });

    return (
        <div
            className={
                isWide ? "w-full px-4" : "container mx-auto px-4 max-w-3xl"
            }
        >
            <div className='mb-8'>
                <h1 className='text-2xl font-bold text-emerald-900 dark:text-white mb-1'>
                    {t("blog.title")}
                </h1>
                <p className='text-sm text-gray-500 dark:text-gray-400'>
                    {t("blog.subtitle")}
                </p>
            </div>

            <div className='flex items-center gap-2 mb-6 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 px-3 py-2'>
                <BsSearch className='text-gray-400 shrink-0' />
                <input
                    type='text'
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t("blog.search_placeholder")}
                    className='flex-1 bg-transparent text-sm text-gray-700 dark:text-gray-200 outline-none'
                />
            </div>

            {categories.length > 0 && (
                <div className='flex flex-wrap gap-2 mb-6'>
                    <button
                        type='button'
                        onClick={() => setSelectedCategory("")}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                            selectedCategory === ""
                                ? "bg-emerald-700 text-white"
                                : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-emerald-100 dark:hover:bg-slate-600"
                        }`}
                    >
                        {t("blog.filter_all")}
                    </button>
                    {categories.map((category) => {
                        const categoryValue = getCategoryValue(category, lang);
                        const categoryLabel = getCategoryLabel(category, lang);
                        return (
                            <button
                                key={categoryValue}
                                type='button'
                                onClick={() =>
                                    setSelectedCategory(categoryValue)
                                }
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                    categoryValue.toLowerCase() ===
                                    selectedCategory.toLowerCase()
                                        ? "bg-emerald-700 text-white"
                                        : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-emerald-100 dark:hover:bg-slate-600"
                                }`}
                            >
                                {categoryLabel}
                            </button>
                        );
                    })}
                </div>
            )}

            {isLoading && <SkeletonInline rows={4} />}

            {error && posts.length === 0 && !isLoading && (
                <div className='text-center py-12'>
                    <p className='text-red-500 dark:text-red-400 text-sm'>
                        {t("blog.load_error")}
                    </p>
                </div>
            )}

            {!error && !isLoading && posts.length === 0 && (
                <div className='text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700'>
                    <p
                        className='text-4xl text-emerald-300 dark:text-emerald-700 mb-3'
                        style={{ fontFamily: "Amiri, serif" }}
                    >
                        كِتَابَةً
                    </p>
                    <p className='text-gray-500 dark:text-gray-400 font-medium mb-1'>
                        {t("blog.empty_title")}
                    </p>
                    <p className='text-sm text-gray-400'>
                        {t("blog.empty_hint")}
                    </p>
                </div>
            )}

            {!error &&
                !isLoading &&
                posts.length > 0 &&
                filteredPosts.length === 0 && (
                    <div className='text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700'>
                        <p className='text-gray-500 dark:text-gray-400 font-medium mb-1'>
                            {t("blog.no_match_title")}
                        </p>
                        <p className='text-sm text-gray-400'>
                            {t("blog.no_match_hint")}
                        </p>
                        <button
                            type='button'
                            onClick={() => {
                                setSearch("");
                                setSelectedCategory("");
                            }}
                            className='mt-4 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-medium transition-colors'
                        >
                            {t("blog.reset_filter")}
                        </button>
                    </div>
                )}

            <div className='space-y-4'>
                {filteredPosts.map((post) => (
                    <Link
                        key={post.id ?? post.slug}
                        href={`${basePath}/${post.slug}`}
                        className='block bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-sm transition-all overflow-hidden'
                    >
                        {post.cover_image && (
                            <img
                                src={post.cover_image}
                                alt={getLocalizedField(post, "title", lang)}
                                className='w-full h-40 object-cover'
                            />
                        )}
                        <div className='p-4'>
                            {getCategoryLabel(post.category, lang) && (
                                <span className='text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-2 block'>
                                    {getCategoryLabel(post.category, lang)}
                                </span>
                            )}
                            <h2 className='font-bold text-emerald-900 dark:text-white mb-1 line-clamp-2'>
                                {getLocalizedField(post, "title", lang)}
                            </h2>
                            {getLocalizedField(post, "excerpt", lang) && (
                                <p className='text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3'>
                                    {getLocalizedField(post, "excerpt", lang)}
                                </p>
                            )}
                            <div className='flex items-center justify-between text-xs text-gray-400'>
                                {getAuthorName(post.author) && (
                                    <span>{getAuthorName(post.author)}</span>
                                )}
                                {post.published_at && (
                                    <span>
                                        {new Date(
                                            post.published_at,
                                        ).toLocaleDateString("id-ID", {
                                            day: "numeric",
                                            month: "long",
                                            year: "numeric",
                                        })}
                                    </span>
                                )}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {isLoadingMore && (
                <div className='flex justify-center py-6'>
                    <div className='w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin' />
                </div>
            )}

            <div ref={sentinelRef} className='h-1' />

            {!hasMore && posts.length > 0 && !isLoading && (
                <p className='text-center text-xs text-gray-400 dark:text-gray-600 py-4'>
                    {t("blog.all_shown")}
                </p>
            )}

            {!isLoading && filteredPosts.length === 0 && posts.length > 0 && (
                <p className='text-center text-xs text-gray-400 dark:text-gray-600 py-4'>
                    {t("blog.no_search")}
                </p>
            )}
        </div>
    );
}

export { BlogClient as BlogContent };
