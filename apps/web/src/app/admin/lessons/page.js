"use client";

import {
    applySort,
    PanelPagination,
    PanelTable,
    Td,
    Th,
    toggleSort,
    Tr,
} from "@/components/panel/DataPanel";
import { useLocale } from "@/context/Locale";
import { adminLibraryApi, adminLessonsApi, authFetch, parseApiError } from "@/lib/api";
import { useEffect, useState } from "react";
import { BsPlus, BsTrash, BsPencil, BsX, BsFileMusic, BsPlayCircle, BsXCircle } from "react-icons/bs";
import toast from "react-hot-toast";
import ModalShell from "@/components/ModalShell";
import MarkdownEditor from "@/components/MarkdownEditor";
import { useLayoutMode } from "@/lib/useLayoutMode";

const API_URL =
    typeof window !== "undefined" ? process.env.NEXT_PUBLIC_API_URL || "" : "";

export default function AdminLessonsPage() {
    const { t } = useLocale();
    const { isWide } = useLayoutMode();
    const [modules, setModules] = useState([]);
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({
        title: "",
        slug: "",
        description: "",
        icon: "book",
        order: 1,
        related_book_id: "",
        steps: [],
    });
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sort, setSort] = useState(null);

    const fetchModules = async () => {
        try {
            const res = await fetch(`${API_URL}/api/v1/lessons`);
            if (res.ok) {
                const data = await res.json();
                setModules(data?.data?.items || data?.items || []);
            }
        } catch {
            toast.error("Gagal memuat modul");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchModules();
        adminLibraryApi
            .list(0, 500)
            .then((res) => res.json())
            .then((data) => setBooks(data?.data?.items ?? data?.items ?? []))
            .catch(() => setBooks([]));
    }, []);

    const handleOpen = (m = null) => {
        if (m) {
            setEditing(m);
            setForm({
                title: m.title || "",
                slug: m.slug || "",
                description: m.description || "",
                icon: m.icon || "book",
                order: m.order || 1,
                related_book_id: m.related_book_id ?? "",
                steps: m.steps || [],
            });
        } else {
            setEditing(null);
            setForm({
                title: "",
                slug: "",
                description: "",
                icon: "book",
                order: modules.length + 1,
                related_book_id: "",
                steps: [{ step_order: 1, title: "", body: "" }],
            });
        }
        setModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const url = editing
                ? `/api/v1/lessons/${editing.id}`
                : "/api/v1/lessons";
            const method = editing ? "PUT" : "POST";
            const res = await authFetch(url, {
                method,
                body: JSON.stringify({
                    ...form,
                    related_book_id: form.related_book_id
                        ? Number(form.related_book_id)
                        : null,
                }),
            });
            if (!res.ok)
                throw new Error(await parseApiError(res, "Gagal simpan"));
            toast.success("Modul berhasil disimpan");
            setModalOpen(false);
            fetchModules();
        } catch (err) {
            toast.error(err.message || "Terjadi kesalahan saat menyimpan");
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Hapus modul ini?")) return;
        try {
            const res = await authFetch(`/api/v1/lessons/${id}`, {
                method: "DELETE",
            });
            if (!res.ok)
                throw new Error(await parseApiError(res, "Gagal hapus"));
            toast.success("Modul dihapus");
            fetchModules();
        } catch (err) {
            toast.error(err.message || "Gagal menghapus modul");
        }
    };

    const addStep = () => {
        setForm((prev) => ({
            ...prev,
            steps: [
                ...prev.steps,
                { step_order: prev.steps.length + 1, title: "", body: "" },
            ],
        }));
    };

    const removeStep = (idx) => {
        setForm((prev) => ({
            ...prev,
            steps: prev.steps
                .filter((_, i) => i !== idx)
                .map((s, i) => ({ ...s, step_order: i + 1 })),
        }));
    };

    const updateStep = (idx, field, val) => {
        setForm((prev) => {
            const steps = [...prev.steps];
            steps[idx] = { ...steps[idx], [field]: val };
            return { ...prev, steps };
        });
    };

    const handleUploadAudio = async (stepIdx, file) => {
        if (!editing?.id) {
            toast.error("Simpan modul terlebih dahulu sebelum unggah audio");
            return;
        }
        const stepOrder = form.steps[stepIdx]?.step_order || stepIdx + 1;
        const formData = new FormData();
        formData.append("file", file);
        try {
            const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : "";
            const res = await fetch(`${API_URL}/api/v1/lessons/${editing.id}/steps/${stepOrder}/audio`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });
            if (!res.ok) throw new Error(await parseApiError(res, "Gagal unggah audio"));
            const data = await res.json();
            const audioUrl = data?.data?.audio_url || data?.audio_url;
            updateStep(stepIdx, "audio_url", audioUrl);
            toast.success("Audio berhasil diunggah");
        } catch (err) {
            toast.error(err.message || "Gagal unggah audio");
        }
    };

    const handleDeleteAudio = async (stepIdx) => {
        if (!editing?.id) return;
        const stepOrder = form.steps[stepIdx]?.step_order || stepIdx + 1;
        try {
            const res = await authFetch(`/api/v1/lessons/${editing.id}/steps/${stepOrder}/audio`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error(await parseApiError(res, "Gagal hapus audio"));
            updateStep(stepIdx, "audio_url", "");
            toast.success("Audio berhasil dihapus");
        } catch (err) {
            toast.error(err.message || "Gagal hapus audio");
        }
    };

    const sorted = applySort(modules, sort, {
        title: (a, b) => (a.title ?? "").localeCompare(b.title ?? ""),
        slug: (a, b) => (a.slug ?? "").localeCompare(b.slug ?? ""),
        order: (a, b) => (a.order ?? 0) - (b.order ?? 0),
    });

    const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
    const currentPage = Math.min(page, pageCount);
    const visible = sorted.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize,
    );

    return (
        <div className='p-6'>
            <div className='flex items-center justify-between mb-6'>
                <h1 className='text-xl font-bold text-gray-900 dark:text-white'>
                    Kelola Modul Belajar
                </h1>
                <button
                    onClick={() => handleOpen()}
                    className='px-4 py-2 bg-emerald-700 text-white rounded-xl text-sm font-medium hover:bg-emerald-800 flex items-center gap-1'
                >
                    <BsPlus className='text-lg' /> Tambah Modul
                </button>
            </div>

            <PanelPagination
                page={currentPage}
                pageCount={pageCount}
                total={sorted.length}
                onChange={setPage}
                pageSize={pageSize}
                onPageSizeChange={(newSize) => {
                    setPageSize(newSize);
                    setPage(1);
                }}
                pageSizeOptions={[10, 20, 50]}
                labels={{
                    prev: t("common.prev"),
                    next: t("common.next"),
                }}
            />

            {loading ? (
                <p className='text-center text-sm text-gray-400 py-6'>
                    Memuat data...
                </p>
            ) : modules.length === 0 ? (
                <div className='text-center text-gray-400 py-6'>
                    <p className='mb-3'>Belum ada modul</p>
                    <button
                        onClick={() => handleOpen()}
                        className='inline-flex items-center px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-medium transition-colors'
                    >
                        Tambah Modul
                    </button>
                </div>
            ) : (
                <>
                    {/* Mobile: stacked cards so every field is reachable without
                        horizontal scrolling. */}
                    <div className='space-y-3 md:hidden'>
                        {visible.map((m) => (
                            <div
                                key={m.id}
                                className='rounded-xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-4'
                            >
                                <div className='flex items-start justify-between gap-2 mb-2'>
                                    <div>
                                        <p className='font-bold text-xs text-gray-500 dark:text-gray-400 mb-0.5'>
                                            Urutan {m.order}
                                        </p>
                                        <p className='font-semibold text-gray-900 dark:text-white'>
                                            {m.title}
                                        </p>
                                    </div>
                                    <div className='flex items-center gap-1 shrink-0'>
                                        <button
                                            onClick={() => handleOpen(m)}
                                            className='p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-blue-600'
                                        >
                                            <BsPencil />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(m.id)}
                                            className='p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-rose-600'
                                        >
                                            <BsTrash />
                                        </button>
                                    </div>
                                </div>
                                <p className='text-sm text-gray-500 dark:text-gray-300'>
                                    {m.slug}
                                </p>
                                <p className='text-sm text-gray-500 dark:text-gray-300'>
                                    {m.steps?.length || 0} langkah
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Desktop: full table. */}
                    <div className='hidden md:block'>
                        <PanelTable
                            head={
                                <>
                                    <Th
                                        sortKey='order'
                                        activeSort={sort}
                                        onSort={(key) =>
                                            setSort((s) => toggleSort(s, key))
                                        }
                                    >
                                        Urutan
                                    </Th>
                                    <Th
                                        sortKey='title'
                                        activeSort={sort}
                                        onSort={(key) =>
                                            setSort((s) => toggleSort(s, key))
                                        }
                                    >
                                        Judul
                                    </Th>
                                    <Th
                                        sortKey='slug'
                                        activeSort={sort}
                                        onSort={(key) =>
                                            setSort((s) => toggleSort(s, key))
                                        }
                                    >
                                        Slug
                                    </Th>
                                    <Th>Langkah</Th>
                                    <Th align='right'>Aksi</Th>
                                </>
                            }
                        >
                            {visible.map((m) => (
                                <Tr
                                    key={m.id}
                                    className='hover:bg-gray-50 dark:hover:bg-slate-700/30'
                                >
                                    <Td className='font-bold'>{m.order}</Td>
                                    <Td className='font-semibold text-gray-900 dark:text-white'>
                                        {m.title}
                                    </Td>
                                    <Td className='text-gray-500 dark:text-gray-300'>
                                        {m.slug}
                                    </Td>
                                    <Td className='text-gray-500 dark:text-gray-300'>
                                        {m.steps?.length || 0} langkah
                                    </Td>
                                    <Td className='text-right space-x-2'>
                                        <button
                                            onClick={() => handleOpen(m)}
                                            className='p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-blue-600'
                                        >
                                            <BsPencil />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(m.id)}
                                            className='p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-rose-600'
                                        >
                                            <BsTrash />
                                        </button>
                                    </Td>
                                </Tr>
                            ))}
                        </PanelTable>
                    </div>
                </>
            )}

            {/* Modal */}
            {modalOpen && (
                <ModalShell
                    onClose={() => setModalOpen(false)}
                    overlayClassName='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm'
                    panelClassName={`bg-white dark:bg-slate-800 rounded-2xl w-full flex flex-col max-h-[90vh] shadow-2xl overflow-hidden ${
                        isWide ? "" : "max-w-2xl"
                    }`}
                >
                    <div className='flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700 shrink-0'>
                        <div>
                            <h2 className='text-lg font-bold text-gray-900 dark:text-white'>
                                {editing ? "Edit Modul" : "Tambah Modul"}
                            </h2>
                            <p className='text-xs text-gray-500 dark:text-gray-400 mt-0.5'>
                                {editing
                                    ? "Perbarui informasi modul dan langkah materi"
                                    : "Buat modul materi belajar baru beserta langkah-langkahnya"}
                            </p>
                        </div>
                        <button
                            type='button'
                            onClick={() => setModalOpen(false)}
                            className='p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors'
                        >
                            <BsX className='text-xl' />
                        </button>
                    </div>

                    <form
                        id='lesson-form'
                        onSubmit={handleSave}
                        className='flex-1 overflow-y-auto p-6 space-y-6'
                    >
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                            <div>
                                <label
                                    htmlFor='page-field-1'
                                    className='block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5'
                                >
                                    Judul
                                </label>
                                <input
                                    id='page-field-1'
                                    type='text'
                                    required
                                    value={form.title}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            title: e.target.value,
                                        })
                                    }
                                    className='w-full px-3.5 py-2.5 text-sm border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 dark:border-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500'
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor='page-field-2'
                                    className='block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5'
                                >
                                    Slug
                                </label>
                                <input
                                    id='page-field-2'
                                    type='text'
                                    required
                                    value={form.slug}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            slug: e.target.value,
                                        })
                                    }
                                    className='w-full px-3.5 py-2.5 text-sm border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 dark:border-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500'
                                />
                            </div>
                        </div>

                        <div>
                            <label
                                htmlFor='page-field-3'
                                className='block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5'
                            >
                                Deskripsi
                            </label>
                            <textarea
                                id='page-field-3'
                                value={form.description}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        description: e.target.value,
                                    })
                                }
                                className='w-full px-3.5 py-2.5 text-sm border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 dark:border-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500'
                                rows={3}
                            />
                        </div>

                        <div>
                            <label
                                htmlFor='page-field-related-book'
                                className='block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5'
                            >
                                Bacaan Lanjutan (Opsional)
                            </label>
                            <select
                                id='page-field-related-book'
                                value={form.related_book_id}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        related_book_id: e.target.value,
                                    })
                                }
                                className='w-full px-3.5 py-2.5 text-sm border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 dark:border-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500'
                            >
                                <option value=''>Tidak ada</option>
                                {books.map((book) => (
                                    <option key={book.id} value={book.id}>
                                        {book.title}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Langkah-langkah */}
                        <div className='pt-2 border-t border-gray-100 dark:border-slate-700'>
                            <div className='flex items-center justify-between mb-4'>
                                <div>
                                    <h3 className='text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white'>
                                        {t("admin.lessons.steps")}
                                    </h3>
                                    <p className='text-xs text-gray-500 dark:text-gray-400 mt-0.5'>
                                        Total {form.steps.length} langkah tersusun
                                    </p>
                                </div>
                                <button
                                    type='button'
                                    onClick={addStep}
                                    className='inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-lg border border-emerald-200 dark:border-emerald-800 transition-colors'
                                >
                                    <BsPlus className='text-base' />{" "}
                                    {t("admin.lessons.add_step")}
                                </button>
                            </div>

                            <div className='space-y-5'>
                                {form.steps.map((s, idx) => (
                                    <div
                                        key={idx}
                                        className='p-4 sm:p-5 border border-gray-200 dark:border-slate-700 bg-gray-50/80 dark:bg-slate-900/50 rounded-2xl relative space-y-3.5 shadow-sm'
                                    >
                                        <div className='flex items-center justify-between'>
                                            <span className='px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'>
                                                Langkah {idx + 1}
                                            </span>
                                            {form.steps.length > 1 && (
                                                <button
                                                    type='button'
                                                    onClick={() =>
                                                        removeStep(idx)
                                                    }
                                                    className='inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg border border-rose-200 dark:border-rose-900/60 transition-colors'
                                                >
                                                    <BsTrash className='text-xs' />{" "}
                                                    Hapus
                                                </button>
                                            )}
                                        </div>

                                        <div>
                                            <label className='block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5'>
                                                Judul Langkah
                                            </label>
                                            <input
                                                type='text'
                                                placeholder={t(
                                                    "admin.lessons.step_title_placeholder",
                                                )}
                                                value={s.title}
                                                onChange={(e) =>
                                                    updateStep(
                                                        idx,
                                                        "title",
                                                        e.target.value,
                                                    )
                                                }
                                                className='w-full px-3.5 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 dark:border-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500'
                                                required
                                            />
                                        </div>

                                        <div className='pt-1'>
                                            <MarkdownEditor
                                                value={s.body}
                                                onChange={(val) =>
                                                    updateStep(idx, "body", val)
                                                }
                                                label='Isi Langkah (Markdown)'
                                                placeholder={t(
                                                    "admin.lessons.step_desc_placeholder",
                                                )}
                                                minRows={4}
                                            />
                                        </div>

                                        <div className='pt-2 border-t border-gray-200 dark:border-slate-700'>
                                            <label className='block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5'>
                                                Audio Langkah
                                            </label>
                                            {s.audio_url ? (
                                                <div className='flex items-center gap-3'>
                                                    <button
                                                        type='button'
                                                        onClick={() => window.open(s.audio_url, "_blank")}
                                                        className='inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-lg border border-emerald-200 dark:border-emerald-800 transition-colors'
                                                    >
                                                        <BsPlayCircle className='text-base' />{" "}
                                                        Buka Audio
                                                    </button>
                                                    <button
                                                        type='button'
                                                        onClick={() => handleDeleteAudio(idx)}
                                                        className='inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg border border-rose-200 dark:border-rose-900/60 transition-colors'
                                                    >
                                                        <BsXCircle className='text-xs' />{" "}
                                                        Hapus
                                                    </button>
                                                </div>
                                            ) : (
                                                <input
                                                    type='file'
                                                    accept='audio/mpeg,audio/wav,audio/ogg,audio/m4a,audio/aac'
                                                    onChange={(e) =>
                                                        e.target.files[0] &&
                                                        handleUploadAudio(idx, e.target.files[0])
                                                    }
                                                    className='w-full px-3.5 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 dark:border-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500'
                                                />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </form>

                    <div className='flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-slate-700 bg-gray-50/80 dark:bg-slate-900/60 rounded-b-2xl shrink-0'>
                        <button
                            type='button'
                            onClick={() => setModalOpen(false)}
                            className='px-4 py-2 text-sm font-medium border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors'
                        >
                            Batal
                        </button>
                        <button
                            type='submit'
                            form='lesson-form'
                            className='px-5 py-2 text-sm font-medium bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl shadow-sm transition-colors'
                        >
                            Simpan
                        </button>
                    </div>
                </ModalShell>
            )}
        </div>
    );
}
