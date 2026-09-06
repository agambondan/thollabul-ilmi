"use client";

import {
    PanelEmpty,
    PanelPagination,
    PanelTable,
    Td,
    Th,
    Tr,
} from "@/components/panel/DataPanel";
import { adminDzikirApi, parseApiError } from "@/lib/api";
import { useLocale } from "@/context/Locale";
import { getLocalizedField } from "@/lib/translation";
import { useEffect, useState } from "react";
import { BsPencil, BsPlusCircle, BsTrash, BsX } from "react-icons/bs";
import ModalShell from "@/components/ModalShell";
import SourceBadges from "@/components/SourceBadges";

const CATEGORIES = [
    "pagi",
    "petang",
    "sesudah-sholat",
    "sebelum-tidur",
    "umum",
];

const PAGE_SIZE = 20;

const EMPTY_FORM = {
    title: "",
    arabic: "",
    transliteration: "",
    translation: "",
    count: "",
    category: "umum",
    source: "",
};

const AdminDhikrPage = () => {
    const { t, lang } = useLocale();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [search, setSearch] = useState("");
    const [deleteId, setDeleteId] = useState(null);
    const [page, setPage] = useState(1);

    const load = async () => {
        setLoading(true);
        try {
            const r = await adminDzikirApi.list(0, 500);
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
            title: item.translation?.idn ?? item.title ?? "",
            arabic: item.translation?.ar ?? item.arabic ?? "",
            transliteration:
                item.translation?.latin_idn ?? item.transliteration ?? "",
            translation: item.translation?.description_idn ?? "",
            count: item.count ?? "",
            category: item.category ?? "umum",
            source: item.source ?? "",
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
            const payload = { ...form, count: Number(form.count) || 1 };
            let res;
            if (editId) {
                res = await adminDzikirApi.update(editId, payload);
            } else {
                res = await adminDzikirApi.create(payload);
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
            const res = await adminDzikirApi.delete(deleteId);
            if (!res.ok) throw new Error(await parseApiError(res, t("admin.error.save")));
            setDeleteId(null);
            load();
            fb("admin:success", t("admin.crud.delete_success"));
        } catch (err) {
            fb("admin:mutation-error", err.message);
        }
    };

    const filtered = items.filter(
        (i) =>
            i.title?.toLowerCase().includes(search.toLowerCase()) ||
            i.category?.toLowerCase().includes(search.toLowerCase()),
    );

    return (
        <div className='p-6'>
            <div className='flex items-center justify-between mb-6'>
                <div>
                    <h1 className='text-xl font-bold text-gray-900 dark:text-gray-100 dark:text-white'>
                        {t("admin.nav.dhikr")}
                    </h1>
                    <p className='text-sm text-gray-500 dark:text-gray-300 dark:text-gray-400'>
                        {items.length} {t("admin.crud.entries")}
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className='flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors'
                >
                    <BsPlusCircle />
                    {t("admin.crud.add")} {t("admin.nav.dhikr")}
                </button>
            </div>

            <div className='mb-4'>
                <input
                    type='text'
                    placeholder={t("admin.crud.search_title_category")}
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
                            <Th>{t("admin.field.title")}</Th>
                            <Th className='w-32'>
                                {t("admin.field.category")}
                            </Th>
                            <Th className='w-20 hidden md:table-cell'>
                                {t("admin.field.repetition")}
                            </Th>
                            <Th className='w-20'></Th>
                        </>
                    }
                >
                    {filtered.map((item) => (
                        <Tr key={item.id ?? item._id}>
                            <Td className='text-gray-900 dark:text-gray-100 dark:text-white font-medium'>
                                <div>{getLocalizedField(item, "title", lang)}</div>
                                {item.source && <SourceBadges source={item.source} />}
                            </Td>
                            <Td>
                                <span className='px-2 py-0.5 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 rounded text-xs'>
                                    {item.category}
                                </span>
                            </Td>
                            <Td className='text-gray-500 dark:text-gray-300 dark:text-gray-400 hidden md:table-cell'>
                                {item.count ? `${item.count}x` : "-"}
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
                                ? `${t("common.edit")} ${t("admin.nav.dhikr")}`
                                : `${t("admin.crud.add")} ${t("admin.nav.dhikr")}`}
                        </h2>
                        <button
                            onClick={() => setShowModal(false)}
                            className='p-1 text-gray-400 hover:text-gray-600 hover:dark:text-gray-300 dark:hover:text-gray-200'
                        >
                            <BsX className='text-xl' />
                        </button>
                    </div>
                    <div className='p-5 space-y-4'>
                        <div>
                            <label
                                htmlFor='page-title'
                                className='block text-sm font-medium text-gray-700 dark:text-gray-200 dark:text-gray-300 mb-1'
                            >
                                {t("admin.field.title")}
                            </label>
                            <input
                                id='page-title'
                                type='text'
                                value={form.title}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        title: e.target.value,
                                    })
                                }
                                className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 dark:text-white'
                            />
                        </div>
                        <div>
                            <label
                                htmlFor='page-arabic'
                                className='block text-sm font-medium text-gray-700 dark:text-gray-200 dark:text-gray-300 mb-1'
                            >
                                {t("admin.field.arabic")}
                            </label>
                            <textarea
                                id='page-arabic'
                                value={form.arabic}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        arabic: e.target.value,
                                    })
                                }
                                rows={3}
                                dir='rtl'
                                className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:border-slate-600 rounded-lg text-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 dark:text-white font-arabic leading-loose'
                            />
                        </div>
                        <div>
                            <label
                                htmlFor='page-latin'
                                className='block text-sm font-medium text-gray-700 dark:text-gray-200 dark:text-gray-300 mb-1'
                            >
                                {t("admin.field.latin")}
                            </label>
                            <textarea
                                id='page-latin'
                                value={form.transliteration}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        transliteration: e.target.value,
                                    })
                                }
                                rows={2}
                                className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 dark:text-white'
                            />
                        </div>
                        <div>
                            <label
                                htmlFor='page-translation'
                                className='block text-sm font-medium text-gray-700 dark:text-gray-200 dark:text-gray-300 mb-1'
                            >
                                {t("common.translation")}
                            </label>
                            <textarea
                                id='page-translation'
                                value={form.translation}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        translation: e.target.value,
                                    })
                                }
                                rows={2}
                                className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 dark:text-white'
                            />
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
                                    htmlFor='page-field-1'
                                    className='block text-sm font-medium text-gray-700 dark:text-gray-200 dark:text-gray-300 mb-1'
                                >
                                    {t("admin.field.repetition")} (x)
                                </label>
                                <input
                                    id='page-field-1'
                                    type='number'
                                    value={form.count}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            count: e.target.value,
                                        })
                                    }
                                    placeholder={t(
                                        "admin.dzikir.count_placeholder",
                                    )}
                                    className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 dark:text-white'
                                />
                            </div>
                        </div>
                        <div>
                            <label
                                htmlFor='page-source'
                                className='block text-sm font-medium text-gray-700 dark:text-gray-200 dark:text-gray-300 mb-1'
                            >
                                {t("common.source")}
                            </label>
                            <input
                                id='page-source'
                                type='text'
                                value={form.source}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        source: e.target.value,
                                    })
                                }
                                placeholder={t(
                                    "admin.dzikir.source_placeholder",
                                )}
                                className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 dark:text-white'
                            />
                            {form.source && (
                                <div className='mt-1'>
                                    <p className='text-[10px] text-gray-500 dark:text-gray-300 dark:text-gray-400 mb-0.5'>
                                        Preview
                                    </p>
                                    <SourceBadges source={form.source} />
                                </div>
                            )}
                        </div>
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
                            disabled={
                                saving ||
                                !form.title.trim() ||
                                !form.arabic.trim() ||
                                !form.translation.trim() ||
                                !form.category
                            }
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
                            t("admin.nav.dhikr"),
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

export default AdminDhikrPage;
