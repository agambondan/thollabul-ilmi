"use client";

import { PanelTable, Td, Th, Tr } from "@/components/panel/DataPanel";
import { useLocale } from "@/context/Locale";
import { authFetch } from "@/lib/api";
import { useEffect, useState } from "react";
import { BsPlus, BsTrash, BsPencil } from "react-icons/bs";
import toast from "react-hot-toast";
import ModalShell from "@/components/ModalShell";

const API_URL =
    typeof window !== "undefined" ? process.env.NEXT_PUBLIC_API_URL || "" : "";

export default function AdminLessonsPage() {
    const { t } = useLocale();
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({
        title: "",
        slug: "",
        description: "",
        icon: "book",
        order: 1,
        steps: [],
    });

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
                body: JSON.stringify(form),
            });
            if (!res.ok) throw new Error("Gagal simpan");
            toast.success("Modul berhasil disimpan");
            setModalOpen(false);
            fetchModules();
        } catch {
            toast.error("Terjadi kesalahan saat menyimpan");
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Hapus modul ini?")) return;
        try {
            const res = await authFetch(`/api/v1/lessons/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Gagal hapus");
            toast.success("Modul dihapus");
            fetchModules();
        } catch {
            toast.error("Gagal menghapus modul");
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

            <PanelTable
                head={
                    <>
                        <Th>Urutan</Th>
                        <Th>Judul</Th>
                        <Th>Slug</Th>
                        <Th>Langkah</Th>
                        <Th align='right'>Aksi</Th>
                    </>
                }
            >
                {loading ? (
                    <Tr>
                        <Td colSpan={5} className='text-center text-gray-400'>
                            Memuat data...
                        </Td>
                    </Tr>
                ) : modules.length === 0 ? (
                    <Tr>
                        <Td colSpan={5} className='text-center text-gray-400'>
                            Belum ada modul
                        </Td>
                    </Tr>
                ) : (
                    modules.map((m) => (
                        <Tr
                            key={m.id}
                            className='hover:bg-gray-50 dark:hover:bg-slate-700/30'
                        >
                            <Td className='font-bold'>{m.order}</Td>
                            <Td className='font-semibold text-gray-900 dark:text-white'>
                                {m.title}
                            </Td>
                            <Td className='text-gray-500'>{m.slug}</Td>
                            <Td className='text-gray-500'>
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
                    ))
                )}
            </PanelTable>

            {/* Modal */}
            {modalOpen && (
                <ModalShell
                    onClose={() => setModalOpen(false)}
                    overlayClassName='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm'
                    panelClassName='bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-xl'
                >
                        <h2 className='text-lg font-bold text-gray-900 dark:text-white mb-4'>
                            {editing ? "Edit Modul" : "Tambah Modul"}
                        </h2>
                        <form onSubmit={handleSave} className='space-y-4'>
                            <div className='grid grid-cols-2 gap-4'>
                                <div>
                                    <label className='block text-xs font-semibold mb-1'>
                                        Judul
                                    </label>
                                    <input
                                        type='text'
                                        required
                                        value={form.title}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                title: e.target.value,
                                            })
                                        }
                                        className='w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-900 dark:border-slate-700'
                                    />
                                </div>
                                <div>
                                    <label className='block text-xs font-semibold mb-1'>
                                        Slug
                                    </label>
                                    <input
                                        type='text'
                                        required
                                        value={form.slug}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                slug: e.target.value,
                                            })
                                        }
                                        className='w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-900 dark:border-slate-700'
                                    />
                                </div>
                            </div>
                            <div>
                                <label className='block text-xs font-semibold mb-1'>
                                    Deskripsi
                                </label>
                                <textarea
                                    value={form.description}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            description: e.target.value,
                                        })
                                    }
                                    className='w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-900 dark:border-slate-700'
                                    rows={2}
                                />
                            </div>

                            {/* Langkah-langkah */}
                            <div>
                                <div className='flex items-center justify-between mb-2'>
                                    <label className='text-xs font-bold uppercase'>
                                        Langkah Belajar
                                    </label>
                                    <button
                                        type='button'
                                        onClick={addStep}
                                        className='text-xs text-emerald-600 font-semibold'
                                    >
                                        + Tambah Langkah
                                    </button>
                                </div>
                                <div className='space-y-3'>
                                    {form.steps.map((s, idx) => (
                                        <div
                                            key={idx}
                                            className='p-3 border rounded-xl dark:border-slate-700 bg-gray-50 dark:bg-slate-900/40 relative'
                                        >
                                            <div className='flex items-center justify-between mb-2'>
                                                <span className='text-xs font-bold text-gray-500'>
                                                    Langkah {idx + 1}
                                                </span>
                                                {form.steps.length > 1 && (
                                                    <button
                                                        type='button'
                                                        onClick={() =>
                                                            removeStep(idx)
                                                        }
                                                        className='text-rose-500 text-xs'
                                                    >
                                                        Hapus
                                                    </button>
                                                )}
                                            </div>
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
                                                className='w-full px-3 py-1.5 mb-2 text-sm border rounded-lg dark:bg-slate-800 dark:border-slate-700'
                                                required
                                            />
                                            <textarea
                                                placeholder={t(
                                                    "admin.lessons.step_desc_placeholder",
                                                )}
                                                value={s.body}
                                                onChange={(e) =>
                                                    updateStep(
                                                        idx,
                                                        "body",
                                                        e.target.value,
                                                    )
                                                }
                                                className='w-full px-3 py-1.5 text-sm border rounded-lg dark:bg-slate-800 dark:border-slate-700'
                                                rows={2}
                                                required
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className='flex justify-end gap-2 mt-6'>
                                <button
                                    type='button'
                                    onClick={() => setModalOpen(false)}
                                    className='px-4 py-2 text-sm border rounded-lg'
                                >
                                    Batal
                                </button>
                                <button
                                    type='submit'
                                    className='px-5 py-2 text-sm bg-emerald-700 text-white rounded-lg'
                                >
                                    Simpan
                                </button>
                            </div>
                        </form>
                </ModalShell>
            )}
        </div>
    );
}
