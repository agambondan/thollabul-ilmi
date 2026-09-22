"use client";

import {
    applySort,
    PanelFilterCheckboxGroup,
    PanelPagination,
    toggleSort,
} from "@/components/panel/DataPanel";
import { Spinner3 } from "@/components/spinner/Spinner";
import { useLocale } from "@/context/Locale";
import { adminSirohApi, parseApiError } from "@/lib/api";
import { getLocalizedField } from "@/lib/translation";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { BsPencil, BsPlus, BsTrash, BsX } from "react-icons/bs";
import ModalShell from "@/components/ModalShell";
import { useLayoutMode } from "@/lib/useLayoutMode";

const slugify = (str) =>
    str
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");

const AdminSirahPage = () => {
    const { t, lang } = useLocale();
    const { isWide } = useLayoutMode();
    const [categories, setCategories] = useState([]);
    const [contents, setContents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionError, setActionError] = useState("");

    const [catTitle, setCatTitle] = useState("");
    const [catOrder, setCatOrder] = useState("");
    const [catLoading, setCatLoading] = useState(false);
    const [editingCat, setEditingCat] = useState(null);
    const [categoryModalOpen, setCategoryModalOpen] = useState(false);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [categoryFilters, setCategoryFilters] = useState([]);
    const [sort, setSort] = useState(null);

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

    const openCreateCategory = () => {
        setEditingCat(null);
        setCatTitle("");
        setCatOrder("");
        setCategoryModalOpen(true);
    };

    const handleCreateCategory = async (e) => {
        e.preventDefault();
        if (!catTitle.trim()) return;
        setCatLoading(true);
        setActionError("");
        try {
            const title = catTitle.trim();
            const res = await adminSirohApi.createCategory({
                title,
                slug: slugify(title),
                order: catOrder ? Number(catOrder) : 0,
            });
            if (!res.ok)
                throw new Error(
                    await parseApiError(res, t("admin.error.save")),
                );
            const data = await res.json();
            if (data?.id) {
                setCategories((prev) => [...prev, data]);
                setCatTitle("");
                setCatOrder("");
                setCategoryModalOpen(false);
            }
        } catch (err) {
            setActionError(err.message || t("admin.error.save"));
        } finally {
            setCatLoading(false);
        }
    };

    const openEditCategory = (cat) => {
        setEditingCat(cat.id);
        setCatTitle(cat.title);
        setCatOrder(String(cat.order ?? 0));
        setCategoryModalOpen(true);
    };

    const handleUpdateCategory = async (e) => {
        e.preventDefault();
        if (!editingCat || !catTitle.trim()) return;
        setActionError("");
        try {
            const title = catTitle.trim();
            const res = await adminSirohApi.updateCategory(editingCat, {
                title,
                slug: slugify(title),
                order: Number(catOrder) || 0,
            });
            if (!res.ok)
                throw new Error(
                    await parseApiError(res, t("admin.error.save")),
                );
            const data = await res.json();
            if (data?.id) {
                setCategories((prev) =>
                    prev.map((c) => (c.id === editingCat ? data : c)),
                );
                setEditingCat(null);
                setCategoryModalOpen(false);
            }
        } catch (err) {
            setActionError(err.message || t("admin.error.save"));
        }
    };

    const handleDeleteCategory = async (id) => {
        if (!confirm(t("admin.sirah.confirm_delete_category"))) return;
        const prev = categories;
        setCategories((c) => c.filter((x) => x.id !== id));
        setActionError("");
        try {
            const res = await adminSirohApi.deleteCategory(id);
            if (!res.ok)
                throw new Error(
                    await parseApiError(res, t("admin.error.save")),
                );
        } catch (err) {
            setCategories(prev);
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
            if (!res.ok)
                throw new Error(
                    await parseApiError(res, t("admin.error.save")),
                );
        } catch (err) {
            setContents(prev);
            setActionError(err.message || t("admin.error.save"));
        }
    };

    if (isLoading) return <Spinner3 />;

    const filteredContents = contents.filter(
        (item) =>
            categoryFilters.length === 0 ||
            categoryFilters.includes(String(item.category_id)),
    );

    const sortedContents = applySort(filteredContents, sort, {
        title: (a, b) =>
            (getLocalizedField(a, "title", lang) ?? "").localeCompare(
                getLocalizedField(b, "title", lang) ?? "",
            ),
        order: (a, b) => (a.order ?? 0) - (b.order ?? 0),
    });

    const pageCount = Math.max(1, Math.ceil(sortedContents.length / pageSize));
    const currentPage = Math.min(page, pageCount);
    const visibleContents = sortedContents.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize,
    );

    return (
        <div className='p-6'>
            <div className='flex items-center justify-between mb-8'>
                <div>
                    <h1 className='text-2xl font-bold text-gray-900 dark:text-white'>
                        {t("admin.nav.sirah")}
                    </h1>
                    <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
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
                    <h2 className='text-base font-bold text-gray-900 dark:text-white mb-4'>
                        {t("admin.field.category")}
                    </h2>

                    <button
                        type='button'
                        onClick={openCreateCategory}
                        className='flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium transition-colors mb-4'
                    >
                        <BsPlus className='text-lg' />
                        {t("admin.sirah.add_category")}
                    </button>

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
                                    <div className='flex items-center justify-between'>
                                            <div>
                                                <p className='text-sm font-medium text-gray-900 dark:text-white'>
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
                                                        openEditCategory(cat)
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
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Contents */}
                <div>
                    <h2 className='text-base font-bold text-gray-900 dark:text-white mb-4'>
                        {t("admin.field.content")}
                    </h2>
                    <div className='mb-3 flex flex-wrap items-center justify-between gap-3'>
                        <PanelFilterCheckboxGroup
                            label={t("admin.field.category")}
                            selected={categoryFilters}
                            onChange={(values) => {
                                setCategoryFilters(values);
                                setPage(1);
                            }}
                            options={categories.map((cat) => ({
                                value: String(cat.id),
                                label: getLocalizedField(cat, "title", lang),
                            }))}
                        />
                        <div className='flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400'>
                            <span>{t("admin.crud.sort_by", "Urutkan")}:</span>
                            {[
                                { key: "title", label: t("admin.field.title") },
                                { key: "order", label: t("admin.field.order") },
                            ].map(({ key, label }) => {
                                const isActive = sort?.key === key;
                                return (
                                    <button
                                        key={key}
                                        type='button'
                                        onClick={() =>
                                            setSort((s) => toggleSort(s, key))
                                        }
                                        className={`inline-flex items-center gap-1 hover:text-gray-900 dark:hover:text-white ${
                                            isActive
                                                ? "text-gray-900 dark:text-white"
                                                : ""
                                        }`}
                                    >
                                        {label}
                                        <span className='text-[10px] leading-none opacity-70'>
                                            {isActive
                                                ? sort.dir === "asc"
                                                    ? "▲"
                                                    : "▼"
                                                : "⇅"}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <PanelPagination
                        page={currentPage}
                        pageCount={pageCount}
                        total={sortedContents.length}
                        onChange={setPage}
                        pageSize={pageSize}
                        onPageSizeChange={(newSize) => {
                            setPageSize(newSize);
                            setPage(1);
                        }}
                        pageSizeOptions={[10, 20, 50]}
                        labels={{
                            prev: t("common.prev"),
                            next: t("common.next"),
                        }}
                    />
                    <div
                        className='space-y-2'
                        data-testid='sirah-contents-list'
                    >
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
                                    {t("admin.sirah.add_content") ??
                                        "Tambah Konten"}
                                </Link>
                            </div>
                        )}
                        {contents.length > 0 && sortedContents.length === 0 && (
                            <div className='p-6 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 text-center'>
                                <p className='text-sm text-gray-400'>
                                    {t("admin.crud.no_data")}
                                </p>
                            </div>
                        )}
                        {visibleContents.map((item) => {
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
                                        <p className='text-sm font-medium text-gray-900 dark:text-white truncate'>
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

            {categoryModalOpen && (
                <ModalShell
                    isOpen={categoryModalOpen}
                    onClose={() => setCategoryModalOpen(false)}
                    panelClassName={`flex flex-col max-h-[90vh] overflow-hidden ${
                        isWide ? "max-w-4xl" : "max-w-2xl"
                    }`}
                    label={editingCat ? t("common.edit") : t("admin.crud.add")}
                >
                    <form
                        onSubmit={editingCat ? handleUpdateCategory : handleCreateCategory}
                        className='flex flex-col max-h-[90vh] overflow-hidden'
                    >
                        <div className='p-6 border-b border-gray-100 dark:border-slate-700 shrink-0'>
                            <h2 className='text-lg font-semibold text-gray-900 dark:text-white'>
                                {editingCat
                                    ? t("admin.crud.edit")
                                    : t("admin.crud.add")}
                                {" "}
                                {t("admin.field.category")}
                            </h2>
                        </div>
                        <div className='p-6 space-y-6 overflow-y-auto flex-1'>
                            <div>
                                <label
                                    htmlFor='cat-title'
                                    className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
                                >
                                    {t("admin.field.title")} *
                                </label>
                                <input
                                    id='cat-title'
                                    value={catTitle}
                                    onChange={(e) => setCatTitle(e.target.value)}
                                    placeholder={t(
                                        "admin.sirah.new_category_placeholder",
                                    )}
                                    className='w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500'
                                    required
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor='cat-order'
                                    className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
                                >
                                    {t("admin.field.order")}
                                </label>
                                <input
                                    id='cat-order'
                                    value={catOrder}
                                    onChange={(e) => setCatOrder(e.target.value)}
                                    type='number'
                                    className='w-24 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500'
                                />
                            </div>
                        </div>
                        <div className='flex gap-3 p-6 border-t border-gray-100 dark:border-slate-700 shrink-0 justify-end'>
                            <button
                                type='button'
                                onClick={() => setCategoryModalOpen(false)}
                                className='px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors'
                            >
                                {t("common.cancel")}
                            </button>
                            <button
                                type='submit'
                                disabled={catLoading}
                                className='px-4 py-2 text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 rounded-lg transition-colors'
                            >
                                {catLoading
                                    ? t("common.saving")
                                    : t("common.save")}
                            </button>
                        </div>
                    </form>
                </ModalShell>
            )}
        </div>
    );
};

export default AdminSirahPage;
