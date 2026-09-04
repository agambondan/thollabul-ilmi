"use client";

import { adminBlogApi, blogApi } from "@/lib/api";
import Link from "next/link";
import { useCallback, useEffect, useState, useMemo } from "react";
import {
    BsPencil,
    BsPlus,
    BsTrash,
    BsX,
    BsSearch,
    BsFilter,
    BsEye,
} from "react-icons/bs";
import { Spinner3 } from "@/components/spinner/Spinner";
import { useLocale } from "@/context/Locale";
import { getLocalizedField } from "@/lib/translation";

const STATUS_LABELS = {
    draft: {
        labelKey: "admin.status.draft",
        cls: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/60",
    },
    published: {
        labelKey: "admin.status.published",
        cls: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/60",
    },
    archived: {
        labelKey: "admin.status.archived",
        cls: "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-slate-700",
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

    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("all");

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

    const filteredPosts = useMemo(() => {
        return posts.filter((post) => {
            const matchSearch =
                !searchQuery ||
                (post.title &&
                    post.title
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase())) ||
                (post.slug &&
                    post.slug
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()));

            const matchStatus =
                statusFilter === "all" || post.status === statusFilter;

            const matchCategory =
                categoryFilter === "all" ||
                String(post.category_id ?? post.category?.id) ===
                    String(categoryFilter);

            return matchSearch && matchStatus && matchCategory;
        });
    }, [posts, searchQuery, statusFilter, categoryFilter]);

    if (isLoading) return <Spinner3 />;

    return (
        <div className='p-6 md:p-8 max-w-7xl mx-auto'>
            {/* Header */}
            <div className='flex flex-wrap items-center justify-between gap-4 mb-8'>
                <div>
                    <h1 className='text-2xl font-bold text-gray-900 dark:text-gray-100 dark:text-white'>
                        {t("admin.nav.blog")}
                    </h1>
                    <p className='text-sm text-gray-500 dark:text-gray-300 dark:text-gray-400 mt-1'>
                        {posts.length} {t("admin.blog.articles_unit")}
                    </p>
                </div>
                <Link
                    href='/admin/blog/new'
                    className='flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold shadow-md shadow-emerald-700/20 transition-all'
                >
                    <BsPlus className='text-xl' />
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

            {/* Filter Bar */}
            <div className='flex flex-wrap gap-3 mb-6'>
                <div className='flex-1 min-w-[220px] relative'>
                    <BsSearch className='absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs' />
                    <input
                        type='text'
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder='Cari judul atau slug artikel...'
                        className='w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500'
                    />
                </div>

                <div className='flex items-center gap-2'>
                    <div className='flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-gray-500 dark:text-gray-300'>
                        <BsFilter />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className='bg-transparent text-gray-900 dark:text-gray-100 dark:text-white focus:outline-none'
                        >
                            <option value='all'>Semua Status</option>
                            <option value='published'>Published</option>
                            <option value='draft'>Draft</option>
                            <option value='archived'>Archived</option>
                        </select>
                    </div>

                    <div className='flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-gray-500 dark:text-gray-300'>
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className='bg-transparent text-gray-900 dark:text-gray-100 dark:text-white focus:outline-none'
                        >
                            <option value='all'>Semua Kategori</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Post list */}
            <div className='bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden mb-10'>
                {filteredPosts.length === 0 ? (
                    <div className='p-12 text-center text-gray-400 text-sm'>
                        {posts.length === 0
                            ? t("admin.blog.empty_articles")
                            : "Tidak ada artikel yang sesuai filter."}
                    </div>
                ) : (
                    <div className='overflow-x-auto'>
                        <table className='w-full text-sm min-w-[640px]'>
                            <thead className='bg-gray-50/80 dark:bg-slate-900/60 text-left border-b border-gray-100 dark:border-slate-700'>
                                <tr>
                                    <th className='px-6 py-3.5 text-xs font-bold text-gray-500 dark:text-gray-300 dark:text-gray-400 uppercase tracking-wider'>
                                        {t("admin.field.title")}
                                    </th>
                                    <th className='px-6 py-3.5 text-xs font-bold text-gray-500 dark:text-gray-300 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell'>
                                        {t("admin.field.category")}
                                    </th>
                                    <th className='px-6 py-3.5 text-xs font-bold text-gray-500 dark:text-gray-300 dark:text-gray-400 uppercase tracking-wider'>
                                        {t("common.status")}
                                    </th>
                                    <th className='px-6 py-3.5 text-xs font-bold text-gray-500 dark:text-gray-300 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell'>
                                        {t("common.date")}
                                    </th>
                                    <th className='px-6 py-3.5 text-xs font-bold text-gray-500 dark:text-gray-300 dark:text-gray-400 uppercase tracking-wider text-right'>
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className='divide-y divide-gray-100 dark:divide-slate-700'>
                                {filteredPosts.map((post) => {
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
                                            className='hover:bg-gray-50/50 dark:hover:bg-slate-750 transition-colors'
                                        >
                                            <td className='px-6 py-4'>
                                                <p className='font-semibold text-gray-900 dark:text-gray-100 dark:text-white line-clamp-1'>
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
                                                <p className='text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 truncate'>
                                                    /blog/{post.slug}
                                                </p>
                                            </td>
                                            <td className='px-6 py-4 text-gray-500 dark:text-gray-300 dark:text-gray-400 text-xs hidden md:table-cell'>
                                                {post.category?.name ? (
                                                    <span className='px-2.5 py-1 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 dark:text-gray-300'>
                                                        {post.category.name}
                                                    </span>
                                                ) : (
                                                    "—"
                                                )}
                                            </td>
                                            <td className='px-6 py-4'>
                                                <span
                                                    className={`px-2.5 py-1 rounded-full text-xs font-semibold ${badge.cls}`}
                                                >
                                                    {t(badge.labelKey)}
                                                </span>
                                            </td>
                                            <td className='px-6 py-4 text-gray-400 text-xs hidden sm:table-cell'>
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
                                            <td className='px-6 py-4'>
                                                <div className='flex items-center gap-1.5 justify-end'>
                                                    <Link
                                                        href={`/blog/${post.slug}`}
                                                        target='_blank'
                                                        aria-label={`Lihat ${title}`}
                                                        title={`Lihat ${title}`}
                                                        className='p-2 rounded-xl text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-700 transition-colors'
                                                    >
                                                        <BsEye />
                                                    </Link>
                                                    <Link
                                                        href={`/admin/blog/${post.id}/edit`}
                                                        aria-label={`${t("common.edit")} ${title}`}
                                                        title={`${t("common.edit")} ${title}`}
                                                        className='p-2 rounded-xl text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-700 transition-colors'
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
                                                        className='p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors'
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

            {/* Categories & Tags Management */}
            <div className='grid md:grid-cols-2 gap-6'>
                {/* Categories */}
                <div className='bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 p-6 shadow-sm'>
                    <h2 className='text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-gray-100 dark:text-white mb-4'>
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
                            className='flex-1 px-3.5 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500'
                        />
                        <button
                            type='submit'
                            disabled={catLoading}
                            aria-label={`${t("admin.crud.add")} ${t("admin.field.category")}`}
                            title={`${t("admin.crud.add")} ${t("admin.field.category")}`}
                            className='px-4 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-60 text-white rounded-xl text-xs font-semibold transition-colors'
                        >
                            <BsPlus className='text-base' />
                        </button>
                    </form>
                    <div className='space-y-2 max-h-60 overflow-y-auto pr-1'>
                        {categories.map((cat) => (
                            <div
                                key={cat.id}
                                className='flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-700/50'
                            >
                                <span className='text-xs font-medium text-gray-700 dark:text-gray-200'>
                                    {cat.name}
                                </span>
                                <button
                                    onClick={() => handleDeleteCategory(cat.id)}
                                    aria-label={`${t("common.delete")} ${cat.name}`}
                                    title={`${t("common.delete")} ${cat.name}`}
                                    className='text-gray-400 hover:text-red-500 transition-colors p-1'
                                >
                                    <BsX className='text-base' />
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
                <div className='bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 p-6 shadow-sm'>
                    <h2 className='text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-gray-100 dark:text-white mb-4'>
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
                            className='flex-1 px-3.5 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500'
                        />
                        <button
                            type='submit'
                            disabled={tagLoading}
                            aria-label={`${t("admin.crud.add")} ${t("admin.field.tag")}`}
                            title={`${t("admin.crud.add")} ${t("admin.field.tag")}`}
                            className='px-4 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-60 text-white rounded-xl text-xs font-semibold transition-colors'
                        >
                            <BsPlus className='text-base' />
                        </button>
                    </form>
                    <div className='flex flex-wrap gap-2 max-h-60 overflow-y-auto pr-1'>
                        {tags.map((tag) => (
                            <span
                                key={tag.id}
                                className='flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-slate-700/60 text-gray-600 dark:text-gray-300 rounded-full text-xs font-medium border border-gray-200 dark:border-gray-700/60 dark:border-slate-600'
                            >
                                #{tag.name}
                                <button
                                    onClick={() => handleDeleteTag(tag.id)}
                                    aria-label={`${t("common.delete")} ${tag.name}`}
                                    title={`${t("common.delete")} ${tag.name}`}
                                    className='text-gray-400 hover:text-red-500 transition-colors'
                                >
                                    <BsX className='text-sm' />
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
