"use client";

import { Spinner3 } from "@/components/spinner/Spinner";
import { useLocale } from "@/context/Locale";
import { adminSirohApi, parseApiError } from "@/lib/api";
import { getLocalizedField } from "@/lib/translation";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { BsPencil, BsPlus, BsTrash, BsX } from "react-icons/bs";

const slugify = (str) =>
    str
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");

const AdminSirahPage = () => {
    const { t, lang } = useLocale();
    const [categories, setCategories] = useState([]);
    const [contents, setContents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionError, setActionError] = useState("");

    const [newCatTitle, setNewCatTitle] = useState("");
    const [newCatOrder, setNewCatOrder] = useState("");
    const [catLoading, setCatLoading] = useState(false);

    const [editingCat, setEditingCat] = useState(null);
    const [editCatTitle, setEditCatTitle] = useState("");
    const [editCatOrder, setEditCatOrder] = useState("");

    const load = useCallback(async () => {
        setIsLoading(true);
        try {
            const [catsRes, contentsRes] = await Promise.all([
                adminSirohApi.listCategories().then((r) => r.json()),
                adminSirohApi.listContents().then((r) => r.json()),
            ]);
            setCategories(catsRes?.items ?? catsRes ?? []);
            setContents(contentsRes?.items ?? contentsRes ?? []);
        } catch {
            setError(t("admin.sirah.load_error"));
        } finally {
            setIsLoading(false);
        }
    }, [t]);

    useEffect(() => {
        load();
    }, [load]);

    const handleCreateCategory = async (e) => {
        e.preventDefault();
        if (!newCatTitle.trim()) return;
        setCatLoading(true);
        setActionError("");
        try {
            const title = newCatTitle.trim();
            const res = await adminSirohApi.createCategory({
                title,
                slug: slugify(title),
                order: newCatOrder ? Number(newCatOrder) : 0,
            });
            if (!res.ok) throw new Error(await parseApiError(res, t("admin.error.save")));
            const data = await res.json();
            if (data?.id) {
                setCategories((prev) => [...prev, data]);
                setNewCatTitle("");
                setNewCatOrder("");
            }
        } catch (err) {
            setActionError(err.message || t("admin.error.save"));
        } finally {
            setCatLoading(false);
        }
    };

    const handleDeleteCategory = async (id) => {
        if (!confirm(t("admin.sirah.confirm_delete_category"))) return;
        const prev = categories;
        setCategories((c) => c.filter((x) => x.id !== id));
        setActionError("");
        try {
            const res = await adminSirohApi.deleteCategory(id);
            if (!res.ok) throw new Error(await parseApiError(res, t("admin.error.save")));
        } catch (err) {
            setCategories(prev);
            setActionError(err.message || t("admin.error.save"));
        }
    };

    const startEditCategory = (cat) => {
        setEditingCat(cat.id);
        setEditCatTitle(cat.title);
        setEditCatOrder(String(cat.order ?? 0));
    };

    const handleUpdateCategory = async (id) => {
        setActionError("");
        try {
            const title = editCatTitle.trim();
            const res = await adminSirohApi.updateCategory(id, {
                title,
                slug: slugify(title),
                order: Number(editCatOrder) || 0,
            });
            if (!res.ok) throw new Error(await parseApiError(res, t("admin.error.save")));
            const data = await res.json();
            if (data?.id) {
                setCategories((prev) =>
                    prev.map((c) => (c.id === id ? data : c)),
                );
            }
            setEditingCat(null);
        } catch (err) {
            setActionError(err.message || t("admin.error.save"));
        }
    };

    const handleDeleteContent = async (id) => {
        if (!confirm(t("admin.sirah.confirm_delete_content"))) return;
        const prev = contents;
        setContents((c) => c.filter((x) => x.id !== id));
        setActionError("");
        try {
            const res = await adminSirohApi.deleteContent(id);
            if (!res.ok) throw new Error(await parseApiError(res, t("admin.error.save")));
        } catch (err) {
            setContents(prev);
            setActionError(err.message || t("admin.error.save"));
        }
    };

    if (isLoading) return <Spinner3 />;

    return (
        <div className='p-8'>
            <div className='flex items-center justify-between mb-8'>
                <div>
                    <h1 className='text-2xl font-bold text-gray-900 dark:text-gray-100 dark:text-white'>
                        {t("admin.nav.sirah")}
                    </h1>
                    <p className='text-sm text-gray-500 dark:text-gray-300 dark:text-gray-400 mt-1'>
                        {categories.length} {t("admin.sirah.categories_unit")} ·{" "}
                        {contents.length} {t("admin.sirah.contents_unit")}
                    </p>
                </div>
                <Link
                    href='/admin/siroh/new'
                    className='flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium transition-colors'
                >
                    <BsPlus className='text-lg' />
                    {t("admin.sirah.new_content")}
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

            <div className='grid lg:grid-cols-2 gap-8'>
                {/* Categories */}
                <div>
                    <h2 className='text-base font-bold text-gray-900 dark:text-gray-100 dark:text-white mb-4'>
                        {t("admin.field.category")}
                    </h2>

                    <form
                        onSubmit={handleCreateCategory}
                        className='flex gap-2 mb-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-3'
                    >
                        <input
                            value={newCatTitle}
                            onChange={(e) => setNewCatTitle(e.target.value)}
                            placeholder={t(
                                "admin.sirah.new_category_placeholder",
                            )}
                            className='flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500'
                        />
                        <input
                            value={newCatOrder}
                            onChange={(e) => setNewCatOrder(e.target.value)}
                            placeholder={t("admin.field.order")}
                            type='number'
                            className='w-20 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500'
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
                        {categories.length === 0 && (
                            <p className='text-sm text-gray-400'>
                                {t("admin.blog.empty_categories")}
                            </p>
                        )}
                        {categories.map((cat) => {
                            const title = getLocalizedField(cat, "title", lang);
                            return (
                                <div
                                    key={cat.id}
                                    className='bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 px-4 py-3'
                                >
                                    {editingCat === cat.id ? (
                                        <div className='flex gap-2'>
                                            <input
                                                value={editCatTitle}
                                                onChange={(e) =>
                                                    setEditCatTitle(
                                                        e.target.value,
                                                    )
                                                }
                                                className='flex-1 px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 dark:text-white focus:outline-none'
                                            />
                                            <input
                                                value={editCatOrder}
                                                onChange={(e) =>
                                                    setEditCatOrder(
                                                        e.target.value,
                                                    )
                                                }
                                                type='number'
                                                className='w-16 px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 dark:text-white focus:outline-none'
                                            />
                                            <button
                                                onClick={() =>
                                                    handleUpdateCategory(cat.id)
                                                }
                                                aria-label={`${t("common.save")} ${title}`}
                                                title={`${t("common.save")} ${title}`}
                                                className='px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs'
                                            >
                                                {t("common.save")}
                                            </button>
                                            <button
                                                onClick={() =>
                                                    setEditingCat(null)
                                                }
                                                aria-label={t("common.cancel")}
                                                title={t("common.cancel")}
                                                className='px-2 py-1 text-gray-400 hover:text-gray-600 hover:dark:text-gray-300'
                                            >
                                                <BsX />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className='flex items-center justify-between'>
                                            <div>
                                                <p className='text-sm font-medium text-gray-900 dark:text-gray-100 dark:text-white'>
                                                    {title}
                                                </p>
                                                <p className='text-xs text-gray-400'>
                                                    {t("admin.field.order")}:{" "}
                                                    {cat.order ?? 0} ·{" "}
                                                    {cat.slug}
                                                </p>
                                            </div>
                                            <div className='flex gap-1'>
                                                <button
                                                    onClick={() =>
                                                        startEditCategory(cat)
                                                    }
                                                    aria-label={`${t("common.edit")} ${title}`}
                                                    title={`${t("common.edit")} ${title}`}
                                                    className='p-1.5 rounded text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-700 transition-colors'
                                                >
                                                    <BsPencil className='text-xs' />
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleDeleteCategory(
                                                            cat.id,
                                                        )
                                                    }
                                                    aria-label={`${t("common.delete")} ${title}`}
                                                    title={`${t("common.delete")} ${title}`}
                                                    className='p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors'
                                                >
                                                    <BsTrash className='text-xs' />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Contents */}
                <div>
                    <h2 className='text-base font-bold text-gray-900 dark:text-gray-100 dark:text-white mb-4'>
                        {t("admin.field.content")}
                    </h2>
                    <div className='space-y-2'>
                        {contents.length === 0 && (
                            <div className='p-6 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 text-center'>
                                <p className='text-sm text-gray-400 mb-3'>
                                    {t("admin.sirah.empty_content")}
                                </p>
                                <Link
                                    href='/admin/siroh/new'
                                    className='inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-medium transition-colors'
                                >
                                    <BsPlus className='text-base' />
                                    {t("admin.sirah.add_content") ?? "Tambah Konten"}
                                </Link>
                            </div>
                        )}
                        {contents.map((item) => {
                            const title = getLocalizedField(
                                item,
                                "title",
                                lang,
                            );
                            const category = categories.find(
                                (c) => c.id === item.category_id,
                            );
                            const categoryTitle = category
                                ? getLocalizedField(category, "title", lang)
                                : `${t("admin.field.category")} #${item.category_id}`;

                            return (
                                <div
                                    key={item.id}
                                    className='flex items-center justify-between bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 px-4 py-3'
                                >
                                    <div className='min-w-0 flex-1'>
                                        <p className='text-sm font-medium text-gray-900 dark:text-gray-100 dark:text-white truncate'>
                                            {title}
                                        </p>
                                        <p className='text-xs text-gray-400'>
                                            {categoryTitle} ·{" "}
                                            {t("admin.field.order")}{" "}
                                            {item.order ?? 0}
                                        </p>
                                    </div>
                                    <div className='flex gap-1 ml-3 shrink-0'>
                                        <Link
                                            href={`/admin/siroh/${item.id}/edit`}
                                            aria-label={`${t("common.edit")} ${title}`}
                                            title={`${t("common.edit")} ${title}`}
                                            className='p-1.5 rounded text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-700 transition-colors'
                                        >
                                            <BsPencil className='text-xs' />
                                        </Link>
                                        <button
                                            onClick={() =>
                                                handleDeleteContent(item.id)
                                            }
                                            aria-label={`${t("common.delete")} ${title}`}
                                            title={`${t("common.delete")} ${title}`}
                                            className='p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors'
                                        >
                                            <BsTrash className='text-xs' />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminSirahPage;
