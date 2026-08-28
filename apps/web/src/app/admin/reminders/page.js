"use client";

import { adminReminderApi } from "@/lib/api";
import { useLocale } from "@/context/Locale";
import { useEffect, useState } from "react";
import { BsPencil, BsPlusCircle, BsTrash, BsX } from "react-icons/bs";

const TYPES = [
    { value: "ulama", label: "Nasihat Ulama" },
    { value: "quote", label: "Quote" },
    { value: "advice", label: "Pengingat" },
];

const EMPTY_FORM = {
    type: "ulama",
    title: "",
    text: "",
    author: "",
    source: "",
    lang: "idn",
    is_active: true,
    display_order: 0,
};

const INPUT_CLASS =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white";

const asItems = (payload) =>
    payload?.items ?? payload?.data?.items ?? payload?.data ?? payload ?? [];

const AdminRemindersPage = () => {
    const { t } = useLocale();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [search, setSearch] = useState("");
    const [deleteId, setDeleteId] = useState(null);

    const fb = (type, msg) =>
        window.dispatchEvent(
            new CustomEvent(type, { detail: { message: msg } }),
        );

    const load = async () => {
        setLoading(true);
        try {
            const r = await adminReminderApi.list(0, 500);
            const data = await r.json();
            const nextItems = asItems(data);
            setItems(Array.isArray(nextItems) ? nextItems : []);
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
            type: item.type ?? "ulama",
            title: item.title ?? "",
            text: item.text ?? "",
            author: item.author ?? "",
            source: item.source ?? "",
            lang: item.lang ?? "idn",
            is_active: item.is_active !== false,
            display_order: item.display_order ?? 0,
        });
        setShowModal(true);
    };

    const save = async () => {
        setSaving(true);
        try {
            const payload = {
                ...form,
                display_order: Number(form.display_order) || 0,
            };
            const res = editId
                ? await adminReminderApi.update(editId, payload)
                : await adminReminderApi.create(payload);
            if (!res.ok) throw new Error("Gagal menyimpan reminder.");
            setShowModal(false);
            await load();
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
            const res = await adminReminderApi.delete(deleteId);
            if (!res.ok) throw new Error("Gagal menghapus reminder.");
            setDeleteId(null);
            await load();
            fb("admin:success", t("admin.crud.delete_success"));
        } catch (err) {
            fb("admin:mutation-error", err.message);
        }
    };

    const filtered = items.filter((item) => {
        const q = search.toLowerCase();
        return [item.title, item.text, item.author, item.source, item.type]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(q));
    });

    return (
        <div className='p-6'>
            <div className='mb-6 flex items-center justify-between gap-4'>
                <div>
                    <h1 className='text-xl font-bold text-gray-900 dark:text-white'>
                        Reminder Carousel
                    </h1>
                    <p className='text-sm text-gray-500 dark:text-gray-400'>
                        {items.length} konten pengingat
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className='flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-600'
                >
                    <BsPlusCircle />
                    Tambah Reminder
                </button>
            </div>

            <div className='mb-4'>
                <input
                    type='text'
                    placeholder='Cari judul, isi, ulama, atau sumber'
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className='w-full max-w-sm rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white'
                />
            </div>

            {loading ? (
                <p className='text-sm text-gray-500'>{t("common.loading")}</p>
            ) : (
                <div className='overflow-hidden rounded-xl border border-gray-100 bg-white dark:border-slate-700 dark:bg-slate-800'>
                    <div className='overflow-x-auto'>
                        <table className='w-full text-sm min-w-[640px]'>
                            <thead className='bg-gray-50 dark:bg-slate-700'>
                                <tr>
                                    <th className='px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300'>
                                        Judul
                                    </th>
                                    <th className='hidden px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300 md:table-cell'>
                                        Ulama / Author
                                    </th>
                                    <th className='px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300'>
                                        Tipe
                                    </th>
                                    <th className='hidden px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300 lg:table-cell'>
                                        Status
                                    </th>
                                    <th className='px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300'>
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className='divide-y divide-gray-100 dark:divide-slate-700'>
                                {filtered.map((item) => (
                                    <tr
                                        key={item.id ?? item._id}
                                        className='hover:bg-gray-50 dark:hover:bg-slate-700'
                                    >
                                        <td className='px-4 py-3'>
                                            <p className='font-medium text-gray-900 dark:text-white'>
                                                {item.title}
                                            </p>
                                            <p className='mt-1 line-clamp-1 text-xs text-gray-500 dark:text-gray-400'>
                                                {item.text}
                                            </p>
                                        </td>
                                        <td className='hidden px-4 py-3 text-gray-600 dark:text-gray-300 md:table-cell'>
                                            <p>{item.author || "-"}</p>
                                            <p className='text-xs text-gray-400'>
                                                {item.source || "-"}
                                            </p>
                                        </td>
                                        <td className='px-4 py-3'>
                                            <span className='rounded bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'>
                                                {item.type}
                                            </span>
                                        </td>
                                        <td className='hidden px-4 py-3 lg:table-cell'>
                                            <span
                                                className={`rounded px-2 py-0.5 text-xs ${
                                                    item.is_active
                                                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                                                        : "bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-gray-400"
                                                }`}
                                            >
                                                {item.is_active
                                                    ? "Aktif"
                                                    : "Nonaktif"}
                                            </span>
                                        </td>
                                        <td className='px-4 py-3'>
                                            <div className='flex justify-end gap-2'>
                                                <button
                                                    onClick={() => openEdit(item)}
                                                    aria-label={t("common.edit")}
                                                    title={t("common.edit")}
                                                    className='rounded p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'
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
                                                    className='rounded p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
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
                </div>
            )}

            {showModal && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
                    <div className='max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white dark:bg-slate-800'>
                        <div className='flex items-center justify-between border-b border-gray-100 p-5 dark:border-slate-700'>
                            <h2 className='font-bold text-gray-900 dark:text-white'>
                                {editId ? "Edit Reminder" : "Tambah Reminder"}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className='p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                            >
                                <BsX className='text-xl' />
                            </button>
                        </div>

                        <div className='space-y-4 p-5'>
                            <div className='grid gap-4 md:grid-cols-2'>
                                <Field label='Judul'>
                                    <input
                                        type='text'
                                        value={form.title}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                title: e.target.value,
                                            })
                                        }
                                        className={INPUT_CLASS}
                                    />
                                </Field>
                                <Field label='Tipe'>
                                    <select
                                        value={form.type}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                type: e.target.value,
                                            })
                                        }
                                        className={INPUT_CLASS}
                                    >
                                        {TYPES.map((type) => (
                                            <option
                                                key={type.value}
                                                value={type.value}
                                            >
                                                {type.label}
                                            </option>
                                        ))}
                                    </select>
                                </Field>
                            </div>

                            <Field label='Isi pengingat'>
                                <textarea
                                    value={form.text}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            text: e.target.value,
                                        })
                                    }
                                    rows={5}
                                    className={INPUT_CLASS}
                                />
                            </Field>

                            <div className='grid gap-4 md:grid-cols-2'>
                                <Field label='Nama ulama / author'>
                                    <input
                                        type='text'
                                        value={form.author}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                author: e.target.value,
                                            })
                                        }
                                        className={INPUT_CLASS}
                                    />
                                </Field>
                                <Field label='Sumber'>
                                    <input
                                        type='text'
                                        value={form.source}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                source: e.target.value,
                                            })
                                        }
                                        placeholder="Al-Fawa'id, Riyadhus Shalihin, dll"
                                        className={INPUT_CLASS}
                                    />
                                </Field>
                            </div>

                            <div className='grid gap-4 md:grid-cols-3'>
                                <Field label='Bahasa'>
                                    <select
                                        value={form.lang}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                lang: e.target.value,
                                            })
                                        }
                                        className={INPUT_CLASS}
                                    >
                                        <option value='idn'>Indonesia</option>
                                        <option value='en'>English</option>
                                        <option value='ar'>Arab</option>
                                    </select>
                                </Field>
                                <Field label='Urutan'>
                                    <input
                                        type='number'
                                        value={form.display_order}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                display_order: e.target.value,
                                            })
                                        }
                                        className={INPUT_CLASS}
                                    />
                                </Field>
                                <label className='flex items-center gap-2 pt-7 text-sm text-gray-700 dark:text-gray-300'>
                                    <input
                                        type='checkbox'
                                        checked={form.is_active}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                is_active: e.target.checked,
                                            })
                                        }
                                        className='h-4 w-4 rounded border-gray-300 text-emerald-600'
                                    />
                                    Aktif ditampilkan
                                </label>
                            </div>
                        </div>

                        <div className='flex gap-3 border-t border-gray-100 p-5 dark:border-slate-700'>
                            <button
                                onClick={() => setShowModal(false)}
                                className='flex-1 rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:text-gray-300 dark:hover:bg-slate-700'
                            >
                                {t("common.cancel")}
                            </button>
                            <button
                                onClick={save}
                                disabled={saving || !form.title || !form.text}
                                className='flex-1 rounded-lg bg-emerald-700 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50'
                            >
                                {saving ? t("common.saving") : t("common.save")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {deleteId && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
                    <div className='w-full max-w-sm rounded-2xl bg-white p-6 dark:bg-slate-800'>
                        <h2 className='mb-2 font-bold text-gray-900 dark:text-white'>
                            Hapus Reminder
                        </h2>
                        <p className='mb-5 text-sm text-gray-500 dark:text-gray-400'>
                            Data yang dihapus tidak bisa dikembalikan.
                        </p>
                        <div className='flex gap-3'>
                            <button
                                onClick={() => setDeleteId(null)}
                                className='flex-1 rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-700 dark:border-slate-600 dark:text-gray-300'
                            >
                                {t("common.cancel")}
                            </button>
                            <button
                                onClick={confirmDelete}
                                className='flex-1 rounded-lg bg-red-600 py-2 text-sm font-medium text-white hover:bg-red-500'
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

const Field = ({ label, children }) => (
    <label className='block'>
        <span className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
            {label}
        </span>
        {children}
    </label>
);

export default AdminRemindersPage;
