"use client";

import { adminAsbabunNuzulApi } from "@/lib/api";
import { useLocale } from "@/context/Locale";
import { getLocalizedField } from "@/lib/translation";
import { useEffect, useState } from "react";
import { BsPencil, BsPlusCircle, BsTrash, BsX } from "react-icons/bs";

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
            if (!res.ok) throw new Error(t("admin.error.save"));
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
            if (!res.ok) throw new Error(t("admin.error.save"));
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

    return (
        <div className='p-6'>
            <div className='flex items-center justify-between mb-6'>
                <div>
                    <h1 className='text-xl font-bold text-gray-900 dark:text-white'>
                        Asbabun Nuzul
                    </h1>
                    <p className='text-sm text-gray-500 dark:text-gray-400'>
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
                    onChange={(e) => setSearch(e.target.value)}
                    className='w-full max-w-xs px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white'
                />
            </div>

            {loading ? (
                <p className='text-sm text-gray-500'>{t("common.loading")}</p>
            ) : (
                <div className='bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden'>
                    <table className='w-full text-sm'>
                        <thead className='bg-gray-50 dark:bg-slate-700'>
                            <tr>
                                <th className='text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300 w-20'>
                                    Surah
                                </th>
                                <th className='text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300 w-16'>
                                    {t("common.verse")}
                                </th>
                                <th className='text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300'>
                                    {t("admin.field.title")}
                                </th>
                                <th className='text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300 hidden md:table-cell'>
                                    {t("common.source")}
                                </th>
                                <th className='px-4 py-3 w-20'></th>
                            </tr>
                        </thead>
                        <tbody className='divide-y divide-gray-100 dark:divide-slate-700'>
                            {filtered.map((item) => (
                                <tr
                                    key={item.id ?? item._id}
                                    className='hover:bg-gray-50 dark:hover:bg-slate-750'
                                >
                                    <td className='px-4 py-3 text-gray-500 dark:text-gray-400 font-mono text-xs'>
                                        {getSurahNumber(item)}
                                    </td>
                                    <td className='px-4 py-3 text-gray-500 dark:text-gray-400 font-mono text-xs'>
                                        {formatAyahRange(item)}
                                    </td>
                                    <td className='px-4 py-3 text-gray-900 dark:text-white font-medium max-w-xs truncate'>
                                        {getLocalizedField(item, "title", lang)}
                                    </td>
                                    <td className='px-4 py-3 text-gray-400 dark:text-gray-500 text-xs hidden md:table-cell max-w-xs truncate'>
                                        {item.source ?? "-"}
                                    </td>
                                    <td className='px-4 py-3'>
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
                                                    setDeleteId(
                                                        item.id ?? item._id,
                                                    )
                                                }
                                                aria-label={t("common.delete")}
                                                title={t("common.delete")}
                                                className='p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded'
                                            >
                                                <BsTrash />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className='px-4 py-8 text-center text-gray-400'
                                    >
                                        {t("admin.crud.no_data")}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
                    <div className='bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto'>
                        <div className='flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-700'>
                            <h2 className='font-bold text-gray-900 dark:text-white'>
                                {editId
                                    ? `${t("common.edit")} ${t("admin.nav.asbabun")}`
                                    : `${t("admin.crud.add")} ${t("admin.nav.asbabun")}`}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className='p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                            >
                                <BsX className='text-xl' />
                            </button>
                        </div>
                        <div className='p-5 space-y-4'>
                            <div className='grid grid-cols-3 gap-4'>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                        {t("admin.asbabun.surah_number")}
                                    </label>
                                    <input
                                        type='number'
                                        value={form.surah_number}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                surah_number: e.target.value,
                                            })
                                        }
                                        min={1}
                                        max={114}
                                        className='w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white'
                                    />
                                </div>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                        Ayat awal
                                    </label>
                                    <input
                                        type='number'
                                        value={form.ayah_number}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                ayah_number: e.target.value,
                                            })
                                        }
                                        min={1}
                                        className='w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white'
                                    />
                                </div>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                        Ayat akhir
                                    </label>
                                    <input
                                        type='number'
                                        value={form.ayah_end}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                ayah_end: e.target.value,
                                            })
                                        }
                                        min={1}
                                        placeholder='Opsional'
                                        className='w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white'
                                    />
                                </div>
                            </div>
                            <div>
                                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                    {t("admin.field.title")}
                                </label>
                                <input
                                    type='text'
                                    value={form.title}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            title: e.target.value,
                                        })
                                    }
                                    className='w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white'
                                />
                            </div>
                            <div className='grid grid-cols-2 gap-4'>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                        Perawi
                                    </label>
                                    <input
                                        type='text'
                                        value={form.narrator}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                narrator: e.target.value,
                                            })
                                        }
                                        placeholder='e.g. Ibnu Abbas'
                                        className='w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white'
                                    />
                                </div>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                        Referensi tampil
                                    </label>
                                    <input
                                        type='text'
                                        value={form.display_ref}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                display_ref: e.target.value,
                                            })
                                        }
                                        placeholder='QS 2:6-16'
                                        className='w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white'
                                    />
                                </div>
                            </div>
                            <div>
                                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                    {t("admin.field.content")}
                                </label>
                                <textarea
                                    value={form.content}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            content: e.target.value,
                                        })
                                    }
                                    rows={5}
                                    className='w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white'
                                />
                            </div>
                            <div>
                                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                    {t("common.source")}
                                </label>
                                <input
                                    type='text'
                                    value={form.source}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            source: e.target.value,
                                        })
                                    }
                                    placeholder='e.g. HR. Bukhari, Tafsir Ibnu Katsir'
                                    className='w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white'
                                />
                            </div>
                        </div>
                        <div className='flex gap-3 p-5 border-t border-gray-100 dark:border-slate-700'>
                            <button
                                onClick={() => setShowModal(false)}
                                className='flex-1 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-700'
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
                    </div>
                </div>
            )}

            {deleteId && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
                    <div className='bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm p-6'>
                        <h2 className='font-bold text-gray-900 dark:text-white mb-2'>
                            {t("admin.crud.delete_title").replace(
                                "{item}",
                                t("admin.nav.asbabun"),
                            )}
                        </h2>
                        <p className='text-sm text-gray-500 dark:text-gray-400 mb-5'>
                            {t("admin.crud.delete_body")}
                        </p>
                        <div className='flex gap-3'>
                            <button
                                onClick={() => setDeleteId(null)}
                                className='flex-1 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium'
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
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminAsbabunNuzulPage;
