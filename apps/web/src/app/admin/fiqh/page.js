"use client";

import { adminFiqhApi } from "@/lib/api";
import { useLocale } from "@/context/Locale";
import { getLocalizedField } from "@/lib/translation";
import { useEffect, useState } from "react";
import { BsPencil, BsPlusCircle, BsTrash, BsX } from "react-icons/bs";

const CATEGORIES = [
    "thaharah",
    "sholat",
    "zakat",
    "puasa",
    "haji",
    "muamalah",
    "munakahat",
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
    category: "umum",
    title: "",
    slug: "",
    content: "",
    source: "",
    dalil: "",
};

const AdminFiqhPage = () => {
    const { t, lang } = useLocale();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [search, setSearch] = useState("");
    const [catFilter, setCatFilter] = useState("");
    const [deleteId, setDeleteId] = useState(null);

    const load = async () => {
        setLoading(true);
        try {
            const r = await adminFiqhApi.list(0, 500);
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
            category: item.category ?? "umum",
            title: getLocalizedField(item, "title", lang) || item.title || "",
            slug: item.slug ?? "",
            content:
                getLocalizedField(item, "content", lang) || item.content || "",
            source: item.source ?? "",
            dalil: item.dalil ?? "",
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
                ...form,
                title,
                slug: form.slug.trim() || slugify(title),
            };
            let res;
            if (editId) {
                res = await adminFiqhApi.update(editId, payload);
            } else {
                res = await adminFiqhApi.create(payload);
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
            const res = await adminFiqhApi.delete(deleteId);
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
            (!catFilter || i.category === catFilter) &&
            (getLocalizedField(i, "title", lang)
                .toLowerCase()
                .includes(search.toLowerCase()) ||
                getLocalizedField(i, "content", lang)
                    .toLowerCase()
                    .includes(search.toLowerCase())),
    );

    return (
        <div className='p-6'>
            <div className='flex items-center justify-between mb-6'>
                <div>
                    <h1 className='text-xl font-bold text-gray-900 dark:text-white'>
                        Fiqh
                    </h1>
                    <p className='text-sm text-gray-500 dark:text-gray-400'>
                        {items.length} {t("admin.fiqh.materials_unit")}
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className='flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors'
                >
                    <BsPlusCircle />
                    {t("admin.fiqh.add_material")}
                </button>
            </div>

            <div className='mb-4 flex flex-wrap gap-3'>
                <input
                    type='text'
                    placeholder={t("admin.crud.search_title_content")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className='w-full max-w-xs px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white'
                />
                <select
                    value={catFilter}
                    onChange={(e) => setCatFilter(e.target.value)}
                    className='px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white'
                >
                    <option value=''>{t("admin.crud.all_categories")}</option>
                    {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                            {c}
                        </option>
                    ))}
                </select>
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
                                <th className='text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300 w-28'>
                                    {t("admin.field.category")}
                                </th>
                                <th className='text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300 hidden md:table-cell'>
                                    Dalil
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
                                    <td className='px-4 py-3 text-gray-900 dark:text-white font-medium max-w-xs truncate'>
                                        {getLocalizedField(item, "title", lang)}
                                    </td>
                                    <td className='px-4 py-3'>
                                        <span className='px-2 py-0.5 bg-lime-100 dark:bg-lime-900/30 text-lime-700 dark:text-lime-400 rounded text-xs capitalize'>
                                            {item.category}
                                        </span>
                                    </td>
                                    <td className='px-4 py-3 text-gray-400 dark:text-gray-500 text-xs hidden md:table-cell max-w-xs truncate'>
                                        {item.dalil ?? "-"}
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
                                        colSpan={4}
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
                                    ? t("admin.fiqh.edit_material")
                                    : t("admin.fiqh.add_material")}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className='p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                            >
                                <BsX className='text-xl' />
                            </button>
                        </div>
                        <div className='p-5 space-y-4'>
                            <div className='grid grid-cols-2 gap-4'>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                        {t("admin.field.category")}
                                    </label>
                                    <select
                                        value={form.category}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                category: e.target.value,
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
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                        {t("admin.field.title")}
                                    </label>
                                    <input
                                        type='text'
                                        value={form.title}
                                        onChange={(e) => {
                                            const nextTitle = e.target.value;
                                            setForm({
                                                ...form,
                                                title: nextTitle,
                                                slug:
                                                    !form.slug ||
                                                    form.slug ===
                                                        slugify(form.title)
                                                        ? slugify(nextTitle)
                                                        : form.slug,
                                            });
                                        }}
                                        className='w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white'
                                    />
                                </div>
                            </div>
                            <div>
                                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                    {t("admin.field.slug")}
                                </label>
                                <input
                                    type='text'
                                    value={form.slug}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            slug: e.target.value,
                                        })
                                    }
                                    placeholder='auto dari judul'
                                    className='w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white'
                                />
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
                                    Dalil
                                </label>
                                <textarea
                                    value={form.dalil}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            dalil: e.target.value,
                                        })
                                    }
                                    rows={2}
                                    dir='rtl'
                                    placeholder='Evidence verse or hadith...'
                                    className='w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white font-arabic text-base leading-loose'
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
                                    placeholder='e.g. Fiqhus Sunnah, Sayyid Sabiq'
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
                            {t("admin.crud.delete_title").replace(
                                "{item}",
                                t("admin.fiqh.material"),
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

export default AdminFiqhPage;
