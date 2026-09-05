"use client";

import {
    PanelEmpty,
    PanelTable,
    Td,
    Th,
    Tr,
} from "@/components/panel/DataPanel";
import { adminSejarahApi, parseApiError } from "@/lib/api";
import { useLocale } from "@/context/Locale";
import { getLocalizedField } from "@/lib/translation";
import { useEffect, useState } from "react";
import { BsPencil, BsPlusCircle, BsTrash, BsX } from "react-icons/bs";
import ModalShell from "@/components/ModalShell";

const CATEGORIES = [
    "khulafa",
    "dinasti",
    "peristiwa",
    "perang",
    "ulama",
    "nabi",
    "modern",
    "umum",
];

const slugify = (str) =>
    str
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");

const EMPTY_FORM = {
    year_hijri: "",
    year_miladi: "",
    title: "",
    slug: "",
    description: "",
    category: "umum",
    is_significant: false,
};

const AdminHistoryPage = () => {
    const { t, lang } = useLocale();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [search, setSearch] = useState("");
    const [deleteId, setDeleteId] = useState(null);

    const load = async () => {
        setLoading(true);
        try {
            const r = await adminSejarahApi.list(0, 500);
            const data = await r.json();
            setItems(data?.items ?? data ?? []);
        } catch {
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const openCreate = () => {
        setEditId(null);
        setForm(EMPTY_FORM);
        setShowModal(true);
    };

    const openEdit = (item) => {
        setEditId(item.id ?? item._id);
        setForm({
            year_hijri: item.year_hijri ?? item.year ?? "",
            year_miladi: item.year_miladi ?? "",
            title: getLocalizedField(item, "title", lang),
            slug: item.slug ?? "",
            description: getLocalizedField(item, "description", lang),
            category: item.category ?? "umum",
            is_significant: item.is_significant ?? false,
        });
        setShowModal(true);
    };

    const fb = (type, msg) =>
        window.dispatchEvent(
            new CustomEvent(type, { detail: { message: msg } }),
        );

    const save = async () => {
        setSaving(true);
        try {
            const title = form.title.trim();
            const payload = {
                year_hijri: Number(form.year_hijri) || 0,
                year_miladi: Number(form.year_miladi) || 0,
                title,
                slug: form.slug.trim() || slugify(title),
                description: form.description,
                category: form.category,
                is_significant: Boolean(form.is_significant),
            };
            let res;
            if (editId) {
                res = await adminSejarahApi.update(editId, payload);
            } else {
                res = await adminSejarahApi.create(payload);
            }
            if (!res.ok) throw new Error(await parseApiError(res, t("admin.error.save")));
            setShowModal(false);
            load();
            fb("admin:success", t("admin.crud.save_success"));
        } catch (err) {
            fb("admin:mutation-error", err.message);
        } finally {
            setSaving(false);
        }
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            const res = await adminSejarahApi.delete(deleteId);
            if (!res.ok) throw new Error(await parseApiError(res, t("admin.error.save")));
            setDeleteId(null);
            load();
            fb("admin:success", t("admin.crud.delete_success"));
        } catch (err) {
            fb("admin:mutation-error", err.message);
        }
    };

    const filtered = items.filter((i) => {
        const q = search.toLowerCase();
        return (
            getLocalizedField(i, "title", lang).toLowerCase().includes(q) ||
            i.category?.toLowerCase().includes(q) ||
            String(i.year_hijri ?? "").includes(q) ||
            String(i.year_miladi ?? "").includes(q)
        );
    });

    return (
        <div className='p-6'>
            <div className='flex items-center justify-between mb-6'>
                <div>
                    <h1 className='text-xl font-bold text-gray-900 dark:text-gray-100 dark:text-white'>
                        {t("admin.nav.history")}
                    </h1>
                    <p className='text-sm text-gray-500 dark:text-gray-300 dark:text-gray-400'>
                        {items.length} {t("admin.history.events_unit")}
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className='flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors'
                >
                    <BsPlusCircle />
                    {t("admin.history.add_event")}
                </button>
            </div>

            <div className='mb-4'>
                <input
                    type='text'
                    placeholder={t("admin.history.search_placeholder")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className='w-full max-w-xs px-3 py-2 border border-gray-300 dark:border-gray-600 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 dark:text-white'
                />
            </div>

            {loading ? (
                <p className='text-sm text-gray-500 dark:text-gray-300'>{t("common.loading")}</p>
            ) : (
                <PanelTable
                    head={
                        <>
                            <Th className='w-20'>
                                {t("admin.history.year_h")}
                            </Th>
                            <Th>{t("admin.history.event")}</Th>
                            <Th className='w-32'>
                                {t("admin.field.category")}
                            </Th>
                            <Th className='w-20'></Th>
                        </>
                    }
                >
                    {filtered.map((item) => (
                        <Tr key={item.id ?? item._id}>
                            <Td className='text-gray-500 dark:text-gray-300 dark:text-gray-400 font-mono text-xs'>
                                {item.year_hijri ? `${item.year_hijri} H` : "-"}
                            </Td>
                            <Td className='text-gray-900 dark:text-gray-100 dark:text-white font-medium'>
                                {getLocalizedField(item, "title", lang)}
                            </Td>
                            <Td>
                                <span className='px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 dark:text-gray-400 rounded text-xs capitalize'>
                                    {item.category}
                                </span>
                            </Td>
                            <Td>
                                <div className='flex items-center gap-2 justify-end'>
                                    <button
                                        onClick={() => openEdit(item)}
                                        aria-label={t("common.edit")}
                                        title={t("common.edit")}
                                        className='p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded'
                                    >
                                        <BsPencil />
                                    </button>
                                    <button
                                        onClick={() =>
                                            setDeleteId(item.id ?? item._id)
                                        }
                                        aria-label={t("common.delete")}
                                        title={t("common.delete")}
                                        className='p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded'
                                    >
                                        <BsTrash />
                                    </button>
                                </div>
                            </Td>
                        </Tr>
                    ))}
                    {filtered.length === 0 && (
                        <PanelEmpty colSpan={4}>
                            {t("admin.crud.no_data")}
                        </PanelEmpty>
                    )}
                </PanelTable>
            )}

            {showModal && (
                <ModalShell
                    onClose={() => setShowModal(false)}
                    overlayClassName='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'
                    panelClassName='bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto'
                >
                    <div className='flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-700'>
                        <h2 className='font-bold text-gray-900 dark:text-gray-100 dark:text-white'>
                            {editId
                                ? t("admin.history.edit_event")
                                : t("admin.history.add_event")}
                        </h2>
                        <button
                            onClick={() => setShowModal(false)}
                            className='p-1 text-gray-400 hover:text-gray-600 hover:dark:text-gray-300 dark:hover:text-gray-200'
                        >
                            <BsX className='text-xl' />
                        </button>
                    </div>
                    <div className='p-5 space-y-4'>
                        <div className='grid grid-cols-2 gap-4'>
                            <div>
                                <label
                                    htmlFor='page-year-hijri'
                                    className='block text-sm font-medium text-gray-700 dark:text-gray-200 dark:text-gray-300 mb-1'
                                >
                                    {t("admin.history.year_hijri")}
                                </label>
                                <input
                                    id='page-year-hijri'
                                    type='number'
                                    value={form.year_hijri}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            year_hijri: e.target.value,
                                        })
                                    }
                                    placeholder={t(
                                        "admin.sejarah.year_placeholder",
                                    )}
                                    className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 dark:text-white'
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor='page-tahun-masehi'
                                    className='block text-sm font-medium text-gray-700 dark:text-gray-200 dark:text-gray-300 mb-1'
                                >
                                    Tahun Masehi
                                </label>
                                <input
                                    id='page-tahun-masehi'
                                    type='number'
                                    value={form.year_miladi}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            year_miladi: e.target.value,
                                        })
                                    }
                                    placeholder={t(
                                        "admin.sejarah.century_placeholder",
                                    )}
                                    className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 dark:text-white'
                                />
                            </div>
                        </div>
                        <div className='grid grid-cols-2 gap-4'>
                            <div>
                                <label
                                    htmlFor='page-category'
                                    className='block text-sm font-medium text-gray-700 dark:text-gray-200 dark:text-gray-300 mb-1'
                                >
                                    {t("admin.field.category")}
                                </label>
                                <select
                                    id='page-category'
                                    value={form.category}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            category: e.target.value,
                                        })
                                    }
                                    className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 dark:text-white'
                                >
                                    {CATEGORIES.map((c) => (
                                        <option key={c} value={c}>
                                            {c}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label
                                    htmlFor='page-slug'
                                    className='block text-sm font-medium text-gray-700 dark:text-gray-200 dark:text-gray-300 mb-1'
                                >
                                    {t("admin.field.slug")}
                                </label>
                                <input
                                    id='page-slug'
                                    type='text'
                                    value={form.slug}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            slug: e.target.value,
                                        })
                                    }
                                    placeholder={t("admin.sejarah.auto_slug")}
                                    className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 dark:text-white'
                                />
                            </div>
                        </div>
                        <div>
                            <label
                                htmlFor='page-event-title'
                                className='block text-sm font-medium text-gray-700 dark:text-gray-200 dark:text-gray-300 mb-1'
                            >
                                {t("admin.history.event_title")}
                            </label>
                            <input
                                id='page-event-title'
                                type='text'
                                value={form.title}
                                onChange={(e) => {
                                    const nextTitle = e.target.value;
                                    setForm({
                                        ...form,
                                        title: nextTitle,
                                        slug:
                                            !form.slug ||
                                            form.slug === slugify(form.title)
                                                ? slugify(nextTitle)
                                                : form.slug,
                                    });
                                }}
                                className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 dark:text-white'
                            />
                        </div>
                        <div>
                            <label
                                htmlFor='page-description'
                                className='block text-sm font-medium text-gray-700 dark:text-gray-200 dark:text-gray-300 mb-1'
                            >
                                {t("admin.field.description")}
                            </label>
                            <textarea
                                id='page-description'
                                value={form.description}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        description: e.target.value,
                                    })
                                }
                                rows={4}
                                className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 dark:text-white'
                            />
                        </div>
                        <label className='flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 dark:text-gray-300'>
                            <input
                                type='checkbox'
                                checked={form.is_significant}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        is_significant: e.target.checked,
                                    })
                                }
                                className='rounded border-gray-300 dark:border-gray-600 dark:border-slate-600 text-emerald-700 dark:text-emerald-400 focus:ring-emerald-500'
                            />
                            Peristiwa penting
                        </label>
                    </div>
                    <div className='flex gap-3 p-5 border-t border-gray-100 dark:border-slate-700'>
                        <button
                            onClick={() => setShowModal(false)}
                            className='flex-1 py-2 border border-gray-300 dark:border-gray-600 dark:border-slate-600 text-gray-700 dark:text-gray-200 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-700'
                        >
                            {t("common.cancel")}
                        </button>
                        <button
                            onClick={save}
                            disabled={saving || !form.title.trim()}
                            className='flex-1 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium'
                        >
                            {saving ? t("common.saving") : t("common.save")}
                        </button>
                    </div>
                </ModalShell>
            )}

            {deleteId && (
                <ModalShell
                    onClose={() => setDeleteId(null)}
                    overlayClassName='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'
                    panelClassName='bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm p-6'
                >
                    <h2 className='font-bold text-gray-900 dark:text-gray-100 dark:text-white mb-2'>
                        {t("admin.crud.delete_title").replace(
                            "{item}",
                            t("admin.history.event"),
                        )}
                    </h2>
                    <p className='text-sm text-gray-500 dark:text-gray-300 dark:text-gray-400 mb-5'>
                        {t("admin.crud.delete_body")}
                    </p>
                    <div className='flex gap-3'>
                        <button
                            onClick={() => setDeleteId(null)}
                            className='flex-1 py-2 border border-gray-300 dark:border-gray-600 dark:border-slate-600 text-gray-700 dark:text-gray-200 dark:text-gray-300 rounded-lg text-sm font-medium'
                        >
                            {t("common.cancel")}
                        </button>
                        <button
                            onClick={confirmDelete}
                            className='flex-1 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium'
                        >
                            {t("common.delete")}
                        </button>
                    </div>
                </ModalShell>
            )}
        </div>
    );
};

export default AdminHistoryPage;
