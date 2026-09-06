"use client";

import {
    PanelEmpty,
    PanelPagination,
    PanelTable,
    Td,
    Th,
    Tr,
} from "@/components/panel/DataPanel";
import { adminKamusApi, parseApiError } from "@/lib/api";
import { useLocale } from "@/context/Locale";
import { useEffect, useState } from "react";
import { BsPencil, BsPlusCircle, BsTrash, BsX } from "react-icons/bs";
import ModalShell from "@/components/ModalShell";
import SourceBadges from "@/components/SourceBadges";

const CATEGORIES = [
    "fiqh",
    "aqidah",
    "tasawuf",
    "ulumul_quran",
    "hadith",
    "lainnya",
];

const PAGE_SIZE = 20;

const EMPTY_FORM = {
    term: "",
    category: "lainnya",
    definition: "",
    example: "",
    source: "",
    origin: "",
};

const AdminDictionaryPage = () => {
    const { t } = useLocale();
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
            const r = await adminKamusApi.list(0, 500);
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
            term: item.term ?? item.arabic ?? item.latin ?? "",
            category: item.category ?? "lainnya",
            definition: item.definition ?? item.meaning ?? "",
            example: item.example ?? "",
            source: item.source ?? "",
            origin: item.origin ?? item.root ?? "",
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
            let res;
            if (editId) {
                res = await adminKamusApi.update(editId, form);
            } else {
                res = await adminKamusApi.create(form);
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
            const res = await adminKamusApi.delete(deleteId);
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
            i.term?.toLowerCase().includes(q) ||
            i.definition?.toLowerCase().includes(q) ||
            i.category?.toLowerCase().includes(q) ||
            i.arabic?.includes(search) ||
            i.latin?.toLowerCase().includes(q) ||
            i.meaning?.toLowerCase().includes(q)
        );
    });

    const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const currentPage = Math.min(page, pageCount);
    const visible = filtered.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE,
    );

    return (
        <div className='p-6'>
            <div className='flex items-center justify-between mb-6'>
                <div>
                    <h1 className='text-xl font-bold text-gray-900 dark:text-gray-100 dark:text-white'>
                        {t("admin.nav.dictionary")}
                    </h1>
                    <p className='text-sm text-gray-500 dark:text-gray-300 dark:text-gray-400'>
                        {items.length} {t("admin.kamus.words_unit")}
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className='flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors'
                >
                    <BsPlusCircle />
                    {t("admin.kamus.add_word")}
                </button>
            </div>

            <div className='mb-4'>
                <input
                    type='text'
                    placeholder={t("admin.kamus.search_placeholder")}
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                    }}
                    className='w-full max-w-xs px-3 py-2 border border-gray-300 dark:border-gray-600 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 dark:text-white'
                />
            </div>

            {loading ? (
                <p className='text-sm text-gray-500 dark:text-gray-300'>{t("common.loading")}</p>
            ) : (
                <>
                    <PanelTable
                        head={
                            <>
                                <Th>Istilah</Th>
                                <Th>{t("admin.field.category")}</Th>
                                <Th>Definisi</Th>
                                <Th className='hidden md:table-cell'>
                                    Asal/Sumber
                                </Th>
                                <Th className='w-20'></Th>
                            </>
                        }
                    >
                        {visible.map((item) => (
                            <Tr key={item.id ?? item._id}>
                                <Td className='text-gray-900 dark:text-gray-100 dark:text-white font-medium'>
                                    {item.term ?? item.arabic}
                                </Td>
                                <Td className='text-gray-700 dark:text-gray-200 dark:text-gray-300'>
                                    {item.category ?? "-"}
                                </Td>
                                <Td className='text-gray-500 dark:text-gray-300 dark:text-gray-400'>
                                    {item.definition ?? item.meaning}
                                </Td>
                                <Td className='text-gray-400 text-xs hidden md:table-cell'>
                                    {item.origin || item.source || item.root || "-"}
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
                    <PanelPagination
                        page={currentPage}
                        pageCount={pageCount}
                        total={filtered.length}
                        onChange={setPage}
                        labels={{
                            prev: t("common.prev"),
                            next: t("common.next"),
                        }}
                    />
                </>
            )}

            {showModal && (
                <ModalShell
                    onClose={() => setShowModal(false)}
                    overlayClassName='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'
                    panelClassName='bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto'
                >
                    <div className='flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-700'>
                        <h2 className='font-bold text-gray-900 dark:text-gray-100 dark:text-white'>
                            {editId
                                ? t("admin.kamus.edit_word")
                                : t("admin.kamus.add_word")}
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
                                htmlFor='page-istilah'
                                className='block text-sm font-medium text-gray-700 dark:text-gray-200 dark:text-gray-300 mb-1'
                            >
                                Istilah
                            </label>
                            <input
                                id='page-istilah'
                                type='text'
                                value={form.term}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        term: e.target.value,
                                    })
                                }
                                className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 dark:text-white'
                            />
                        </div>
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
                                htmlFor='page-definisi'
                                className='block text-sm font-medium text-gray-700 dark:text-gray-200 dark:text-gray-300 mb-1'
                            >
                                Definisi
                            </label>
                            <textarea
                                id='page-definisi'
                                value={form.definition}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        definition: e.target.value,
                                    })
                                }
                                rows={3}
                                className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 dark:text-white'
                            />
                        </div>
                        <div>
                            <label
                                htmlFor='page-field-1'
                                className='block text-sm font-medium text-gray-700 dark:text-gray-200 dark:text-gray-300 mb-1'
                            >
                                Contoh ({t("common.optional")})
                            </label>
                            <textarea
                                id='page-field-1'
                                value={form.example}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        example: e.target.value,
                                    })
                                }
                                rows={2}
                                className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 dark:text-white'
                            />
                        </div>
                        <div className='grid grid-cols-2 gap-4'>
                            <div>
                                <label
                                    htmlFor='page-field-2'
                                    className='block text-sm font-medium text-gray-700 dark:text-gray-200 dark:text-gray-300 mb-1'
                                >
                                    Asal ({t("common.optional")})
                                </label>
                                <input
                                    id='page-field-2'
                                    type='text'
                                    value={form.origin}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            origin: e.target.value,
                                        })
                                    }
                                    className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 dark:text-white'
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor='page-field-3'
                                    className='block text-sm font-medium text-gray-700 dark:text-gray-200 dark:text-gray-300 mb-1'
                                >
                                    {t("common.source")} ({t("common.optional")}
                                    )
                                </label>
                                <input
                                    id='page-field-3'
                                    type='text'
                                    value={form.source}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            source: e.target.value,
                                        })
                                    }
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
                            disabled={saving || !form.term.trim() || !form.definition.trim()}
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
                            item: t("admin.kamus.word"),
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

export default AdminDictionaryPage;
