"use client";
/* eslint-disable @next/next/no-img-element */

import Footer from "@/components/Footer";
import { NavbarTailwindCss } from "@/components/Navbar";
import Section from "@/components/Section";
import { SkeletonList } from "@/components/skeleton/Skeleton";
import { useAuth } from "@/context/Auth";
import { useLocale } from "@/context/Locale";
import { useLayoutMode } from "@/lib/useLayoutMode";
import { blogApi, bookmarkApi } from "@/lib/api";
import { getLocalizedField } from "@/lib/translation";
import Link from "next/link";
import { useEffect, useState, use } from "react";
import { BsBookmark, BsBookmarkFill } from "react-icons/bs";

const normalizeItems = (data) => data?.items ?? data?.data ?? data ?? [];

const normalizeText = (value) =>
    String(value ?? "")
        .trim()
        .toLowerCase();

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

const getTagLabel = (tag, lang) => {
    if (!tag) return "";
    if (typeof tag === "string") return tag;
    if (typeof tag.name === "string") return tag.name;
    return getLocalizedField(tag, "name", lang) || tag.slug || "";
};

const getTagValue = (tag, lang) => {
    if (!tag) return "";
    if (typeof tag === "string") return tag;
    return String(tag.slug ?? tag.id ?? getTagLabel(tag, lang));
};

const getAuthorName = (author) => {
    if (!author) return "";
    if (typeof author === "string") return author;
    return author.name ?? author.email ?? "";
};

const formatDate = (value, lang = "ID") => {
    if (!value) return "";
    try {
        return new Date(value).toLocaleDateString(
            lang === "EN" ? "en-US" : "id-ID",
            {
                day: "numeric",
                month: "long",
                year: "numeric",
            },
        );
    } catch {
        return "";
    }
};

