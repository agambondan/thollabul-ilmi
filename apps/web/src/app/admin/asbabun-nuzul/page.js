"use client";

import {
    PanelEmpty,
    PanelPagination,
    PanelTable,
    Td,
    Th,
    Tr,
} from "@/components/panel/DataPanel";
import { adminAsbabunNuzulApi, parseApiError } from "@/lib/api";
import { useLocale } from "@/context/Locale";
import { getLocalizedField } from "@/lib/translation";
import { SURAH_LIST } from "@/lib/surahList";
import { useEffect, useState } from "react";
import { BsPencil, BsPlusCircle, BsTrash, BsX } from "react-icons/bs";
import ModalShell from "@/components/ModalShell";

const PAGE_SIZE = 25;

const EMPTY_FORM = {
    surah_number: "",
    ayah_number: "",
    ayah_end: "",
    title: "",
    narrator: "",
    content: "",
    source: "",
    display_ref: "",
};

const primaryRef = (item) => item?.ayah_refs?.[0] ?? item?.ayahs?.[0] ?? {};

const lastRef = (item) => {
    const refs = item?.ayah_refs;
    if (Array.isArray(refs) && refs.length > 0) return refs[refs.length - 1];
    return primaryRef(item);
};

const getSurahNumber = (item) =>
    item?.surah_number ??
    primaryRef(item)?.surah_number ??
    primaryRef(item)?.surah?.number ??
    "";

const getAyahStart = (item) =>
    item?.ayah_start ??
    item?.ayah_number ??
    primaryRef(item)?.ayah_number ??
    primaryRef(item)?.number ??
    "";

const getAyahEnd = (item) =>
    item?.ayah_end ??
    lastRef(item)?.ayah_number ??
    lastRef(item)?.number ??
    getAyahStart(item);

const formatAyahRange = (item) => {
    const start = getAyahStart(item);
    const end = getAyahEnd(item);
    if (!start) return "-";
    return end && Number(end) !== Number(start) ? `${start}-${end}` : start;
};

const buildAyahRefs = (surahNumber, ayahStart, ayahEnd) => {
    const end = ayahEnd && ayahEnd >= ayahStart ? ayahEnd : ayahStart;
    return Array.from({ length: end - ayahStart + 1 }, (_, index) => ({
        surah_number: surahNumber,
        ayah_number: ayahStart + index,
    }));
};

