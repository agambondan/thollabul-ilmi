"use client";

import {
    PanelEmpty,
    PanelTable,
    Td,
    Th,
    Tr,
} from "@/components/panel/DataPanel";
import { adminAsmaulHusnaApi, parseApiError } from "@/lib/api";
import { useLocale } from "@/context/Locale";
import { getLocalizedField } from "@/lib/translation";
import { useEffect, useState } from "react";
import { BsPencil, BsPlusCircle, BsTrash, BsX } from "react-icons/bs";
import ModalShell from "@/components/ModalShell";
import SourceBadges from "@/components/SourceBadges";

const EMPTY_FORM = {
    number: "",
    arabic: "",
    transliteration: "",
    indonesian: "",
    english: "",
    description: "",
    source: "",
};

const AdminAsmaulHusnaPage = () => {
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
            const r = await adminAsmaulHusnaApi.list(0, 200);
            const data = await r.json();
            const arr = data?.items ?? data ?? [];
            setItems(
                [...arr].sort((a, b) => (a.number ?? 0) - (b.number ?? 0)),
            );
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
            number: item.number ?? "",
            arabic: item.arabic ?? "",
            transliteration: item.transliteration ?? "",
            indonesian: item.indonesian ?? "",
            english: item.english ?? "",
            description:
                item.meaning ?? item.translation?.description_idn ?? "",
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
            const payload = { ...form, number: Number(form.number) };
            let res;
            if (editId) {
                res = await adminAsmaulHusnaApi.update(editId, payload);
            } else {
                res = await adminAsmaulHusnaApi.create(payload);
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
            const res = await adminAsmaulHusnaApi.delete(deleteId);
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
            i.transliteration?.toLowerCase().includes(q) ||
            i.indonesian?.toLowerCase().includes(q) ||
            i.english?.toLowerCase().includes(q) ||
            i.meaning?.toLowerCase().includes(q) ||
            String(i.number).includes(q)
        );
    });

    return (
        <div className='p-6'>
            <div className='flex items-center justify-between mb-6'>
                <div>
                    <h1 className='text-xl font-bold text-gray-900 dark:text-gray-100 dark:text-white'>
                        Asmaul Husna
                    </h1>
                    <p className='text-sm text-gray-500 dark:text-gray-300 dark:text-gray-400'>
                        {items.length} / 99 {t("admin.asmaul.names_unit")}
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className='flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors'
                >
                    <BsPlusCircle />
                    {t("admin.crud.add")}
                </button>
            </div>

            <div className='mb-4'>
                <input
                    type='text'
                    placeholder={t("admin.asmaul.search_placeholder")}
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
                            <Th className='w-12'>{t("admin.field.number")}</Th>
                            <Th>{t("admin.field.arabic")}</Th>
                            <Th>{t("admin.field.latin")}</Th>
                            <Th className='hidden md:table-cell'>
                                {t("admin.asmaul.meaning")}
                            </Th>
                            <Th className='w-20'></Th>
                        </>
                    }
                >
                    {filtered.map((item) => (
                        <Tr key={item.id ?? item._id}>
                            <Td className='text-gray-500 dark:text-gray-300 dark:text-gray-400 font-mono text-xs'>
                                {item.number}
                            </Td>
                            <Td className='text-gray-900 dark:text-gray-100 dark:text-white font-arabic text-lg'>
                                {item.arabic}
                            </Td>
                            <Td className='text-gray-700 dark:text-gray-200 dark:text-gray-300 italic'>
                                {item.transliteration}
                            </Td>
                            <Td className='text-gray-500 dark:text-gray-300 dark:text-gray-400 hidden md:table-cell'>
                                <div>{getLocalizedField(item, "meaning", lang, [
                                    "indonesian",
                                    "english",
                                ])}</div>
                                {item.source && <SourceBadges source={item.source} />}
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
                        <PanelEmpty colSpan={5}>
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
                                ? t("admin.asmaul.edit_name")
                                : t("admin.asmaul.add_name")}
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
                                    htmlFor='page-number'
                                    className='block text-sm font-medium text-gray-700 dark:text-gray-200 dark:text-gray-300 mb-1'
                                >
                                    {t("admin.field.number")}
                                </label>
                                <input
                                    id='page-number'
                                    type='number'
                                    value={form.number}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            number: e.target.value,
                                        })
                                    }
                                    min={1}
                                    max={99}
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
                                <input
                                    id='page-arabic'
                                    type='text'
                                    value={form.arabic}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            arabic: e.target.value,
                                        })
                                    }
                                    dir='rtl'
                                    className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 dark:text-white font-arabic text-lg'
                                />
                            </div>
                        </div>
                        <div>
                            <label
                                htmlFor='page-latin'
                                className='block text-sm font-medium text-gray-700 dark:text-gray-200 dark:text-gray-300 mb-1'
                            >
                                {t("admin.field.latin")}
                            </label>
                            <input
                                id='page-latin'
                                type='text'
                                value={form.transliteration}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        transliteration: e.target.value,
                                    })
                                }
                                className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 dark:text-white'
                            />
                        </div>
                        <div className='grid grid-cols-2 gap-4'>
                            <div>
                                <label
                                    htmlFor='page-meaning-id'
                                    className='block text-sm font-medium text-gray-700 dark:text-gray-200 dark:text-gray-300 mb-1'
                                >
                                    {t("admin.asmaul.meaning_id")}
                                </label>
                                <input
                                    id='page-meaning-id'
                                    type='text'
                                    value={form.indonesian}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            indonesian: e.target.value,
                                        })
                                    }
                                    className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 dark:text-white'
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor='page-meaning-en'
                                    className='block text-sm font-medium text-gray-700 dark:text-gray-200 dark:text-gray-300 mb-1'
                                >
                                    {t("admin.asmaul.meaning_en")}
                                </label>
                                <input
                                    id='page-meaning-en'
                                    type='text'
                                    value={form.english}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            english: e.target.value,
                                        })
                                    }
                                    className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 dark:text-white'
                                />
                            </div>
                        </div>
                        <div>
                            <label
                                htmlFor='page-notes'
                                className='block text-sm font-medium text-gray-700 dark:text-gray-200 dark:text-gray-300 mb-1'
                            >
                                {t("admin.asmaul.notes")}
                            </label>
                            <textarea
                                id='page-notes'
                                value={form.description}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        description: e.target.value,
                                    })
                                }
                                rows={3}
                                className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 dark:text-white'
                            />
                        </div>
                        <div>
                            <label
                                htmlFor='page-source'
                                className='block text-sm font-medium text-gray-700 dark:text-gray-200 dark:text-gray-300 mb-1'
                            >
                                {t("admin.field.source")}
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
                                placeholder='HR. Bukhari No. 2736; HR. Muslim No. 2677'
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
                                !form.arabic.trim() ||
                                !form.transliteration.trim() ||
                                !form.indonesian.trim() ||
                                !form.english.trim() ||
                                !form.number ||
                                Number(form.number) < 1 ||
                                Number(form.number) > 99
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
                        {t("admin.crud.delete_title", {
                            item: t("admin.asmaul.name"),
                        })}
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

export default AdminAsmaulHusnaPage;
