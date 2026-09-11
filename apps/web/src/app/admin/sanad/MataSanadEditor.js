"use client";

import { useState } from "react";
import { BsPencil, BsPlusCircle, BsTrash, BsX } from "react-icons/bs";
import { adminSanadApi, parseApiError } from "@/lib/api";

const METODE_OPTIONS = [
    "haddatsana",
    "akhbarana",
    "ananah",
    "anna",
    "samitu",
    "raaytu",
];

const EMPTY_FORM = { perawi_id: "", urutan: "", metode: "", catatan: "" };

const toPayload = (form) => ({
    perawi_id: form.perawi_id === "" ? null : Number(form.perawi_id),
    urutan: form.urutan === "" ? null : Number(form.urutan),
    metode: form.metode || null,
    catatan: form.catatan || null,
});

export default function MataSanadEditor({ sanad, onChanged }) {
    const [mataList, setMataList] = useState(sanad?.mata_sanad ?? []);
    const [editingID, setEditingID] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [adding, setAdding] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const duplicateUrutan = (() => {
        const seen = new Set();
        for (const m of mataList) {
            if (m.urutan === null || m.urutan === undefined) continue;
            if (seen.has(m.urutan)) return m.urutan;
            seen.add(m.urutan);
        }
        return null;
    })();

    const openAdd = () => {
        setEditingID(null);
        setForm(EMPTY_FORM);
        setError(null);
        setAdding(true);
    };

    const openEdit = (m) => {
        setEditingID(m.id);
        setForm({
            perawi_id: m.perawi_id ?? "",
            urutan: m.urutan ?? "",
            metode: m.metode ?? "",
            catatan: m.catatan ?? "",
        });
        setError(null);
        setAdding(true);
    };

    const closeForm = () => {
        setAdding(false);
        setEditingID(null);
        setError(null);
    };

    const save = async () => {
        setSaving(true);
        setError(null);
        try {
            const payload = toPayload(form);
            const res = editingID
                ? await adminSanadApi.updateMata(editingID, payload)
                : await adminSanadApi.addMata(sanad.id, payload);
            if (!res.ok) {
                throw new Error(
                    await parseApiError(res, "Gagal menyimpan mata sanad"),
                );
            }
            const data = await res.json();
            const saved = data?.data ?? data;
            setMataList((prev) =>
                editingID
                    ? prev.map((m) => (m.id === editingID ? saved : m))
                    : [...prev, saved],
            );
            onChanged?.();
            closeForm();
        } catch (err) {
            setError(err.message || "Gagal menyimpan mata sanad");
        } finally {
            setSaving(false);
        }
    };

    const remove = async (m) => {
        if (!confirm("Hapus mata sanad ini?")) return;
        try {
            const res = await adminSanadApi.deleteMata(m.id);
            if (!res.ok) {
                throw new Error(
                    await parseApiError(res, "Gagal menghapus mata sanad"),
                );
            }
            setMataList((prev) => prev.filter((x) => x.id !== m.id));
            onChanged?.();
        } catch (err) {
            setError(err.message || "Gagal menghapus mata sanad");
        }
    };

    const inputClass =
        "w-full px-2 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none";

    return (
        <div>
            <div className='flex items-center justify-between mb-2'>
                <h3 className='text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wide'>
                    Mata Sanad (rantai perawi)
                </h3>
                <button
                    type='button'
                    onClick={openAdd}
                    className='inline-flex items-center gap-1 px-2 py-1 rounded-md text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-xs font-semibold'
                >
                    <BsPlusCircle /> Tambah
                </button>
            </div>

            {duplicateUrutan !== null && (
                <p className='text-[11px] text-amber-600 dark:text-amber-400 mb-2'>
                    Perhatian: urutan {duplicateUrutan} dipakai lebih dari satu
                    perawi.
                </p>
            )}

            {mataList.length === 0 ? (
                <p className='text-xs text-gray-400 py-2'>
                    Belum ada mata sanad.
                </p>
            ) : (
                <div className='space-y-1.5'>
                    {[...mataList]
                        .sort((a, b) => (a.urutan ?? 0) - (b.urutan ?? 0))
                        .map((m) => (
                            <div
                                key={m.id}
                                className='flex items-center justify-between gap-2 rounded-lg border border-gray-100 dark:border-slate-700 px-2.5 py-1.5 text-xs'
                            >
                                <div className='min-w-0'>
                                    <span className='font-semibold'>
                                        #{m.urutan ?? "—"}
                                    </span>{" "}
                                    Perawi ID {m.perawi_id ?? "—"}
                                    {m.metode ? ` · ${m.metode}` : ""}
                                    {m.catatan ? (
                                        <span className='block text-gray-400 truncate'>
                                            {m.catatan}
                                        </span>
                                    ) : null}
                                </div>
                                <div className='flex items-center gap-1 shrink-0'>
                                    <button
                                        type='button'
                                        onClick={() => openEdit(m)}
                                        className='p-1 rounded-md text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'
                                    >
                                        <BsPencil />
                                    </button>
                                    <button
                                        type='button'
                                        onClick={() => remove(m)}
                                        className='p-1 rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30'
                                    >
                                        <BsTrash />
                                    </button>
                                </div>
                            </div>
                        ))}
                </div>
            )}

            {adding && (
                <div className='mt-3 rounded-lg border border-gray-200 dark:border-slate-700 p-3 space-y-2'>
                    <div className='flex items-center justify-between'>
                        <p className='text-xs font-semibold'>
                            {editingID ? "Edit" : "Tambah"} Mata Sanad
                        </p>
                        <button
                            type='button'
                            onClick={closeForm}
                            className='text-gray-400 hover:text-gray-600'
                        >
                            <BsX />
                        </button>
                    </div>
                    <div className='grid grid-cols-2 gap-2'>
                        <div>
                            <label className='block text-[11px] text-gray-500 mb-0.5'>
                                Perawi ID *
                            </label>
                            <input
                                type='number'
                                value={form.perawi_id}
                                onChange={(e) =>
                                    setForm((p) => ({
                                        ...p,
                                        perawi_id: e.target.value,
                                    }))
                                }
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className='block text-[11px] text-gray-500 mb-0.5'>
                                Urutan *
                            </label>
                            <input
                                type='number'
                                value={form.urutan}
                                onChange={(e) =>
                                    setForm((p) => ({
                                        ...p,
                                        urutan: e.target.value,
                                    }))
                                }
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className='block text-[11px] text-gray-500 mb-0.5'>
                                Metode
                            </label>
                            <select
                                value={form.metode}
                                onChange={(e) =>
                                    setForm((p) => ({
                                        ...p,
                                        metode: e.target.value,
                                    }))
                                }
                                className={inputClass}
                            >
                                <option value=''>— pilih —</option>
                                {METODE_OPTIONS.map((m) => (
                                    <option key={m} value={m}>
                                        {m}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className='block text-[11px] text-gray-500 mb-0.5'>
                                Catatan
                            </label>
                            <input
                                type='text'
                                value={form.catatan}
                                onChange={(e) =>
                                    setForm((p) => ({
                                        ...p,
                                        catatan: e.target.value,
                                    }))
                                }
                                className={inputClass}
                            />
                        </div>
                    </div>
                    {error ? (
                        <p className='text-[11px] text-red-500'>{error}</p>
                    ) : null}
                    <div className='flex items-center justify-end gap-2'>
                        <button
                            type='button'
                            onClick={closeForm}
                            className='px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-slate-800 text-xs font-medium'
                        >
                            Batal
                        </button>
                        <button
                            type='button'
                            onClick={save}
                            disabled={saving}
                            className='px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold'
                        >
                            {saving ? "Menyimpan…" : "Simpan"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
