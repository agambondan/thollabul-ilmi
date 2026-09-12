"use client";

import {
    PanelPagination,
    PanelTable,
    Td,
    Th,
    Tr,
} from "@/components/panel/DataPanel";
import { adminAmalanApi, parseApiError } from "@/lib/api";
import { useLocale } from "@/context/Locale";
import { useEffect, useState } from "react";
import { BsPencil, BsPlusCircle, BsTrash, BsX } from "react-icons/bs";
import ModalShell from "@/components/ModalShell";
import SourceBadges from "@/components/SourceBadges";

const EMPTY_FORM = {
    name: "",
    category: "sholat",
    description: "",
    source: "",
    is_active: true,
};

const CATEGORIES = [
    { value: "sholat", label: "Sholat Sunnah" },
    { value: "puasa", label: "Puasa Sunnah" },
    { value: "dzikir", label: "Dzikir & Tilawah" },
    { value: "sedekah", label: "Sedekah & Infaq" },
    { value: "lainnya", label: "Amalan Lainnya" },
];

const INPUT_CLASS =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white";

const asItems = (payload) =>
    payload?.items ?? payload?.data?.items ?? payload?.data ?? payload ?? [];

export default function AdminAmalanPage() {
    const { t } = useLocale();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [deleteId, setDeleteId] = useState(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const fb = (type, msg) =>
        window.dispatchEvent(
            new CustomEvent(type, { detail: { message: msg } }),
        );

    const load = async () => {
        setLoading(true);
        try {
            const r = await adminAmalanApi.list();
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
            name: item.name ?? "",
            category: item.category ?? "sholat",
            description: item.description ?? "",
            source: item.source ?? "",
            is_active: item.is_active !== false,
        });
        setShowModal(true);
    };

    const save = async () => {
        setSaving(true);
        try {
            let res;
            if (editId) {
                res = await adminAmalanApi.update(editId, form);
            } else {
                res = await adminAmalanApi.create(form);
            }
            if (!res.ok)
                throw new Error(
                    await parseApiError(res, t("admin.error.save")),
                );
            setShowModal(false);
            load();
            fb("admin:success", t("admin.crud.save_success"));
        } catch (err) {
            fb("admin:mutation-error", err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            const res = await adminAmalanApi.delete(id);
            if (!res.ok)
                throw new Error(
                    await parseApiError(res, t("admin.error.delete")),
                );
            setDeleteId(null);
            load();
            fb("admin:success", t("admin.crud.delete_success"));
        } catch (err) {
            fb("admin:mutation-error", err.message);
        }
    };

    const filtered = items.filter((item) => {
        const matchesCategory =
            categoryFilter === "all" || item.category === categoryFilter;
        const q = search.toLowerCase();
        const matchesSearch =
            !q ||
            item.name?.toLowerCase().includes(q) ||
            item.description?.toLowerCase().includes(q) ||
            item.source?.toLowerCase().includes(q);
        return matchesCategory && matchesSearch;
    });

    const totalPages = Math.ceil(filtered.length / pageSize) || 1;
    const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

    return (
        <div className='p-6'>
            <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6'>
                <div>
                    <h1 className='text-xl font-bold text-gray-900 dark:text-white'>
                        Master Amalan
                    </h1>
                    <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                        Kelola katalog daftar amalan sunnah harian pengguna
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className='inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-emerald-700 transition'
                >
                    <BsPlusCircle /> Tambah Amalan
                </button>
            </div>

            <div className='flex flex-wrap gap-3 mb-4'>
                <input
                    type='text'
                    placeholder='Cari nama amalan, deskripsi, atau rujukan...'
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                    }}
                    className='w-full max-w-sm rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white'
                />
                <select
                    value={categoryFilter}
                    onChange={(e) => {
                        setCategoryFilter(e.target.value);
                        setPage(1);
                    }}
                    className='rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white'
                >
                    <option value='all'>Semua Kategori</option>
                    {CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>
                            {c.label}
                        </option>
                    ))}
                </select>
            </div>

            <PanelPagination
                page={page}
                pageCount={totalPages}
                pageSize={pageSize}
                total={filtered.length}
                onChange={setPage}
                onPageSizeChange={(sz) => {
                    setPageSize(sz);
                    setPage(1);
                }}
            />

            {loading ? (
                <p className='text-center text-sm text-gray-500 dark:text-gray-400 py-6'>
                    Memuat data…
                </p>
            ) : paginated.length === 0 ? (
                <p className='text-center text-sm text-gray-500 dark:text-gray-400 py-6'>
                    {search || categoryFilter !== "all"
                        ? t("admin.empty.search")
                        : "Belum ada data master amalan."}
                </p>
            ) : (
                <>
                    {/* Mobile: stacked cards so every field is reachable without
                        horizontal scrolling. */}
                    <div className='space-y-3 md:hidden'>
                        {paginated.map((item) => (
                            <div
                                key={item.id}
                                className='rounded-xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-4'
                            >
                                <div className='flex items-start justify-between gap-2 mb-2'>
                                    <p className='font-medium text-gray-900 dark:text-white'>
                                        {item.name}
                                    </p>
                                    <div className='flex items-center gap-1 shrink-0'>
                                        <button
                                            onClick={() => openEdit(item)}
                                            className='p-1 text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400'
                                            aria-label='Edit'
                                        >
                                            <BsPencil />
                                        </button>
                                        <button
                                            onClick={() => setDeleteId(item.id)}
                                            className='p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400'
                                            aria-label='Hapus'
                                        >
                                            <BsTrash />
                                        </button>
                                    </div>
                                </div>
                                <div className='flex items-center gap-2 mb-2'>
                                    <span className='px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'>
                                        {item.category}
                                    </span>
                                    <span
                                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                            item.is_active !== false
                                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                                                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                                        }`}
                                    >
                                        {item.is_active !== false
                                            ? "Aktif"
                                            : "Nonaktif"}
                                    </span>
                                </div>
                                <p className='text-xs text-gray-600 dark:text-gray-300 mb-2'>
                                    {item.description || "—"}
                                </p>
                                <div className='text-xs'>
                                    {item.source ? (
                                        <SourceBadges source={item.source} />
                                    ) : (
                                        "—"
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop: full table. */}
                    <div className='hidden md:block'>
                        <PanelTable
                            head={
                                <>
                                    <Th>Nama Amalan</Th>
                                    <Th>Kategori</Th>
                                    <Th>Deskripsi</Th>
                                    <Th>Sumber / Rujukan</Th>
                                    <Th className='w-20 text-center'>Status</Th>
                                    <Th className='text-right w-24'>Aksi</Th>
                                </>
                            }
                        >
                            {paginated.map((item) => (
                                <Tr key={item.id}>
                                    <Td className='font-medium text-gray-900 dark:text-white'>
                                        {item.name}
                                    </Td>
                                    <Td>
                                        <span className='px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'>
                                            {item.category}
                                        </span>
                                    </Td>
                                    <Td className='max-w-xs text-xs text-gray-600 dark:text-gray-300'>
                                        <div className='line-clamp-2'>
                                            {item.description || "—"}
                                        </div>
                                    </Td>
                                    <Td className='text-xs'>
                                        {item.source ? (
                                            <SourceBadges
                                                source={item.source}
                                            />
                                        ) : (
                                            "—"
                                        )}
                                    </Td>
                                    <Td className='text-center'>
                                        <span
                                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                item.is_active !== false
                                                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                                                    : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                                            }`}
                                        >
                                            {item.is_active !== false
                                                ? "Aktif"
                                                : "Nonaktif"}
                                        </span>
                                    </Td>
                                    <Td className='text-right'>
                                        <div className='flex items-center justify-end gap-2'>
                                            <button
                                                onClick={() => openEdit(item)}
                                                className='p-1 text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400'
                                                aria-label='Edit'
                                            >
                                                <BsPencil />
                                            </button>
                                            <button
                                                onClick={() =>
                                                    setDeleteId(item.id)
                                                }
                                                className='p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400'
                                                aria-label='Hapus'
                                            >
                                                <BsTrash />
                                            </button>
                                        </div>
                                    </Td>
                                </Tr>
                            ))}
                        </PanelTable>
                    </div>
                </>
            )}

            {/* Create/Edit Modal */}
            <ModalShell
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                panelClassName='bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto'
            >
                <div className='flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-700'>
                    <h2 className='font-bold text-gray-900 dark:text-white'>
                        {editId ? "Edit Master Amalan" : "Tambah Master Amalan"}
                    </h2>
                    <button
                        onClick={() => setShowModal(false)}
                        className='p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                    >
                        <BsX className='text-xl' />
                    </button>
                </div>
                <div className='space-y-4 p-4'>
                    <div>
                        <label className='block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1'>
                            Nama Amalan
                        </label>
                        <input
                            type='text'
                            value={form.name}
                            onChange={(e) =>
                                setForm({ ...form, name: e.target.value })
                            }
                            className={INPUT_CLASS}
                            placeholder='Contoh: Sholat Dhuha, Sedekah Subuh'
                            required
                        />
                    </div>

                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                        <div>
                            <label className='block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1'>
                                Kategori
                            </label>
                            <select
                                value={form.category}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        category: e.target.value,
                                    })
                                }
                                className={INPUT_CLASS}
                            >
                                {CATEGORIES.map((c) => (
                                    <option key={c.value} value={c.value}>
                                        {c.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className='flex items-center pt-5'>
                            <label className='inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer'>
                                <input
                                    type='checkbox'
                                    checked={form.is_active}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            is_active: e.target.checked,
                                        })
                                    }
                                    className='rounded border-gray-300 text-emerald-600 focus:ring-emerald-500'
                                />
                                Status Aktif (Tampil di checklist harian)
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className='block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1'>
                            Deskripsi / Keutamaan
                        </label>
                        <textarea
                            rows='3'
                            value={form.description}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    description: e.target.value,
                                })
                            }
                            className={INPUT_CLASS}
                            placeholder='Keutamaan atau tata cara amalan...'
                        />
                    </div>

                    <div>
                        <label className='block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1'>
                            Sumber Dalil / Rujukan
                        </label>
                        <input
                            type='text'
                            value={form.source}
                            onChange={(e) =>
                                setForm({ ...form, source: e.target.value })
                            }
                            className={INPUT_CLASS}
                            placeholder='Contoh: HR. Muslim No. 720; HR. Bukhari'
                        />
                    </div>

                    <div className='flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-slate-700'>
                        <button
                            type='button'
                            onClick={() => setShowModal(false)}
                            className='rounded-lg px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                        >
                            Batal
                        </button>
                        <button
                            type='button'
                            onClick={save}
                            disabled={saving || !form.name}
                            className='rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50'
                        >
                            {saving ? "Menyimpan..." : "Simpan"}
                        </button>
                    </div>
                </div>
            </ModalShell>

            {/* Delete Confirmation Modal */}
            <ModalShell
                isOpen={deleteId !== null}
                onClose={() => setDeleteId(null)}
                panelClassName='bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md'
            >
                <div className='flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-700'>
                    <h2 className='font-bold text-gray-900 dark:text-white'>
                        Hapus Master Amalan
                    </h2>
                    <button
                        onClick={() => setDeleteId(null)}
                        className='p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                    >
                        <BsX className='text-xl' />
                    </button>
                </div>
                <div className='p-4 space-y-4'>
                    <p className='text-sm text-gray-600 dark:text-gray-300'>
                        Apakah Anda yakin ingin menghapus amalan ini? Riwayat
                        checklist harian pengguna yang sudah tercatat mungkin
                        terpengaruh.
                    </p>
                    <div className='flex justify-end gap-2'>
                        <button
                            onClick={() => setDeleteId(null)}
                            className='rounded-lg px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                        >
                            Batal
                        </button>
                        <button
                            onClick={() => handleDelete(deleteId)}
                            className='rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700'
                        >
                            Hapus
                        </button>
                    </div>
                </div>
            </ModalShell>
        </div>
    );
}
