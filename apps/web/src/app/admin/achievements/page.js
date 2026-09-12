"use client";

import {
    applySort,
    PanelFilterSelect,
    PanelPagination,
    PanelTable,
    Td,
    Th,
    toggleSort,
    Tr,
} from "@/components/panel/DataPanel";
import { adminAchievementApi, parseApiError } from "@/lib/api";
import { useLocale } from "@/context/Locale";
import { useEffect, useState } from "react";
import { BsPencil, BsPlusCircle, BsTrash, BsX } from "react-icons/bs";
import ModalShell from "@/components/ModalShell";

const EMPTY_FORM = {
    code: "",
    name: "",
    name_en: "",
    description: "",
    desc_en: "",
    icon: "🏆",
    category: "general",
    threshold: 1,
};

const CATEGORIES = [
    { value: "streak", label: "Streak (Keaktifan)" },
    { value: "hafalan", label: "Hafalan" },
    { value: "bookmark", label: "Bookmark" },
    { value: "reading", label: "Baca Quran" },
    { value: "amalan", label: "Amalan Sunnah" },
    { value: "general", label: "Umum" },
];

const INPUT_CLASS =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white";

const asItems = (payload) =>
    payload?.items ?? payload?.data?.items ?? payload?.data ?? payload ?? [];

