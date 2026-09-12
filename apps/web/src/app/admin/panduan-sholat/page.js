"use client";

import {
    PanelPagination,
    PanelTable,
    Td,
    Th,
    Tr,
} from "@/components/panel/DataPanel";
import { adminPanduanSholatApi, parseApiError } from "@/lib/api";
import { useLocale } from "@/context/Locale";
import { useEffect, useState } from "react";
import { BsPencil, BsPlusCircle, BsTrash, BsX } from "react-icons/bs";
import ModalShell from "@/components/ModalShell";
import SourceBadges from "@/components/SourceBadges";

const EMPTY_FORM = {
    step: 1,
    title: "",
    arabic: "",
    latin: "",
    translation: "",
    description: "",
    notes: "",
    source: "",
};

const INPUT_CLASS =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white";

const asItems = (payload) =>
    payload?.items ?? payload?.data?.items ?? payload?.data ?? payload ?? [];

export default function AdminPanduanSholatPage() {
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
    const [pageSize, setPageSize] = useState(10);

    const fb = (type, msg) =>
        window.dispatchEvent(
            new CustomEvent(type, { detail: { message: msg } }),
        );

    const load = async () => {
        setLoading(true);
        try {
            const r = await adminPanduanSholatApi.list();
            const data = await r.json();
            const nextItems = asItems(data);
            const sorted = Array.isArray(nextItems)
                ? nextItems.sort((a, b) => (a.step ?? 0) - (b.step ?? 0))
                : [];
            setItems(sorted);
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
        const nextStep =
            items.length > 0
                ? Math.max(...items.map((it) => it.step || 0)) + 1
                : 1;
        setForm({ ...EMPTY_FORM, step: nextStep });
        setShowModal(true);
    };

    const openEdit = (item) => {
        setEditId(item.id ?? item._id);
        setForm({
            step: item.step ?? 1,
            title: item.title ?? "",
            arabic: item.arabic ?? "",
            latin: item.latin ?? item.transliteration ?? "",
            translation: item.translation ?? item.translation_text ?? "",
            description: item.description ?? "",
            notes: item.notes ?? "",
            source: item.source ?? "",
        });
        setShowModal(true);
    };

    const save = async () => {
        setSaving(true);
        try {
            const payload = {
                ...form,
                step: Number(form.step) || 1,
            };
            let res;
            if (editId) {
                res = await adminPanduanSholatApi.update(editId, payload);
            } else {
                res = await adminPanduanSholatApi.create(payload);
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
            const res = await adminPanduanSholatApi.delete(id);
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
        return (
            String(item.step).includes(q) ||
            item.title?.toLowerCase().includes(q) ||
            item.description?.toLowerCase().includes(q) ||
            item.source?.toLowerCase().includes(q)
        );
    });

    const totalPages = Math.ceil(filtered.length / pageSize) || 1;
    const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

    return (
        <div className='p-6'>
            <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6'>
                <div>
                    <h1 className='text-xl font-bold text-gray-900 dark:text-white'>
                        Panduan Sholat
                    </h1>
                    <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                        Kelola langkah dan rukun panduan tata cara sholat
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className='inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-emerald-700 transition'
                >
                    <BsPlusCircle /> Tambah Langkah
                </button>
            </div>

            <div className='mb-4'>
                <input
                    type='text'
                    placeholder='Cari langkah, judul, keterangan, atau dalil...'
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                    }}
                    className='w-full max-w-sm rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white'
                />
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
                    {search
                        ? t("admin.empty.search")
                        : "Belum ada langkah panduan sholat."}
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
                                        <span className='font-bold text-emerald-700 dark:text-emerald-400'>
                                            #{item.step}
                                        </span>{" "}
                                        {item.title}
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
                                {item.arabic && (
                                    <div
                                        dir='rtl'
                                        className='font-arabic text-sm text-gray-800 dark:text-gray-200 mb-1'
                                    >
                                        {item.arabic}
                                    </div>
                                )}
                                {item.latin && (
                                    <div className='text-xs italic text-gray-500 dark:text-gray-400 mb-2'>
                                        {item.latin}
                                    </div>
                                )}
                                <p className='text-xs text-gray-600 dark:text-gray-300 mb-2'>
                                    {item.translation ||
                                        item.description ||
                                        "—"}
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
                                    <Th className='w-16'>Step</Th>
                                    <Th>Judul</Th>
                                    <Th>Lafaz Arab / Latin</Th>
                                    <Th>Terjemahan / Keterangan</Th>
                                    <Th>Sumber / Rujukan</Th>
                                    <Th className='text-right w-24'>Aksi</Th>
                                </>
                            }
                        >
                            {paginated.map((item) => (
                                <Tr key={item.id}>
                                    <Td className='font-bold text-emerald-700 dark:text-emerald-400'>
                                        #{item.step}
                                    </Td>
                                    <Td className='font-medium text-gray-900 dark:text-white'>
                                        {item.title}
                                    </Td>
                                    <Td className='max-w-xs'>
                                        {item.arabic && (
                                            <div
                                                dir='rtl'
                                                className='font-arabic text-sm text-gray-800 dark:text-gray-200 line-clamp-1'
                                            >
                                                {item.arabic}
                                            </div>
                                        )}
                                        {item.latin && (
                                            <div className='text-xs italic text-gray-500 dark:text-gray-400 line-clamp-1'>
                                                {item.latin}
                                            </div>
                                        )}
                                    </Td>
                                    <Td className='max-w-xs text-xs text-gray-600 dark:text-gray-300'>
                                        <div className='line-clamp-2'>
                                            {item.translation ||
                                                item.description ||
                                                "—"}
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
                        {editId
                            ? "Edit Langkah Panduan Sholat"
                            : "Tambah Langkah Panduan Sholat"}
                    </h2>
                    <button
                        onClick={() => setShowModal(false)}
                        className='p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                    >
                        <BsX className='text-xl' />
                    </button>
                </div>
                <div className='space-y-4 p-4'>
                    <div className='grid grid-cols-1 sm:grid-cols-4 gap-4'>
                        <div>
                            <label className='block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1'>
                                Urutan Langkah (Step)
                            </label>
                            <input
                                type='number'
                                value={form.step}
                                onChange={(e) =>
                                    setForm({ ...form, step: e.target.value })
                                }
                                className={INPUT_CLASS}
                                min='1'
                                required
                            />
                        </div>
                        <div className='sm:col-span-3'>
                            <label className='block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1'>
                                Judul Rukun / Gerakan
                            </label>
                            <input
                                type='text'
                                value={form.title}
                                onChange={(e) =>
                                    setForm({ ...form, title: e.target.value })
                                }
                                className={INPUT_CLASS}
                                placeholder='Contoh: Takbiratul Ihram, Ruku...'
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className='block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1'>
                            Lafaz Arab (Opsional)
                        </label>
                        <textarea
                            dir='rtl'
                            rows='2'
                            value={form.arabic}
                            onChange={(e) =>
                                setForm({ ...form, arabic: e.target.value })
                            }
                            className={`${INPUT_CLASS} font-arabic text-base`}
                            placeholder='Teks bacaan Arab...'
                        />
                    </div>

                    <div>
                        <label className='block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1'>
                            Transliterasi Latin (Opsional)
                        </label>
                        <input
                            type='text'
                            value={form.latin}
                            onChange={(e) =>
                                setForm({ ...form, latin: e.target.value })
                            }
                            className={INPUT_CLASS}
                            placeholder='Bacaan latin...'
                        />
                    </div>

                    <div>
                        <label className='block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1'>
                            Arti / Terjemahan Bacaan
                        </label>
                        <textarea
                            rows='2'
                            value={form.translation}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    translation: e.target.value,
                                })
                            }
                            className={INPUT_CLASS}
                            placeholder='Terjemahan bacaan...'
                        />
                    </div>

                    <div>
                        <label className='block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1'>
                            Deskripsi Tata Cara Gerakan
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
                            placeholder='Keterangan cara pelaksanaan rukun sholat...'
                        />
                    </div>

                    <div>
                        <label className='block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1'>
                            Catatan Fiqh / Faedah
                        </label>
                        <textarea
                            rows='2'
                            value={form.notes}
                            onChange={(e) =>
                                setForm({ ...form, notes: e.target.value })
                            }
                            className={INPUT_CLASS}
                            placeholder='Catatan khusus dari para ulama...'
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
                            placeholder='Contoh: HR. Bukhari No. 1; Al-Mughni'
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
                            disabled={saving || !form.title}
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
                        Hapus Langkah Panduan Sholat
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
                        Apakah Anda yakin ingin menghapus langkah panduan sholat
                        ini? Tindakan ini tidak dapat dibatalkan.
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