export const BlogDetailContent = ({ params, basePath = "/blog" }) => {
    const { t, lang } = useLocale();
    const { isWide } = useLayoutMode();
    const { isAuthenticated } = useAuth();
    const [post, setPost] = useState(null);
    const [relatedPosts, setRelatedPosts] = useState([]);
    const [popularPosts, setPopularPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);
    const [bookmarked, setBookmarked] = useState(false);
    const [bookmarkId, setBookmarkId] = useState(null);

    useEffect(() => {
        let isActive = true;

        const load = async () => {
            setIsLoading(true);
            setError(false);
            setPost(null);
            setRelatedPosts([]);
            setPopularPosts([]);

            try {
                const [detailRes, listRes] = await Promise.allSettled([
                    blogApi.detail(params.slug),
                    blogApi.list(0, 50),
                ]);

                if (detailRes.status !== "fulfilled" || !detailRes.value.ok) {
                    throw new Error("failed to load detail");
                }

                const detailData = await detailRes.value.json();
                if (!detailData || detailData.error) {
                    throw new Error("empty detail");
                }

                if (!isActive) return;
                setPost(detailData);

                if (listRes.status === "fulfilled" && listRes.value.ok) {
                    const blogList = normalizeItems(await listRes.value.json());
                    const currentSlug = normalizeText(
                        detailData.slug ?? params.slug,
                    );
                    const currentCategory = normalizeText(
                        getCategoryValue(detailData.category, lang),
                    );
                    const currentTags = new Set(
                        Array.isArray(detailData.tags)
                            ? detailData.tags
                                  .map((tag) =>
                                      normalizeText(getTagValue(tag, lang)),
                                  )
                                  .filter(Boolean)
                            : [],
                    );

                    const related = blogList
                        .filter(
                            (item) =>
                                normalizeText(item.slug ?? item.id) !==
                                currentSlug,
                        )
                        .filter((item) => {
                            const itemCategory = normalizeText(
                                getCategoryValue(item.category, lang),
                            );
                            const itemTags = Array.isArray(item.tags)
                                ? item.tags
                                      .map((tag) =>
                                          normalizeText(getTagValue(tag, lang)),
                                      )
                                      .filter(Boolean)
                                : [];

                            if (
                                currentCategory &&
                                itemCategory === currentCategory
                            )
                                return true;
                            return itemTags.some((tag) => currentTags.has(tag));
                        })
                        .sort((a, b) => {
                            const aDate = new Date(
                                a.published_at ?? a.created_at ?? 0,
                            ).getTime();
                            const bDate = new Date(
                                b.published_at ?? b.created_at ?? 0,
                            ).getTime();
                            return bDate - aDate;
                        })
                        .slice(0, 4);

                    const popular = blogList
                        .filter(
                            (item) =>
                                normalizeText(item.slug ?? item.id) !==
                                currentSlug,
                        )
                        .sort(
                            (a, b) =>
                                (b.view_count ?? 0) - (a.view_count ?? 0) ||
                                new Date(
                                    b.published_at ?? b.created_at ?? 0,
                                ).getTime() -
                                    new Date(
                                        a.published_at ?? a.created_at ?? 0,
                                    ).getTime(),
                        )
                        .slice(0, 3);

                    if (isActive) {
                        setRelatedPosts(related);
                        setPopularPosts(popular);
                    }
                }
            } catch {
                if (isActive) setError(true);
            } finally {
                if (isActive) setIsLoading(false);
            }
        };

        load();

        return () => {
            isActive = false;
        };
    }, [params.slug, lang]);

    useEffect(() => {
        if (!isAuthenticated || !params.slug) return;
        bookmarkApi
            .list()
            .then((r) => r.json())
            .then((d) => {
                const items = Array.isArray(d?.items)
                    ? d.items
                    : Array.isArray(d)
                      ? d
                      : [];
                const existing = items.find(
                    (b) =>
                        b.ref_type === "article" && b.ref_slug === params.slug,
                );
                if (existing) {
                    setBookmarked(true);
                    setBookmarkId(existing.id);
                }
            })
            .catch((e) => console.error(e));
    }, [isAuthenticated, params.slug]);

    const toggleBookmark = async () => {
        if (!isAuthenticated) return;
        if (bookmarked && bookmarkId) {
            setBookmarked(false);
            setBookmarkId(null);
            bookmarkApi.remove(bookmarkId).catch(() => {
                setBookmarked(true);
            });
        } else {
            try {
                const res = await bookmarkApi.add("article", 0, {
                    ref_slug: params.slug,
                });
                if (res.ok) {
                    const data = await res.json();
                    setBookmarked(true);
                    setBookmarkId(data?.data?.id ?? data?.id ?? null);
                }
            } catch {}
        }
    };

    if (isLoading) return <SkeletonList title={false} rows={5} />;

    const postCategoryLabel = getCategoryLabel(post?.category, lang);
    const postAuthorName = getAuthorName(post?.author);

    return (
        <div
            className={
                isWide ? "w-full px-4" : "container mx-auto px-4 max-w-4xl"
            }
        >
            <Link
                href={basePath}
                className='inline-flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400 hover:underline mb-6'
            >
                ← {t("blog.back_to_articles")}
            </Link>

            {error && (
                <div className='text-center py-12'>
                    <p className='text-gray-500 dark:text-gray-400'>
                        {t("blog.detail_not_found")}
                    </p>
                </div>
            )}

            {post && (
                <article className='bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden'>
                    <div className='p-5 md:p-8'>
                        {postCategoryLabel && (
                            <span className='text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-3 block'>
                                {postCategoryLabel}
                            </span>
                        )}
                        <h1 className='text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3 leading-snug'>
                            {getLocalizedField(post, "title", lang)}
                        </h1>
                        <div className='flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 mb-6 pb-6 border-b border-gray-100 dark:border-slate-700'>
                            {postAuthorName && (
                                <span>
                                    {t("blog.by_author")} {postAuthorName}
                                </span>
                            )}
                            {post.published_at && (
                                <span>
                                    {formatDate(post.published_at, lang)}
                                </span>
                            )}
                            {post.view_count != null && (
                                <span>
                                    {post.view_count.toLocaleString()}{" "}
                                    {t("blog.read_count")}
                                </span>
                            )}
                            {isAuthenticated && (
                                <button
                                    onClick={toggleBookmark}
                                    className={`ml-auto flex items-center gap-1 transition-colors ${
                                        bookmarked
                                            ? "text-emerald-600 dark:text-emerald-400"
                                            : "text-gray-400 hover:text-emerald-500"
                                    }`}
                                    title={
                                        bookmarked
                                            ? t("bookmarks.remove")
                                            : t("bookmarks.save")
                                    }
                                >
                                    {bookmarked ? (
                                        <BsBookmarkFill />
                                    ) : (
                                        <BsBookmark />
                                    )}
                                </button>
                            )}
                        </div>

                        {post.cover_image && (
                            <img
                                src={post.cover_image}
                                alt={getLocalizedField(post, "title", lang)}
                                className='w-full rounded-xl mb-6 max-h-80 object-cover'
                            />
                        )}

                        <div className='text-gray-700 dark:text-gray-300 leading-relaxed space-y-4 text-sm'>
                            {getLocalizedField(post, "content", lang)
                                ?.split("\n")
                                .filter(Boolean)
                                .map((para, i) => (
                                    <p key={i}>{para}</p>
                                ))}
                        </div>
                    </div>

                    {post.tags && post.tags.length > 0 && (
                        <div className='flex gap-2 flex-wrap px-5 md:px-8 py-5 border-t border-gray-100 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-800/40'>
                            {post.tags.map((tag) => {
                                const tagLabel = getTagLabel(tag, lang);
                                return (
                                    <span
                                        key={getTagValue(tag, lang)}
                                        className='px-3 py-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded-full text-xs'
                                    >
                                        #{tagLabel}
                                    </span>
                                );
                            })}
                        </div>
                    )}

                    {(relatedPosts.length > 0 || popularPosts.length > 0) && (
                        <div className='p-5 md:p-8 border-t border-gray-100 dark:border-slate-800 space-y-8'>
                            {relatedPosts.length > 0 && (
                                <section>
                                    <div className='flex items-center justify-between gap-3 mb-4'>
                                        <div>
                                            <p className='text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide'>
                                                {t("blog.related_articles")}
                                            </p>
                                            <h2 className='text-lg font-bold text-gray-900 dark:text-white'>
                                                {t("blog.keep_reading")}
                                            </h2>
                                        </div>
                                    </div>

                                    <div className='grid gap-3 md:grid-cols-2'>
                                        {relatedPosts.map((item) => (
                                            <Link
                                                key={item.id ?? item.slug}
                                                href={`${basePath}/${item.slug}`}
                                                className='block rounded-xl border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/60 p-4 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-sm transition-all'
                                            >
                                                {getCategoryLabel(
                                                    item.category,
                                                    lang,
                                                ) && (
                                                    <p className='text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-2'>
                                                        {getCategoryLabel(
                                                            item.category,
                                                            lang,
                                                        )}
                                                    </p>
                                                )}
                                                <h3 className='font-bold text-gray-900 dark:text-white line-clamp-2 mb-2'>
                                                    {getLocalizedField(
                                                        item,
                                                        "title",
                                                        lang,
                                                    )}
                                                </h3>
                                                {getLocalizedField(
                                                    item,
                                                    "excerpt",
                                                    lang,
                                                ) && (
                                                    <p className='text-sm text-gray-600 dark:text-gray-400 line-clamp-2'>
                                                        {getLocalizedField(
                                                            item,
                                                            "excerpt",
                                                            lang,
                                                        )}
                                                    </p>
                                                )}
                                            </Link>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {popularPosts.length > 0 && (
                                <section>
                                    <p className='text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3'>
                                        {t("blog.popular_articles")}
                                    </p>
                                    <div className='space-y-3'>
                                        {popularPosts.map((item) => (
                                            <Link
                                                key={item.id ?? item.slug}
                                                href={`${basePath}/${item.slug}`}
                                                className='flex items-center justify-between gap-4 rounded-xl border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/60 px-4 py-3 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors'
                                            >
                                                <div className='min-w-0'>
                                                    <h3 className='font-medium text-gray-900 dark:text-white line-clamp-1'>
                                                        {getLocalizedField(
                                                            item,
                                                            "title",
                                                            lang,
                                                        )}
                                                    </h3>
                                                    <p className='text-xs text-gray-400 dark:text-gray-500 mt-0.5'>
                                                        {formatDate(
                                                            item.published_at ??
                                                                item.created_at,
                                                            lang,
                                                        )}
                                                    </p>
                                                </div>
                                                {item.view_count != null && (
                                                    <span className='shrink-0 text-xs font-semibold text-emerald-700 dark:text-emerald-300'>
                                                        {item.view_count.toLocaleString()}{" "}
                                                        {t("blog.read_count")}
                                                    </span>
                                                )}
                                            </Link>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>
                    )}
                </article>
            )}
        </div>
    );
};

const BlogDetailPage = (props) => {
    const params = use(props.params);

    return (
        <main className='min-h-screen flex flex-col'>
            <NavbarTailwindCss />
            <Section>
                <BlogDetailContent params={params} basePath='/blog' />
            </Section>
            <Footer />
        </main>
    );
};

export default BlogDetailPage;
