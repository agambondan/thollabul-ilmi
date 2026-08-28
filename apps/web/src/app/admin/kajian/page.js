"use client";

import { adminKajianApi } from "@/lib/api";
import { useLocale } from "@/context/Locale";
import { getLocalizedField } from "@/lib/translation";
import { useEffect, useState } from "react";
import {
    BsBoxArrowUpRight,
    BsPencil,
    BsPlusCircle,
    BsTrash,
    BsX,
} from "react-icons/bs";

const CATEGORIES = [
    "aqidah",
    "fiqh",
    "akhlak",
    "tafsir",
    "hadits",
    "sirah",
    "tahsin",
    "umum",
];
const TYPES = ["video", "audio", "text"];

const parseDurationSeconds = (value) => {
    if (typeof value === "number") return value;
    const raw = String(value ?? "").trim();
    if (!raw) return 0;
    if (!raw.includes(":")) return Number(raw) || 0;
    return raw
        .split(":")
        .map((part) => Number(part) || 0)
        .reduce((total, part) => total * 60 + part, 0);
};

const EMPTY_FORM = {
    title: "",
    speaker: "",
    topic: "umum",
    type: "video",
    url: "",
    duration_seconds: "",
    description: "",
    thumbnail_url: "",
    published_at: "",
};

const AdminStudiesPage = () => {
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
            const r = await adminKajianApi.list(0, 500);
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
            title: item.title ?? "",
            speaker: item.speaker ?? item.ustadz ?? "",
            topic: item.topic ?? item.category ?? "umum",
            type: item.type ?? "video",
            url: item.url ?? "",
            duration_seconds: item.duration_seconds ?? item.duration ?? "",
            description:
                getLocalizedField(item, "description", lang) ||
                item.description ||
                "",
            thumbnail_url: item.thumbnail_url ?? item.thumbnail ?? "",
            published_at: item.published_at ?? "",
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
            const payload = {
                title: form.title,
                speaker: form.speaker,
                topic: form.topic,
                type: form.type,
                url: form.url,
                duration_seconds: parseDurationSeconds(form.duration_seconds),
                description: form.description,
                thumbnail_url: form.thumbnail_url,
                published_at: form.published_at,
            };
            let res;
            if (editId) {
                res = await adminKajianApi.update(editId, payload);
            } else {
                res = await adminKajianApi.create(payload);
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
            const res = await adminKajianApi.delete(deleteId);
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
                ?.toLowerCase()
                .includes(search.toLowerCase()) ||
            getLocalizedField(i, "description", lang)
                ?.toLowerCase()
                .includes(search.toLowerCase()) ||
            i.speaker?.toLowerCase().includes(search.toLowerCase()) ||
            i.topic?.toLowerCase().includes(search.toLowerCase()),
    );

    return (
        <div className='p-6'>
            <div className='flex items-center justify-between mb-6'>
                <div>
                    <h1 className='text-xl font-bold text-gray-900 dark:text-white'>
                        {t("admin.nav.studies")}
                    </h1>
                    <p className='text-sm text-gray-500 dark:text-gray-400'>
                        {items.length} {t("admin.kajian.studies_unit")}
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className='flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors'
                >
                    <BsPlusCircle />
                    {t("admin.kajian.add_study")}
                </button>
            </div>

            <div className='mb-4'>
                <input
                    type='text'
                    placeholder={t("admin.kajian.search_placeholder")}
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
                                <th className='text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300'>
                                    {t("admin.field.title")}
                                </th>
                                <th className='text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300 hidden md:table-cell'>
                                    Ustadz
                                </th>
                                <th className='text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300 w-24'>
                                    Tipe
                                </th>
                                <th className='text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300 w-24 hidden lg:table-cell'>
                                    {t("admin.field.category")}
                                </th>
                                <th className='px-4 py-3 w-24'></th>
                            </tr>
                        </thead>
                        <tbody className='divide-y divide-gray-100 dark:divide-slate-700'>
                            {filtered.map((item) => (
                                <tr
                                    key={item.id ?? item._id}
                                    className='hover:bg-gray-50 dark:hover:bg-slate-750'
                                >
                                    <td className='px-4 py-3 text-gray-900 dark:text-white font-medium max-w-xs truncate'>
                                        {getLocalizedField(item, "title", lang)}
                                    </td>
                                    <td className='px-4 py-3 text-gray-500 dark:text-gray-400 hidden md:table-cell'>
                                        {item.speaker ?? "-"}
                                    </td>
                                    <td className='px-4 py-3'>
                                        <span className='px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded text-xs capitalize'>
                                            {item.type ?? "-"}
                                        </span>
                                    </td>
                                    <td className='px-4 py-3 text-gray-500 dark:text-gray-400 hidden lg:table-cell capitalize'>
                                        {item.topic}
                                    </td>
                                    <td className='px-4 py-3'>
                                        <div className='flex items-center gap-1.5 justify-end'>
                                            {item.url && (
                                                <a
                                                    href={item.url}
                                                    target='_blank'
                                                    rel='noreferrer'
                                                    className='p-1.5 text-gray-400 hover:text-gray-600 rounded'
                                                >
                                                    <BsBoxArrowUpRight />
                                                </a>
                                            )}
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
                                    ? t("admin.kajian.edit_study")
                                    : t("admin.kajian.add_study")}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className='p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                            >
                                <BsX className='text-xl' />
                            </button>
                        </div>
                        <div className='p-5 space-y-4'>
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
                                        Ustadz
                                    </label>
                                    <input
                                        type='text'
                                        value={form.speaker}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                speaker: e.target.value,
                                            })
                                        }
                                        className='w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white'
                                    />
                                </div>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                        {t("admin.kajian.duration")}
                                    </label>
                                    <input
                                        type='text'
                                        value={form.duration_seconds}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                duration_seconds:
                                                    e.target.value,
                                            })
                                        }
                                        placeholder='3600 atau 01:00:00'
                                        className='w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white'
                                    />
                                </div>
                            </div>
                            <div className='grid grid-cols-2 gap-4'>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                        Tipe
                                    </label>
                                    <select
                                        value={form.type}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                type: e.target.value,
                                            })
                                        }
                                        className='w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white'
                                    >
                                        {TYPES.map((p) => (
                                            <option key={p} value={p}>
                                                {p}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                        {t("admin.field.category")}
                                    </label>
                                    <select
                                        value={form.topic}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                topic: e.target.value,
                                            })
                                        }
                                        className='w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white'
                                    >
                                        {CATEGORIES.map((c) => (
                                            <option key={c} value={c}>
                                                {c}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                    URL
                                </label>
                                <input
                                    type='url'
                                    value={form.url}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            url: e.target.value,
                                        })
                                    }
                                    placeholder='https://...'
                                    className='w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white'
                                />
                            </div>
                            <div>
                                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                    {t("admin.kajian.thumbnail_url")}
                                </label>
                                <input
                                    type='url'
                                    value={form.thumbnail_url}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            thumbnail_url: e.target.value,
                                        })
                                    }
                                    placeholder='https://...'
                                    className='w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white'
                                />
                            </div>
                            <div>
                                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                    {t("admin.field.description")}
                                </label>
                                <textarea
                                    value={form.description}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            description: e.target.value,
                                        })
                                    }
                                    rows={2}
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
                                disabled={saving || !form.title}
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
                            {t("admin.crud.delete_title", {
                                item: t("admin.kajian.study"),
                            })}
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

export default AdminStudiesPage;
