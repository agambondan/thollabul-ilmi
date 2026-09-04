"use client";
/* eslint-disable @next/next/no-img-element */

import Section from "@/components/Section";
import { SkeletonList } from "@/components/skeleton/Skeleton";
import { useAuth } from "@/context/Auth";
import { useLocale } from "@/context/Locale";
import { useLayoutMode } from "@/lib/useLayoutMode";
import { blogApi, bookmarkApi } from "@/lib/api";
import { getLocalizedField } from "@/lib/translation";
import {
    renderBlogContent,
    extractHeadings,
    calculateReadStats,
} from "@/lib/blogContent";
import {
    shareToWhatsApp,
    shareToTwitter,
    shareToFacebook,
    shareToTelegram,
    shareToEmail,
} from "@/lib/share";
import Link from "next/link";
import { useEffect, useState, useMemo, use } from "react";
import {
    BsBookmark,
    BsBookmarkFill,
    BsClock,
    BsBook,
    BsShare,
    BsLink45Deg,
    BsCheck2,
    BsWhatsapp,
    BsTwitterX,
    BsTelegram,
    BsEnvelope,
    BsListUl,
    BsChevronDown,
    BsChevronRight,
} from "react-icons/bs";

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
    const [copied, setCopied] = useState(false);
    const [tocOpen, setTocOpen] = useState(true);
    const [shareUrl, setShareUrl] = useState("");

    useEffect(() => {
        if (typeof window !== "undefined") {
            setShareUrl(window.location.href);
        }
    }, []);

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

    const handleCopyLink = async () => {
        if (!shareUrl) return;
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            setCopied(false);
        }
    };

    // Calculate reading stats & compiled HTML content
    const rawContent = useMemo(() => {
        if (!post) return "";
        const translation = post.translation ?? {};
        return (
            (lang === "EN" &&
                (translation.description_en || translation.descriptionEnglish)) ||
            translation.description_idn ||
            translation.descriptionIdn ||
            post.description_idn ||
            post.descriptionIdn ||
            post.content ||
            post.body ||
            post.excerpt ||
            ""
        );
    }, [post, lang]);

    const htmlContent = useMemo(() => {
        return renderBlogContent(rawContent);
    }, [rawContent]);

    const stats = useMemo(() => {
        return calculateReadStats(rawContent);
    }, [rawContent]);

    const headings = useMemo(() => {
        return extractHeadings(htmlContent);
    }, [htmlContent]);

    if (isLoading) return <SkeletonList title={false} rows={5} />;

    const postCategoryLabel = getCategoryLabel(post?.category, lang);
    const postAuthorName = getAuthorName(post?.author);
    const postTitle = getLocalizedField(post, "title", lang);

    return (
        <div
            className={
                isWide ? "w-full px-4" : "container mx-auto px-4 max-w-6xl"
            }
        >
            <Link
                href={basePath}
                className='inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors mb-6'
            >
                ← {t("blog.back_to_articles")}
            </Link>

            {error && (
                <div className='text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm'>
                    <p className='text-base text-gray-500 dark:text-gray-300 dark:text-gray-400'>
                        {t("blog.detail_not_found")}
                    </p>
                </div>
            )}

            {post && (
                <div className='grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] items-start'>
                    {/* Main Article Column */}
                    <div className='min-w-0 space-y-8'>
                        <article className='bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden'>
                            {post.cover_image && (
                                <div className='relative w-full h-72 md:h-96 overflow-hidden bg-slate-100 dark:bg-slate-800'>
                                    <img
                                        src={post.cover_image}
                                        alt={postTitle}
                                        className='w-full h-full object-cover'
                                    />
                                    <div className='absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent' />
                                </div>
                            )}

                            <div className='p-6 md:p-10'>
                                <div className='flex flex-wrap items-center gap-2.5 mb-4'>
                                    {postCategoryLabel && (
                                        <span className='px-3 py-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 dark:text-emerald-300 rounded-full text-xs font-semibold uppercase tracking-wider'>
                                            {postCategoryLabel}
                                        </span>
                                    )}
                                    {stats.minutes > 0 && (
                                        <span className='inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 rounded-full text-xs font-medium'>
                                            <BsClock className='text-xs' />
                                            {stats.minutes} {t("blog.reading_time")}
                                        </span>
                                    )}
                                    {stats.words > 0 && (
                                        <span className='inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 rounded-full text-xs font-medium'>
                                            <BsBook className='text-xs' />
                                            {stats.words.toLocaleString()} {t("blog.words_count")}
                                        </span>
                                    )}
                                </div>

                                <h1 className='text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-gray-100 dark:text-white mb-4 leading-tight tracking-tight'>
                                    {postTitle}
                                </h1>

                                <div className='flex flex-wrap items-center justify-between gap-4 pb-6 mb-8 border-b border-gray-100 dark:border-slate-800 text-xs text-gray-500 dark:text-gray-300 dark:text-gray-400'>
                                    <div className='flex flex-wrap items-center gap-3'>
                                        {postAuthorName && (
                                            <span className='font-medium text-gray-700 dark:text-gray-200 dark:text-gray-300'>
                                                {t("blog.by_author")}{" "}
                                                <strong className='text-gray-900 dark:text-gray-100 dark:text-white'>
                                                    {postAuthorName}
                                                </strong>
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
                                    </div>

                                    {isAuthenticated && (
                                        <button
                                            onClick={toggleBookmark}
                                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
                                                bookmarked
                                                    ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400"
                                                    : "border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:border-emerald-300 dark:hover:border-emerald-700"
                                            }`}
                                            title={
                                                bookmarked
                                                    ? t("bookmarks.remove")
                                                    : t("bookmarks.save")
                                            }
                                        >
                                            {bookmarked ? (
                                                <BsBookmarkFill className='text-emerald-600 dark:text-emerald-400' />
                                            ) : (
                                                <BsBookmark />
                                            )}
                                            {bookmarked
                                                ? t("bookmarks.remove")
                                                : t("bookmarks.save")}
                                        </button>
                                    )}
                                </div>

                                {/* Article Body with .blog-content CSS */}
                                <div
                                    className='blog-content text-gray-700 dark:text-gray-200'
                                    dangerouslySetInnerHTML={{
                                        __html: htmlContent,
                                    }}
                                />
                            </div>

                            {/* Tags Footer */}
                            {post.tags && post.tags.length > 0 && (
                                <div className='px-6 md:px-10 py-5 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/30'>
                                    <div className='flex items-center gap-2 flex-wrap'>
                                        <span className='text-xs font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 mr-1'>
                                            {t("blog.tags_label")}:
                                        </span>
                                        {post.tags.map((tag) => {
                                            const tagLabel = getTagLabel(tag, lang);
                                            return (
                                                <span
                                                    key={getTagValue(tag, lang)}
                                                    className='px-3 py-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700/80 dark:border-slate-700 text-gray-600 dark:text-gray-300 rounded-full text-xs font-medium hover:border-emerald-400 dark:hover:border-emerald-600 transition-colors'
                                                >
                                                    #{tagLabel}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </article>

                        {/* Related & Popular Posts */}
                        {(relatedPosts.length > 0 || popularPosts.length > 0) && (
                            <div className='bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 p-6 md:p-8 shadow-sm space-y-8'>
                                {relatedPosts.length > 0 && (
                                    <section>
                                        <div className='mb-4'>
                                            <p className='text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide'>
                                                {t("blog.related_articles")}
                                            </p>
                                            <h2 className='text-lg font-bold text-gray-900 dark:text-gray-100 dark:text-white mt-1'>
                                                {t("blog.keep_reading")}
                                            </h2>
                                        </div>

                                        <div className='grid gap-4 md:grid-cols-2'>
                                            {relatedPosts.map((item) => (
                                                <Link
                                                    key={item.id ?? item.slug}
                                                    href={`${basePath}/${item.slug}`}
                                                    className='group block rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-800/50 p-5 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md transition-all'
                                                >
                                                    {getCategoryLabel(
                                                        item.category,
                                                        lang,
                                                    ) && (
                                                        <p className='text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2'>
                                                            {getCategoryLabel(
                                                                item.category,
                                                                lang,
                                                            )}
                                                        </p>
                                                    )}
                                                    <h3 className='font-bold text-gray-900 dark:text-gray-100 dark:text-white line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors mb-2'>
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
                                                        <p className='text-xs text-gray-500 dark:text-gray-300 dark:text-gray-400 line-clamp-2 leading-relaxed'>
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
                                        <p className='text-xs font-semibold text-gray-400 dark:text-gray-500 dark:text-gray-300 uppercase tracking-wide mb-3'>
                                            {t("blog.popular_articles")}
                                        </p>
                                        <div className='space-y-2.5'>
                                            {popularPosts.map((item) => (
                                                <Link
                                                    key={item.id ?? item.slug}
                                                    href={`${basePath}/${item.slug}`}
                                                    className='group flex items-center justify-between gap-4 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-800/40 px-4 py-3 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors'
                                                >
                                                    <div className='min-w-0'>
                                                        <h3 className='font-medium text-sm text-gray-900 dark:text-gray-100 dark:text-white line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors'>
                                                            {getLocalizedField(
                                                                item,
                                                                "title",
                                                                lang,
                                                            )}
                                                        </h3>
                                                        <p className='text-[11px] text-gray-400 mt-0.5'>
                                                            {formatDate(
                                                                item.published_at ??
                                                                    item.created_at,
                                                                lang,
                                                            )}
                                                        </p>
                                                    </div>
                                                    {item.view_count != null && (
                                                        <span className='shrink-0 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full'>
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
                    </div>

                    {/* Right Sticky Sidebar */}
                    <aside className='lg:sticky lg:top-24 space-y-5'>
                        {/* Table of Contents (TOC) */}
                        {headings.length > 0 && (
                            <div className='bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-5 shadow-sm'>
                                <button
                                    type='button'
                                    onClick={() => setTocOpen((v) => !v)}
                                    className='w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-300 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors'
                                >
                                    <span className='flex items-center gap-2'>
                                        <BsListUl className='text-sm text-emerald-600 dark:text-emerald-400' />
                                        {t("blog.toc")}
                                    </span>
                                    {tocOpen ? (
                                        <BsChevronDown className='text-xs' />
                                    ) : (
                                        <BsChevronRight className='text-xs' />
                                    )}
                                </button>

                                {tocOpen && (
                                    <nav className='mt-4 pt-3 border-t border-gray-100 dark:border-slate-800 max-h-72 overflow-y-auto space-y-1 pr-1'>
                                        {headings.map((h) => (
                                            <a
                                                key={h.id}
                                                href={`#${h.id}`}
                                                className={`block py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors line-clamp-1 ${
                                                    h.level === 3
                                                        ? "pl-4 text-[11px] text-gray-500 dark:text-gray-500"
                                                        : "font-medium"
                                                }`}
                                            >
                                                {h.text}
                                            </a>
                                        ))}
                                    </nav>
                                )}
                            </div>
                        )}

                        {/* Article Info Card */}
                        <div className='bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-5 shadow-sm space-y-3.5 text-xs text-gray-600 dark:text-gray-300 dark:text-gray-400'>
                            <div className='text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-300 dark:text-gray-400'>
                                {t("blog.published_on")}
                            </div>
                            <div className='space-y-2.5 pt-1'>
                                {post.published_at && (
                                    <div className='flex items-center justify-between'>
                                        <span>{t("common.date")}</span>
                                        <span className='font-medium text-gray-800 dark:text-gray-200'>
                                            {formatDate(post.published_at, lang)}
                                        </span>
                                    </div>
                                )}
                                {stats.minutes > 0 && (
                                    <div className='flex items-center justify-between'>
                                        <span>{t("blog.reading_time")}</span>
                                        <span className='font-medium text-gray-800 dark:text-gray-200'>
                                            ~{stats.minutes} {t("blog.reading_time")}
                                        </span>
                                    </div>
                                )}
                                {stats.words > 0 && (
                                    <div className='flex items-center justify-between'>
                                        <span>{t("blog.words_count")}</span>
                                        <span className='font-medium text-gray-800 dark:text-gray-200'>
                                            {stats.words.toLocaleString()} {t("blog.words_count")}
                                        </span>
                                    </div>
                                )}
                                {post.view_count != null && (
                                    <div className='flex items-center justify-between'>
                                        <span>{t("blog.read_count")}</span>
                                        <span className='font-medium text-gray-800 dark:text-gray-200'>
                                            {post.view_count.toLocaleString()}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Share Article Card */}
                        <div className='bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-5 shadow-sm'>
                            <div className='flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-300 dark:text-gray-400 mb-3.5'>
                                <BsShare className='text-emerald-600 dark:text-emerald-400' />
                                {t("blog.share")}
                            </div>

                            <button
                                type='button'
                                onClick={handleCopyLink}
                                className='w-full mb-3 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors'
                            >
                                {copied ? (
                                    <>
                                        <BsCheck2 className='text-emerald-600 text-sm' />
                                        <span className='text-emerald-600'>
                                            {t("blog.copied")}
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <BsLink45Deg className='text-sm' />
                                        <span>{t("blog.copy_link")}</span>
                                    </>
                                )}
                            </button>

                            <div className='grid grid-cols-2 gap-2 text-xs'>
                                <button
                                    type='button'
                                    onClick={() => shareToWhatsApp(shareUrl)}
                                    className='flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 dark:text-emerald-300 font-medium hover:bg-emerald-100 dark:hover:bg-emerald-950/70 transition-colors'
                                >
                                    <BsWhatsapp className='text-emerald-600' />
                                    {t("blog.share_whatsapp")}
                                </button>
                                <button
                                    type='button'
                                    onClick={() => shareToTwitter(shareUrl)}
                                    className='flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors'
                                >
                                    <BsTwitterX />
                                    {t("blog.share_twitter")}
                                </button>
                                <button
                                    type='button'
                                    onClick={() => shareToTelegram(shareUrl)}
                                    className='flex items-center gap-2 px-3 py-2 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 font-medium hover:bg-sky-100 dark:hover:bg-sky-950/70 transition-colors'
                                >
                                    <BsTelegram className='text-sky-500' />
                                    {t("blog.share_telegram")}
                                </button>
                                <button
                                    type='button'
                                    onClick={() => shareToFacebook(shareUrl)}
                                    className='flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 dark:text-blue-300 font-medium hover:bg-blue-100 dark:hover:bg-blue-950/70 transition-colors'
                                >
                                    <BsEnvelope />
                                    {t("blog.share_email")}
                                </button>
                            </div>
                        </div>
                    </aside>
                </div>
            )}
        </div>
    );
};

const BlogDetailPage = (props) => {
    const params = use(props.params);

    return (
        <main className='min-h-screen flex flex-col'>
            <Section>
                <BlogDetailContent params={params} basePath='/blog' />
            </Section>
        </main>
    );
};

export default BlogDetailPage;
