"use client";

import { adminBlogApi, blogApi } from "@/lib/api";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { BsPencil, BsPlus, BsTrash, BsX } from "react-icons/bs";
import { Spinner3 } from "@/components/spinner/Spinner";
import { useLocale } from "@/context/Locale";
import { getLocalizedField } from "@/lib/translation";

const STATUS_LABELS = {
    draft: {
        labelKey: "admin.status.draft",
        cls: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
    },
    published: {
        labelKey: "admin.status.published",
        cls: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
    },
    archived: {
        labelKey: "admin.status.archived",
        cls: "bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400",
    },
};

const AdminBlogPage = () => {
    const { t, lang } = useLocale();
    const [posts, setPosts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [tags, setTags] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionError, setActionError] = useState("");

    const [newCatName, setNewCatName] = useState("");
    const [newTagName, setNewTagName] = useState("");
    const [catLoading, setCatLoading] = useState(false);
    const [tagLoading, setTagLoading] = useState(false);

    const load = useCallback(async () => {
        setIsLoading(true);
        try {
            const [postsRes, catsRes, tagsRes] = await Promise.all([
                adminBlogApi.listAll().then((r) => r.json()),
                blogApi.listCategories().then((r) => r.json()),
                blogApi.listTags().then((r) => r.json()),
            ]);
            setPosts(postsRes?.items ?? postsRes ?? []);
            setCategories(catsRes?.items ?? catsRes ?? []);
            setTags(tagsRes?.items ?? tagsRes ?? []);
        } catch {
            setError(t("admin.error.load_data"));
        } finally {
            setIsLoading(false);
        }
    }, [t]);

    useEffect(() => {
        load();
    }, [load]);

    const handleDeletePost = async (id) => {
        if (!confirm(t("admin.blog.confirm_delete_article"))) return;
        const prev = posts;
        setPosts((p) => p.filter((x) => x.id !== id));
        setActionError("");
        try {
            const res = await adminBlogApi.delete(id);
            if (!res.ok) throw new Error(t("admin.error.save"));
        } catch (err) {
            setPosts(prev);
            setActionError(err.message || t("admin.error.save"));
        }
    };

    const handleCreateCategory = async (e) => {
        e.preventDefault();
        if (!newCatName.trim()) return;
        setCatLoading(true);
        setActionError("");
        try {
            const res = await adminBlogApi.createCategory({
                name: newCatName.trim(),
            });
            if (!res.ok) throw new Error(t("admin.error.save"));
            const data = await res.json();
            if (data?.id) {
                setCategories((prev) => [...prev, data]);
                setNewCatName("");
            }
        } catch (err) {
            setActionError(err.message || t("admin.error.save"));
        } finally {
            setCatLoading(false);
        }
    };

    const handleDeleteCategory = async (id) => {
        if (!confirm(t("admin.blog.confirm_delete_category"))) return;
        const prev = categories;
        setCategories((c) => c.filter((x) => x.id !== id));
        setActionError("");
        try {
            const res = await adminBlogApi.deleteCategory(id);
            if (!res.ok) throw new Error(t("admin.error.save"));
        } catch (err) {
            setCategories(prev);
            setActionError(err.message || t("admin.error.save"));
        }
    };

    const handleCreateTag = async (e) => {
        e.preventDefault();
        if (!newTagName.trim()) return;
        setTagLoading(true);
        setActionError("");
        try {
            const res = await adminBlogApi.createTag({
                name: newTagName.trim(),
            });
            if (!res.ok) throw new Error(t("admin.error.save"));
            const data = await res.json();
            if (data?.id) {
                setTags((prev) => [...prev, data]);
                setNewTagName("");
            }
        } catch (err) {
            setActionError(err.message || t("admin.error.save"));
        } finally {
            setTagLoading(false);
        }
    };

    const handleDeleteTag = async (id) => {
        if (!confirm("Hapus tag ini?")) return;
        const prev = tags;
        setTags((t) => t.filter((x) => x.id !== id));
        setActionError("");
        try {
            const res = await adminBlogApi.deleteTag(id);
            if (!res.ok) throw new Error(t("admin.error.save"));
        } catch (err) {
            setTags(prev);
            setActionError(err.message || t("admin.error.save"));
        }
    };

    if (isLoading) return <Spinner3 />;

    return (
        <div className='p-8'>
            <div className='flex items-center justify-between mb-8'>
                <div>
                    <h1 className='text-2xl font-bold text-gray-900 dark:text-white'>
                        {t("admin.nav.blog")}
                    </h1>
                    <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
                        {posts.length} {t("admin.blog.articles_unit")}
                    </p>
                </div>
                <Link
                    href='/admin/blog/new'
                    className='flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium transition-colors'
                >
                    <BsPlus className='text-lg' />
                    {t("admin.blog.new_article")}
                </Link>
            </div>

            {error && (
                <p className='text-sm text-red-500 dark:text-red-400 mb-4'>
                    {error}
                </p>
            )}
            {actionError && (
                <p className='text-sm text-red-500 dark:text-red-400 mb-4'>
                    {actionError}
                </p>
            )}

            {/* Post list */}
            <div className='bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden mb-8'>
                {posts.length === 0 ? (
                    <div className='p-8 text-center text-gray-400 text-sm'>
                        {t("admin.blog.empty_articles")}
                    </div>
                ) : (
                    <div className='overflow-x-auto'>
                        <table className='w-full text-sm min-w-[640px]'>
                            <thead className='bg-gray-50 dark:bg-slate-900 text-left'>
                                <tr>
                                    <th className='px-5 py-3 font-semibold text-gray-600 dark:text-gray-300'>
                                        {t("admin.field.title")}
                                    </th>
                                    <th className='px-5 py-3 font-semibold text-gray-600 dark:text-gray-300 hidden md:table-cell'>
                                        {t("admin.field.category")}
                                    </th>
                                    <th className='px-5 py-3 font-semibold text-gray-600 dark:text-gray-300'>
                                        {t("common.status")}
                                    </th>
                                    <th className='px-5 py-3 font-semibold text-gray-600 dark:text-gray-300 hidden sm:table-cell'>
                                        {t("common.date")}
                                    </th>
                                    <th className='px-5 py-3'></th>
                                </tr>
                            </thead>
                            <tbody className='divide-y divide-gray-100 dark:divide-slate-700'>
                                {posts.map((post) => {
                                    const badge =
                                        STATUS_LABELS[post.status] ??
                                        STATUS_LABELS.draft;
                                    const title = getLocalizedField(
                                        post,
                                        "title",
                                        lang,
                                    );
                                    return (
                                        <tr
                                            key={post.id}
                                            className='hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors'
                                        >
                                            <td className='px-5 py-3'>
                                                <p className='font-medium text-gray-900 dark:text-white line-clamp-1'>
                                                    {title}
                                                </p>
                                                {getLocalizedField(
                                                    post,
                                                    "excerpt",
                                                    lang,
                                                ) && (
                                                    <p className='text-xs text-gray-400 line-clamp-1 mt-0.5'>
                                                        {getLocalizedField(
                                                            post,
                                                            "excerpt",
                                                            lang,
                                                        )}
                                                    </p>
                                                )}
                                            </td>
                                            <td className='px-5 py-3 text-gray-500 dark:text-gray-400 hidden md:table-cell'>
                                                {post.category?.name ?? "—"}
                                            </td>
                                            <td className='px-5 py-3'>
                                                <span
                                                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.cls}`}
                                                >
                                                    {t(badge.labelKey)}
                                                </span>
                                            </td>
                                            <td className='px-5 py-3 text-gray-400 text-xs hidden sm:table-cell'>
                                                {post.published_at
                                                    ? new Date(
                                                          post.published_at,
                                                      ).toLocaleDateString(
                                                          lang === "EN"
                                                              ? "en-US"
                                                              : "id-ID",
                                                      )
                                                    : new Date(
                                                          post.created_at,
                                                      ).toLocaleDateString(
                                                          lang === "EN"
                                                              ? "en-US"
                                                              : "id-ID",
                                                      )}
                                            </td>
                                            <td className='px-5 py-3'>
                                                <div className='flex items-center gap-1 justify-end'>
                                                    <Link
                                                        href={`/admin/blog/${post.id}/edit`}
                                                        aria-label={`${t("common.edit")} ${title}`}
                                                        title={`${t("common.edit")} ${title}`}
                                                        className='p-2 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-700 transition-colors'
                                                    >
                                                        <BsPencil />
                                                    </Link>
                                                    <button
                                                        onClick={() =>
                                                            handleDeletePost(
                                                                post.id,
                                                            )
                                                        }
                                                        aria-label={`${t("common.delete")} ${title}`}
                                                        title={`${t("common.delete")} ${title}`}
                                                        className='p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors'
                                                    >
                                                        <BsTrash />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Categories & Tags */}
            <div className='grid md:grid-cols-2 gap-6'>
                {/* Categories */}
                <div className='bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5'>
                    <h2 className='text-base font-bold text-gray-900 dark:text-white mb-4'>
                        {t("admin.field.category")}
                    </h2>
                    <form
                        onSubmit={handleCreateCategory}
                        className='flex gap-2 mb-4'
                    >
                        <input
                            value={newCatName}
                            onChange={(e) => setNewCatName(e.target.value)}
                            placeholder={t(
                                "admin.blog.new_category_placeholder",
                            )}
                            className='flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500'
                        />
                        <button
                            type='submit'
                            disabled={catLoading}
                            aria-label={`${t("admin.crud.add")} ${t("admin.field.category")}`}
                            title={`${t("admin.crud.add")} ${t("admin.field.category")}`}
                            className='px-3 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-60 text-white rounded-lg text-sm transition-colors'
                        >
                            <BsPlus className='text-lg' />
                        </button>
                    </form>
                    <div className='space-y-2'>
                        {categories.map((cat) => (
                            <div
                                key={cat.id}
                                className='flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 dark:bg-slate-700'
                            >
                                <span className='text-sm text-gray-700 dark:text-gray-200'>
                                    {cat.name}
                                </span>
                                <button
                                    onClick={() => handleDeleteCategory(cat.id)}
                                    aria-label={`${t("common.delete")} ${cat.name}`}
                                    title={`${t("common.delete")} ${cat.name}`}
                                    className='text-gray-400 hover:text-red-500 transition-colors p-1'
                                >
                                    <BsX />
                                </button>
                            </div>
                        ))}
                        {categories.length === 0 && (
                            <p className='text-xs text-gray-400'>
                                {t("admin.blog.empty_categories")}
                            </p>
                        )}
                    </div>
                </div>

                {/* Tags */}
                <div className='bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5'>
                    <h2 className='text-base font-bold text-gray-900 dark:text-white mb-4'>
                        {t("admin.field.tag")}
                    </h2>
                    <form
                        onSubmit={handleCreateTag}
                        className='flex gap-2 mb-4'
                    >
                        <input
                            value={newTagName}
                            onChange={(e) => setNewTagName(e.target.value)}
                            placeholder={t("admin.blog.new_tag_placeholder")}
                            className='flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500'
                        />
                        <button
                            type='submit'
                            disabled={tagLoading}
                            aria-label={`${t("admin.crud.add")} ${t("admin.field.tag")}`}
                            title={`${t("admin.crud.add")} ${t("admin.field.tag")}`}
                            className='px-3 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-60 text-white rounded-lg text-sm transition-colors'
                        >
                            <BsPlus className='text-lg' />
                        </button>
                    </form>
                    <div className='flex flex-wrap gap-2'>
                        {tags.map((tag) => (
                            <span
                                key={tag.id}
                                className='flex items-center gap-1.5 px-3 py-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded-full text-xs'
                            >
                                #{tag.name}
                                <button
                                    onClick={() => handleDeleteTag(tag.id)}
                                    aria-label={`${t("common.delete")} ${tag.name}`}
                                    title={`${t("common.delete")} ${tag.name}`}
                                    className='text-gray-400 hover:text-red-500 transition-colors'
                                >
                                    <BsX />
                                </button>
                            </span>
                        ))}
                        {tags.length === 0 && (
                            <p className='text-xs text-gray-400'>
                                {t("admin.blog.empty_tags")}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminBlogPage;