const AdminAsbabunNuzulPage = () => {
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
            const r = await adminAsbabunNuzulApi.list(0, 500);
            const data = await r.json();
            const arr = data?.items ?? data ?? [];
            setItems(
                [...arr].sort(
                    (a, b) =>
                        (Number(getSurahNumber(a)) || 0) -
                            (Number(getSurahNumber(b)) || 0) ||
                        (Number(getAyahStart(a)) || 0) -
                            (Number(getAyahStart(b)) || 0),
                ),
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
            surah_number: getSurahNumber(item),
            ayah_number: getAyahStart(item),
            ayah_end:
                Number(getAyahEnd(item)) !== Number(getAyahStart(item))
                    ? getAyahEnd(item)
                    : "",
            title: item.title ?? "",
            narrator: item.narrator ?? "",
            content: item.content ?? "",
            source: item.source ?? "",
            display_ref: item.display_ref ?? "",
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
            const surahNumber = Number(form.surah_number);
            const ayahStart = Number(form.ayah_number);
            const ayahEnd = Number(form.ayah_end) || ayahStart;
            const payload = {
                ...form,
                surah_number: surahNumber,
                ayah_number: ayahStart,
                ayah_start: ayahStart,
                ayah_end: ayahEnd,
                ayah_refs: buildAyahRefs(surahNumber, ayahStart, ayahEnd),
            };
            let res;
            if (editId) {
                res = await adminAsbabunNuzulApi.update(editId, payload);
            } else {
                res = await adminAsbabunNuzulApi.create(payload);
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
            const res = await adminAsbabunNuzulApi.delete(deleteId);
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
            getLocalizedField(i, "title", lang)
                .toLowerCase()
                .includes(search.toLowerCase()) ||
            getLocalizedField(i, "content", lang)
                .toLowerCase()
                .includes(search.toLowerCase()) ||
            String(getSurahNumber(i)).includes(search) ||
            String(i.display_ref ?? "")
                .toLowerCase()
                .includes(search.toLowerCase()),
    );

    // 216 rows rendered at once produced a page ~11.700px tall. Search still
    // runs over everything; only the slice reaches the DOM.
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
                        Asbabun Nuzul
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
                    {t("common.add")}
                </button>
            </div>

            <div className='mb-4'>
                <input
                    type='text'
                    placeholder={t("admin.asbabun.search_placeholder")}
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
                                <Th className='w-20'>Surah</Th>
                                <Th className='w-16'>{t("common.verse")}</Th>
                                <Th>{t("admin.field.title")}</Th>
                                <Th className='hidden md:table-cell'>
                                    {t("common.source")}
                                </Th>
                                <Th className='w-20'></Th>
                            </>
                        }
                    >
                        {visible.map((item) => (
                            <Tr key={item.id ?? item._id}>
                                <Td className='text-gray-500 dark:text-gray-300 dark:text-gray-400 font-mono text-xs'>
                                    {getSurahNumber(item)}
                                </Td>
                                <Td className='text-gray-500 dark:text-gray-300 dark:text-gray-400 font-mono text-xs'>
                                    {formatAyahRange(item)}
                                </Td>
                                <Td className='text-gray-900 dark:text-gray-100 dark:text-white font-medium max-w-xs truncate'>
                                    {getLocalizedField(item, "title", lang)}
                                </Td>
                                <Td className='text-gray-400 text-xs hidden md:table-cell max-w-xs truncate'>
                                    {item.source ?? "-"}
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
                    panelClassName='bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto'
                >
                    <div className='flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-700'>
                        <h2 className='font-bold text-gray-900 dark:text-gray-100 dark:text-white'>
                            {editId
                                ? `${t("common.edit")} ${t("admin.nav.asbabun")}`
                                : `${t("admin.crud.add")} ${t("admin.nav.asbabun")}`}
                        </h2>
                        <button
                            onClick={() => setShowModal(false)}
                            className='p-1 text-gray-400 hover:text-gray-600 hover:dark:text-gray-300 dark:hover:text-gray-200'
                        >
                            <BsX className='text-xl' />
                        </button>
                    </div>
                    <div className='p-5 space-y-4'>
                        <div className='grid grid-cols-3 gap-4'>
                            <div>
                                <label
                                    htmlFor='page-surah-number'
                                    className='block text-sm font-medium text-gray-700 dark:text-gray-200 dark:text-gray-300 mb-1'
                                >
                                    {t("admin.asbabun.surah_number")}
                                </label>
                                <select
                                    id='page-surah-number'
                                    value={form.surah_number}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            surah_number: e.target.value,
                                        })
                                    }
                                    className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 dark:text-white'
                                >
                                    <option value=''>-- Pilih Surah --</option>
                                    {SURAH_LIST.map((s) => (
                                        <option key={s.number} value={s.number}>
                                            {s.number}. {s.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label
                                    htmlFor='page-ayat-awal'
                                    className='block text-sm font-medium text-gray-700 dark:text-gray-200 dark:text-gray-300 mb-1'
                                >
                                    Ayat awal
                                </label>
                                <input
                                    id='page-ayat-awal'
                                    type='number'
                                    value={form.ayah_number}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            ayah_number: e.target.value,
                                        })
                                    }
                                    min={1}
                                    className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 dark:text-white'
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor='page-ayat-akhir'
                                    className='block text-sm font-medium text-gray-700 dark:text-gray-200 dark:text-gray-300 mb-1'
                                >
                                    Ayat akhir
                                </label>
                                <input
                                    id='page-ayat-akhir'
                                    type='number'
                                    value={form.ayah_end}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            ayah_end: e.target.value,
                                        })
                                    }
                                    min={1}
                                    placeholder={t(
                                        "admin.asbabun_nuzul.optional",
                                    )}
                                    className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 dark:text-white'
                                />
                            </div>
                        </div>
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
                        <div className='grid grid-cols-2 gap-4'>
                            <div>
                                <label
                                    htmlFor='page-perawi'
                                    className='block text-sm font-medium text-gray-700 dark:text-gray-200 dark:text-gray-300 mb-1'
                                >
                                    Perawi
                                </label>
                                <input
                                    id='page-perawi'
                                    type='text'
                                    value={form.narrator}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            narrator: e.target.value,
                                        })
                                    }
                                    placeholder={t(
                                        "admin.asbabun_nuzul.scholar_placeholder",
                                    )}
                                    className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 dark:text-white'
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor='page-referensi-tampil'
                                    className='block text-sm font-medium text-gray-700 dark:text-gray-200 dark:text-gray-300 mb-1'
                                >
                                    Referensi tampil
                                </label>
                                <input
                                    id='page-referensi-tampil'
                                    type='text'
                                    value={form.display_ref}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            display_ref: e.target.value,
                                        })
                                    }
                                    placeholder={t(
                                        "admin.asbabun_nuzul.verse_placeholder",
                                    )}
                                    className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 dark:text-white'
                                />
                            </div>
                        </div>
                        <div>
                            <label
                                htmlFor='page-content'
                                className='block text-sm font-medium text-gray-700 dark:text-gray-200 dark:text-gray-300 mb-1'
                            >
                                {t("admin.field.content")}
                            </label>
                            <textarea
                                id='page-content'
                                value={form.content}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        content: e.target.value,
                                    })
                                }
                                rows={5}
                                className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 dark:text-white'
                            />
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
                                    "admin.asbabun_nuzul.source_placeholder",
                                )}
                                className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 dark:text-white'
                            />
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
                                !form.title ||
                                !form.content ||
                                !form.surah_number ||
                                !form.ayah_number
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
                            t("admin.nav.asbabun"),
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

export default AdminAsbabunNuzulPage;