export default function AdminAchievementsPage() {
    const { t } = useLocale();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [sort, setSort] = useState(null);
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
            const r = await adminAchievementApi.list();
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
            code: item.code ?? "",
            name: item.name ?? "",
            name_en: item.name_en ?? "",
            description: item.description ?? "",
            desc_en: item.desc_en ?? "",
            icon: item.icon ?? "🏆",
            category: item.category ?? "general",
            threshold: item.threshold ?? 1,
        });
        setShowModal(true);
    };

    const save = async () => {
        setSaving(true);
        try {
            const payload = {
                ...form,
                threshold: Number(form.threshold) || 1,
            };
            let res;
            if (editId) {
                res = await adminAchievementApi.update(editId, payload);
            } else {
                res = await adminAchievementApi.create(payload);
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
            const res = await adminAchievementApi.delete(id);
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
        const q = search.toLowerCase();
        const matchesSearch =
            item.code?.toLowerCase().includes(q) ||
            item.name?.toLowerCase().includes(q) ||
            item.name_en?.toLowerCase().includes(q) ||
            item.category?.toLowerCase().includes(q) ||
            item.description?.toLowerCase().includes(q);
        const matchesCategory =
            !categoryFilter || item.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const sorted = applySort(filtered, sort, {
        name: (a, b) => (a.name ?? "").localeCompare(b.name ?? ""),
        category: (a, b) => (a.category ?? "").localeCompare(b.category ?? ""),
        threshold: (a, b) => (a.threshold ?? 0) - (b.threshold ?? 0),
    });

    const totalPages = Math.ceil(sorted.length / pageSize) || 1;
    const paginated = sorted.slice((page - 1) * pageSize, page * pageSize);

    return (
        <div className='p-6'>
            <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6'>
                <div>
                    <h1 className='text-xl font-bold text-gray-900 dark:text-white'>
                        Achievements
                    </h1>
                    <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                        Kelola badge pencapaian, kriteria target, dan poin
                        motivasi pengguna
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className='inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-emerald-700 transition'
                >
                    <BsPlusCircle /> Tambah Achievement
                </button>
            </div>

            <div className='mb-4'>
                <input
                    type='text'
                    placeholder='Cari kode, nama badge, kategori, atau deskripsi...'
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                    }}
                    className='w-full max-w-sm rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white'
                />
                <PanelFilterSelect
                    label='Kategori'
                    value={categoryFilter}
                    onChange={(value) => {
                        setCategoryFilter(value);
                        setPage(1);
                    }}
                    options={CATEGORIES}
                />
            </div>

            <PanelPagination
                page={page}
                pageCount={totalPages}
                pageSize={pageSize}
                total={sorted.length}
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
                    {search
                        ? t("admin.empty.search")
                        : "Belum ada master achievement."}
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
                                    <div className='flex items-center gap-2'>
                                        <span className='text-2xl'>
                                            {item.icon || "🏆"}
                                        </span>
                                        <div>
                                            <p className='font-medium text-gray-900 dark:text-white'>
                                                {item.name}
                                            </p>
                                            {item.name_en && (
                                                <p className='text-xs text-gray-400'>
                                                    {item.name_en}
                                                </p>
                                            )}
                                        </div>
                                    </div>
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
                                    <span className='font-mono text-xs text-emerald-700 dark:text-emerald-400 font-bold'>
                                        {item.code}
                                    </span>
                                    <span className='px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'>
                                        {item.category || "general"}
                                    </span>
                                    <span className='text-xs font-bold text-gray-800 dark:text-gray-200'>
                                        Target: {item.threshold}
                                    </span>
                                </div>
                                <p className='text-xs text-gray-600 dark:text-gray-300'>
                                    {item.description || item.desc_en || "—"}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Desktop: full table. */}
                    <div className='hidden md:block'>
                        <PanelTable
                            head={
                                <>
                                    <Th className='w-14 text-center'>Icon</Th>
                                    <Th>Kode</Th>
                                    <Th
                                        sortKey='name'
                                        activeSort={sort}
                                        onSort={(key) =>
                                            setSort((s) => toggleSort(s, key))
                                        }
                                    >
                                        Nama (ID / EN)
                                    </Th>
                                    <Th
                                        sortKey='category'
                                        activeSort={sort}
                                        onSort={(key) =>
                                            setSort((s) => toggleSort(s, key))
                                        }
                                    >
                                        Kategori
                                    </Th>
                                    <Th
                                        className='w-20 text-center'
                                        sortKey='threshold'
                                        activeSort={sort}
                                        onSort={(key) =>
                                            setSort((s) => toggleSort(s, key))
                                        }
                                    >
                                        Target
                                    </Th>
                                    <Th>Deskripsi</Th>
                                    <Th className='text-right w-24'>Aksi</Th>
                                </>
                            }
                        >
                            {paginated.map((item) => (
                                <Tr key={item.id}>
                                    <Td className='text-center text-2xl'>
                                        {item.icon || "🏆"}
                                    </Td>
                                    <Td className='font-mono text-xs text-emerald-700 dark:text-emerald-400 font-bold'>
                                        {item.code}
                                    </Td>
                                    <Td className='font-medium text-gray-900 dark:text-white'>
                                        <div>{item.name}</div>
                                        {item.name_en && (
                                            <div className='text-xs text-gray-400'>
                                                {item.name_en}
                                            </div>
                                        )}
                                    </Td>
                                    <Td>
                                        <span className='px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'>
                                            {item.category || "general"}
                                        </span>
                                    </Td>
                                    <Td className='text-center font-bold text-gray-800 dark:text-gray-200'>
                                        {item.threshold}
                                    </Td>
                                    <Td className='max-w-xs text-xs text-gray-600 dark:text-gray-300'>
                                        <div className='line-clamp-2'>
                                            {item.description ||
                                                item.desc_en ||
                                                "—"}
                                        </div>
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
                        {editId ? "Edit Achievement" : "Tambah Achievement"}
                    </h2>
                    <button
                        onClick={() => setShowModal(false)}
                        className='p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                    >
                        <BsX className='text-xl' />
                    </button>
                </div>
                <div className='space-y-4 p-4'>
                    <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
                        <div className='sm:col-span-2'>
                            <label className='block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1'>
                                Kode Unik (Code)
                            </label>
                            <input
                                type='text'
                                value={form.code}
                                onChange={(e) =>
                                    setForm({ ...form, code: e.target.value })
                                }
                                className={INPUT_CLASS}
                                placeholder='Contoh: streak_7, hafalan_10'
                                required
                            />
                        </div>
                        <div>
                            <label className='block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1'>
                                Icon (Emoji / Symbol)
                            </label>
                            <input
                                type='text'
                                value={form.icon}
                                onChange={(e) =>
                                    setForm({ ...form, icon: e.target.value })
                                }
                                className={INPUT_CLASS}
                                placeholder='🏆, 🔖, 🌙'
                            />
                        </div>
                    </div>

                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                        <div>
                            <label className='block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1'>
                                Nama Badge (Indonesia)
                            </label>
                            <input
                                type='text'
                                value={form.name}
                                onChange={(e) =>
                                    setForm({ ...form, name: e.target.value })
                                }
                                className={INPUT_CLASS}
                                placeholder='Contoh: Pejuang Subuh'
                                required
                            />
                        </div>
                        <div>
                            <label className='block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1'>
                                Nama Badge (English)
                            </label>
                            <input
                                type='text'
                                value={form.name_en}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        name_en: e.target.value,
                                    })
                                }
                                className={INPUT_CLASS}
                                placeholder='Contoh: Fajr Warrior'
                            />
                        </div>
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
                        <div>
                            <label className='block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1'>
                                Nilai Target (Threshold)
                            </label>
                            <input
                                type='number'
                                value={form.threshold}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        threshold: e.target.value,
                                    })
                                }
                                className={INPUT_CLASS}
                                min='1'
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className='block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1'>
                            Deskripsi (Indonesia)
                        </label>
                        <textarea
                            rows='2'
                            value={form.description}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    description: e.target.value,
                                })
                            }
                            className={INPUT_CLASS}
                            placeholder='Penjelasan cara mendapatkan badge...'
                        />
                    </div>

                    <div>
                        <label className='block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1'>
                            Deskripsi (English)
                        </label>
                        <textarea
                            rows='2'
                            value={form.desc_en}
                            onChange={(e) =>
                                setForm({ ...form, desc_en: e.target.value })
                            }
                            className={INPUT_CLASS}
                            placeholder='English description...'
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
                            disabled={saving || !form.code || !form.name}
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
                        Hapus Achievement
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
                        Apakah Anda yakin ingin menghapus achievement ini?
                        Riwayat perolehan badge pengguna yang terhubung mungkin
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
