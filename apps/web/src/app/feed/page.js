"use client";

import ContentWidth from "@/components/layout/ContentWidth";
import { useAuth } from "@/context/Auth";
import { useLocale } from "@/context/Locale";
import { feedApi, commentApi } from "@/lib/api";
import { getFeedItems, getFeedTotal } from "@/lib/feedPagination";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
    BsHeart,
    BsHeartFill,
    BsChatDots,
    BsSend,
    BsEyeSlash,
    BsFlag,
    BsTrash,
    BsGlobe,
} from "react-icons/bs";

function formatDate(v, lang) {
    if (!v) return "";
    try {
        return new Date(v).toLocaleDateString(
            lang === "EN" ? "en-US" : "id-ID",
            {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            },
        );
    } catch {
        return "";
    }
}

function CommentSection({ postId, lang, t }) {
    const { token } = useAuth();
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [text, setText] = useState("");

    const fetchComments = useCallback(() => {
        setLoading(true);
        commentApi
            .list({ ref_id: postId, ref_type: "feed_post" })
            .then((r) => r.json())
            .then((d) => setComments(d?.data ?? d?.items ?? []))
            .catch((e) => console.error(e))
            .finally(() => setLoading(false));
    }, [postId]);

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    const submitComment = () => {
        if (!text.trim() || !token) return;
        commentApi
            .create({
                ref_id: Number(postId),
                ref_type: "feed_post",
                content: text,
            })
            .then((r) => r.json())
            .then(() => {
                setText("");
                fetchComments();
            })
            .catch((e) => console.error(e));
    };

    return (
        <div className='mt-3 pt-3 border-t border-gray-100 dark:border-slate-700'>
            {loading ? (
                <p className='text-xs text-gray-400'>
                    {t("common.loading") ?? "Loading..."}
                </p>
            ) : comments.length === 0 ? (
                <p className='text-xs text-gray-400 mb-2'>
                    {t("feed.no_comments") ?? "Belum ada komentar."}
                </p>
            ) : (
                <div className='space-y-2 mb-3'>
                    {comments.map((c) => (
                        <div key={c.id} className='flex gap-2'>
                            <div className='w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0'>
                                <span className='text-[10px] font-bold text-emerald-700 dark:text-emerald-400'>
                                    {(c.author ??
                                        c.username ??
                                        "U")[0].toUpperCase()}
                                </span>
                            </div>
                            <div className='flex-1 min-w-0'>
                                <p className='text-xs font-medium text-gray-700 dark:text-gray-300'>
                                    {c.author ?? c.username ?? "User"}
                                </p>
                                <p className='text-xs text-gray-500 dark:text-gray-400'>
                                    {c.content}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {token ? (
                <div className='flex gap-2'>
                    <input
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && submitComment()}
                        placeholder={
                            t("feed.comment_placeholder") ?? "Tulis komentar..."
                        }
                        className='flex-1 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-emerald-400'
                    />
                    <button
                        onClick={submitComment}
                        disabled={!text.trim()}
                        className='px-3 py-1.5 bg-emerald-700 text-white rounded-lg text-xs disabled:opacity-40 hover:bg-emerald-600'
                    >
                        <BsSend />
                    </button>
                </div>
            ) : null}
        </div>
    );
}

export function FeedContent({ basePath = "/feed" }) {
    const { t, lang } = useLocale();
    const { token, user } = useAuth();
    const [posts, setPosts] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [openComment, setOpenComment] = useState(null);
    const [showCreate, setShowCreate] = useState(false);
    const [caption, setCaption] = useState("");
    const [refType, setRefType] = useState("");
    const [creating, setCreating] = useState(false);
    const size = 20;

    const fetchPosts = (p) => {
        setLoading(true);
        feedApi
            .list({ page: String(p - 1), size: String(size) })
            .then((r) => r.json())
            .then((d) => {
                const items = getFeedItems(d);
                setPosts(items);
                setTotal(getFeedTotal(d, p, size, items.length));
            })
            .catch((e) => console.error(e))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchPosts(page);
    }, [page]);

    const handleLike = (post) => {
        if (!token) return;
        feedApi
            .like(post.id)
            .then(() => {
                setPosts((prev) =>
                    prev.map((p) =>
                        p.id === post.id
                            ? { ...p, likes: (p.likes ?? 0) + 1 }
                            : p,
                    ),
                );
            })
            .catch((e) => console.error(e));
    };

    const handleHide = (post) => {
        if (!token) return;
        feedApi
            .hide(post.id)
            .then(() => {
                setPosts((prev) => prev.filter((p) => p.id !== post.id));
            })
            .catch((e) => console.error(e));
    };

    const handleReport = (post) => {
        if (!token) return;
        feedApi
            .report(post.id)
            .then(() => {
                alert(t("feed.reported") ?? "Postingan dilaporkan");
            })
            .catch((e) => console.error(e));
    };

    const handleDelete = (post) => {
        if (!token) return;
        feedApi
            .delete(post.id)
            .then(() => {
                setPosts((prev) => prev.filter((p) => p.id !== post.id));
            })
            .catch((e) => console.error(e));
    };

    const handleCreate = () => {
        if (!caption.trim() || creating) return;
        setCreating(true);
        feedApi
            .create({ caption: caption.trim(), ref_type: refType || undefined })
            .then((r) => r.json())
            .then(() => {
                setCaption("");
                setRefType("");
                setShowCreate(false);
                setPage(1);
                fetchPosts(1);
            })
            .catch((e) => console.error(e))
            .finally(() => setCreating(false));
    };

    const totalPages = Math.ceil(total / size);

    return (
        <ContentWidth compact='max-w-2xl' className='px-4 py-6'>
            <div className='text-center mb-8'>
                <div className='inline-flex items-center justify-center w-16 h-16 bg-emerald-100 dark:bg-emerald-900/40 rounded-2xl mb-4'>
                    <BsGlobe className='text-3xl text-emerald-600 dark:text-emerald-400' />
                </div>
                <h1 className='text-2xl font-bold text-gray-900 dark:text-white mb-1'>
                    {t("feed.title") ?? "Feed Komunitas"}
                </h1>
                <p className='text-sm text-gray-500 dark:text-gray-400'>
                    {t("feed.subtitle") ??
                        "Bagikan dan temukan konten dari pengguna lain"}
                </p>
            </div>

            <div className='mb-6'>
                {token ? (
                    <button
                        onClick={() => setShowCreate(!showCreate)}
                        className='w-full py-3 px-4 bg-white dark:bg-slate-800 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-2xl text-sm text-gray-400 hover:border-emerald-300 hover:text-emerald-600 transition-colors'
                    >
                        {showCreate
                            ? "—"
                            : `+ ${t("feed.create") ?? "Buat Postingan"}`}
                    </button>
                ) : (
                    <Link
                        href={`/auth/login?next=${basePath}`}
                        className='block text-center py-3 px-4 bg-white dark:bg-slate-800 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-2xl text-sm text-gray-400 hover:border-emerald-300 hover:text-emerald-700 transition-colors'
                    >
                        {t("feed.login_to_create") ??
                            "Login untuk membuat postingan."}
                    </Link>
                )}
            </div>

            {showCreate && (
                <div className='mb-6 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700'>
                    <textarea
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        placeholder={
                            t("feed.content_placeholder") ?? "Tulis caption..."
                        }
                        rows={3}
                        className='w-full bg-transparent text-sm text-gray-700 dark:text-gray-200 outline-none resize-none mb-3'
                    />
                    <div className='flex items-center gap-2'>
                        <select
                            value={refType}
                            onChange={(e) => setRefType(e.target.value)}
                            className='text-xs bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg px-2 py-1.5 outline-none'
                        >
                            <option value=''>
                                {t("feed.ref_type") ?? "Tipe Rujukan"}
                            </option>
                            <option value='ayah'>
                                {t("feed.ref_ayah") ?? "Ayat Quran"}
                            </option>
                            <option value='hadith'>
                                {t("feed.ref_hadith") ?? "Hadis"}
                            </option>
                        </select>
                        <div className='flex-1' />
                        <button
                            onClick={() => setShowCreate(false)}
                            className='px-4 py-1.5 text-xs text-gray-500 hover:text-gray-700'
                        >
                            {t("common.cancel") ?? "Batal"}
                        </button>
                        <button
                            onClick={handleCreate}
                            disabled={!caption.trim() || creating}
                            className='px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium disabled:opacity-40 hover:bg-emerald-700'
                        >
                            {creating ? "..." : (t("feed.submit") ?? "Bagikan")}
                        </button>
                    </div>
                </div>
            )}

            {loading ? (
                <div className='space-y-4'>
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div
                            key={i}
                            className='p-5 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 animate-pulse'
                        >
                            <div className='flex items-center gap-3 mb-3'>
                                <div className='w-10 h-10 rounded-full bg-gray-200 dark:bg-slate-700' />
                                <div className='h-3 bg-gray-200 dark:bg-slate-700 rounded w-24' />
                            </div>
                            <div className='h-3 bg-gray-200 dark:bg-slate-700 rounded w-full mb-2' />
                            <div className='h-3 bg-gray-200 dark:bg-slate-700 rounded w-2/3' />
                        </div>
                    ))}
                </div>
            ) : posts.length === 0 ? (
                <div className='text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700'>
                    <BsGlobe className='text-5xl text-gray-200 dark:text-slate-600 mx-auto mb-3' />
                    <p className='text-sm text-gray-500 dark:text-gray-400'>
                        {t("feed.empty") ??
                            "Belum ada postingan. Jadilah yang pertama!"}
                    </p>
                </div>
            ) : (
                <div className='space-y-4'>
                    {posts.map((post) => {
                        const author = post?.author ?? {};
                        const authorName =
                            author?.name ??
                            author?.username ??
                            author?.email ??
                            "User";
                        const likes = post?.likes ?? post?.like_count ?? 0;
                        const refLabel =
                            post?.ref_type === "ayah"
                                ? (t("feed.ref_ayah") ?? "Ayat Quran")
                                : post?.ref_type === "hadith"
                                  ? (t("feed.ref_hadith") ?? "Hadis")
                                  : "";

                        return (
                            <div
                                key={post.id}
                                className='p-5 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700'
                            >
                                <div className='flex items-center gap-3 mb-3'>
                                    <div className='w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center'>
                                        <span className='text-sm font-bold text-emerald-600 dark:text-emerald-400'>
                                            {authorName[0]?.toUpperCase() ??
                                                "U"}
                                        </span>
                                    </div>
                                    <div>
                                        <p className='text-sm font-semibold text-gray-900 dark:text-white'>
                                            {authorName}
                                        </p>
                                        <p className='text-xs text-gray-400'>
                                            {formatDate(post.created_at, lang)}
                                        </p>
                                    </div>
                                </div>
                                <p className='text-sm text-gray-700 dark:text-gray-300 mb-3 whitespace-pre-wrap'>
                                    {post.caption ?? post.body ?? ""}
                                </p>
                                {refLabel && (
                                    <div className='inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 rounded-lg mb-3'>
                                        <span className='text-xs font-medium text-amber-700 dark:text-amber-400'>
                                            {refLabel}
                                        </span>
                                        {post.ref_id && (
                                            <span className='text-xs text-amber-500 dark:text-amber-300'>
                                                #{post.ref_id}
                                            </span>
                                        )}
                                    </div>
                                )}
                                <div className='flex items-center gap-3 pt-3 border-t border-gray-100 dark:border-slate-700'>
                                    <button
                                        onClick={() => handleLike(post)}
                                        disabled={!token}
                                        className='flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 disabled:opacity-40'
                                    >
                                        {likes > 0 ? (
                                            <BsHeartFill className='text-red-500' />
                                        ) : (
                                            <BsHeart />
                                        )}
                                        {likes}
                                    </button>
                                    <button
                                        onClick={() =>
                                            setOpenComment(
                                                openComment === post.id
                                                    ? null
                                                    : post.id,
                                            )
                                        }
                                        className='flex items-center gap-1 text-xs text-gray-500 hover:text-emerald-600'
                                    >
                                        <BsChatDots />{" "}
                                        {t("feed.comment") ?? "Komentar"}
                                    </button>
                                    {token ? (
                                        <>
                                            <button
                                                onClick={() => handleHide(post)}
                                                className='flex items-center gap-1 text-xs text-gray-500 hover:text-amber-500'
                                                title={
                                                    t("feed.hide") ??
                                                    "Sembunyikan"
                                                }
                                            >
                                                <BsEyeSlash />
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleReport(post)
                                                }
                                                className='flex items-center gap-1 text-xs text-gray-500 hover:text-red-500'
                                                title={
                                                    t("feed.report") ??
                                                    "Laporkan"
                                                }
                                            >
                                                <BsFlag />
                                            </button>
                                            {author?.id === user?.id && (
                                                <button
                                                    onClick={() =>
                                                        handleDelete(post)
                                                    }
                                                    className='flex items-center gap-1 text-xs text-gray-500 hover:text-red-700'
                                                    title={
                                                        t("feed.delete") ??
                                                        "Hapus"
                                                    }
                                                >
                                                    <BsTrash />
                                                </button>
                                            )}
                                        </>
                                    ) : null}
                                </div>
                                {openComment === post.id && (
                                    <CommentSection
                                        postId={post.id}
                                        lang={lang}
                                        t={t}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {totalPages > 1 && (
                <div className='flex items-center justify-center gap-2 mt-6'>
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className='px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm disabled:opacity-40'
                    >
                        ← {t("common.prev") ?? "Prev"}
                    </button>
                    <span className='text-sm text-gray-500 dark:text-gray-400'>
                        {page} / {totalPages}
                    </span>
                    <button
                        onClick={() =>
                            setPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={page >= totalPages}
                        className='px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm disabled:opacity-40'
                    >
                        {t("common.next") ?? "Next"} →
                    </button>
                </div>
            )}
        </ContentWidth>
    );
}

export default function FeedPage() {
    return (
        <main className='min-h-screen flex flex-col bg-parchment-50 dark:bg-slate-900'>
            <div className='pt-navbar'>
                <FeedContent />
            </div>
        </main>
    );
}
