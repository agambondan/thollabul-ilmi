"use client";

import { useEffect, useMemo, useState } from "react";
import { BsPencil, BsPlusCircle, BsTrash, BsX } from "react-icons/bs";
import { PanelPagination, PanelTable, Td, Th, Tr } from "./DataPanel";
import ModalShell from "../ModalShell";
import { parseApiError } from "@/lib/api";

const TYPE_TEXT = "text";
const TYPE_NUMBER = "number";
const TYPE_TEXTAREA = "textarea";
const TYPE_SELECT = "select";
const TYPE_BOOLEAN = "boolean";
const TYPE_JSON = "json";

const formatValue = (value) => {
    if (value === null || value === undefined || value === "") return "—";
    if (typeof value === "boolean") return value ? "Ya" : "Tidak";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
};

const toBool = (value) =>
    value === true || value === "true" || value === 1 || value === "1";

const fieldValueToString = (field, value) => {
    if (value === null || value === undefined) return "";
    if (field.type === TYPE_BOOLEAN) return value ? "true" : "false";
    if (typeof value === "object") return JSON.stringify(value, null, 2);
    return String(value);
};

const stringToFieldValue = (field, raw) => {
    if (raw === "" && field.nullable) return null;
    switch (field.type) {
        case TYPE_NUMBER:
            return raw === "" ? null : Number(raw);
        case TYPE_BOOLEAN:
            return raw === "true";
        case TYPE_JSON:
            if (!raw) return null;
            try {
                return JSON.parse(raw);
            } catch {
                throw new Error(`Field ${field.key} must be valid JSON`);
            }
        default:
            return raw;
    }
};

const EMPTY_FORM = (fields) =>
    fields.reduce((acc, f) => {
        acc[f.key] = f.type === TYPE_BOOLEAN ? false : (f.default ?? "");
        return acc;
    }, {});

const fillForm = (item, fields) =>
    fields.reduce((acc, f) => {
        const value = item?.[f.key];
        acc[f.key] =
            value === undefined || value === null ? (f.default ?? "") : value;
        return acc;
    }, {});

const renderFieldValue = (f, item) =>
    f.render
        ? f.render(item?.[f.key], item)
        : f.type === TYPE_BOOLEAN
          ? item?.[f.key]
              ? "Aktif"
              : "Nonaktif"
          : formatValue(item?.[f.key]);

export default function GenericAdminCRUD({
    title,
    description,
    api,
    fields,
    defaultPageSize = 10,
    searchableFields = ["name", "title", "code"],
    idField = "id",
    transformPayload,
    formLayout = "stacked",
    renderExtra,
}) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(defaultPageSize);
    const [editing, setEditing] = useState(null);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState(() => EMPTY_FORM(fields));
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(null);
    const [formError, setFormError] = useState(null);

    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.list();
            const data = await res.json();
            if (!res.ok) {
                throw new Error(
                    data?.message || data?.error || "Gagal memuat data",
                );
            }
            setItems(
                Array.isArray(data) ? data : (data?.items ?? data?.data ?? []),
            );
        } catch (err) {
            setError(err.message || "Gagal memuat data");
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filtered = useMemo(() => {
        const needle = search.trim().toLowerCase();
        if (!needle) return items;
        return items.filter((it) =>
            searchableFields.some((key) => {
                const value = it?.[key];
                if (value === null || value === undefined) return false;
                return String(value).toLowerCase().includes(needle);
            }),
        );
    }, [items, search, searchableFields]);

    const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
    const currentPage = Math.min(page, pageCount);
    const visible = filtered.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize,
    );

    const dispatchToast = (event, message) => {
        if (typeof window === "undefined") return;
        window.dispatchEvent(new CustomEvent(event, { detail: { message } }));
    };

    const openCreate = () => {
        setEditing(null);
        setForm(EMPTY_FORM(fields));
        setFormError(null);
        setCreating(true);
    };

    const openEdit = (item) => {
        setEditing(item);
        setForm(fillForm(item, fields));
        setFormError(null);
        setCreating(true);
    };

    const closeForm = () => {
        setCreating(false);
        setEditing(null);
        setFormError(null);
    };

    const buildPayload = () => {
        const payload = {};
        for (const f of fields) {
            const raw = form[f.key];
            try {
                payload[f.key] = stringToFieldValue(f, raw);
            } catch (err) {
                throw new Error(err.message);
            }
        }
        return transformPayload ? transformPayload(payload) : payload;
    };

    const save = async () => {
        setFormError(null);
        setSaving(true);
        let payload;
        try {
            payload = buildPayload();
        } catch (err) {
            setFormError(err.message);
            setSaving(false);
            return;
        }
        try {
            const res = editing
                ? await api.update(editing[idField], payload)
                : await api.create(payload);
            if (!res.ok) {
                const msg = await parseApiError(
                    res,
                    editing
                        ? "Gagal menyimpan perubahan"
                        : "Gagal menambahkan data",
                );
                throw new Error(msg);
            }
            dispatchToast(
                "admin:success",
                editing
                    ? "Perubahan berhasil disimpan"
                    : "Data berhasil ditambahkan",
            );
            closeForm();
            load();
        } catch (err) {
            setFormError(err.message || "Gagal menyimpan perubahan");
        } finally {
            setSaving(false);
        }
    };

    const confirmDelete = async () => {
        if (!deleting) return;
        try {
            const res = await api.delete(deleting[idField]);
            if (!res.ok) {
                const msg = await parseApiError(res, "Gagal menghapus data");
                throw new Error(msg);
            }
            dispatchToast("admin:success", "Data berhasil dihapus");
            setDeleting(null);
            load();
        } catch (err) {
            dispatchToast(
                "admin:mutation-error",
                err.message || "Gagal menghapus data",
            );
            setDeleting(null);
        }
    };

    const inputClass =
        "w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none";

    return (
        <div className='space-y-4'>
            <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                <div>
                    <h1 className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
                        {title}
                    </h1>
                    {description && (
                        <p className='text-sm text-gray-500 dark:text-gray-400'>
                            {description}
                        </p>
                    )}
                </div>
                <div className='flex flex-wrap items-center gap-2'>
                    <input
                        type='text'
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                        placeholder='Cari...'
                        className='px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none'
                    />
                    <button
                        type='button'
                        onClick={openCreate}
                        className='inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors'
                    >
                        <BsPlusCircle />
                        Tambah
                    </button>
                </div>
            </div>

            {loading ? (
                <p className='text-center text-sm text-gray-500 dark:text-gray-400 py-6'>
                    Memuat data…
                </p>
            ) : error ? (
                <p className='text-center text-sm text-red-500 py-6'>{error}</p>
            ) : visible.length === 0 ? (
                <p className='text-center text-sm text-gray-500 dark:text-gray-400 py-6'>
                    {search
                        ? "Tidak ada data yang cocok dengan pencarian."
                        : "Belum ada data."}
                </p>
            ) : (
                <>
                    {/* Mobile: stacked cards, so every field is reachable without
                        horizontal scrolling on narrow screens. */}
                    <div className='space-y-3 md:hidden'>
                        {visible.map((item) => (
                            <div
                                key={item[idField]}
                                className='rounded-xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-4'
                            >
                                <div className='flex items-center justify-end gap-1 mb-2 -mt-1 -mr-1'>
                                    <button
                                        type='button'
                                        onClick={() => openEdit(item)}
                                        className='inline-flex items-center gap-1 px-2 py-1 rounded-md text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-xs font-semibold'
                                    >
                                        <BsPencil /> Edit
                                    </button>
                                    <button
                                        type='button'
                                        onClick={() => setDeleting(item)}
                                        className='inline-flex items-center gap-1 px-2 py-1 rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 text-xs font-semibold'
                                    >
                                        <BsTrash /> Hapus
                                    </button>
                                </div>
                                <dl className='space-y-1.5'>
                                    {fields.map((f) => (
                                        <div
                                            key={f.key}
                                            className='flex items-baseline justify-between gap-3 text-sm'
                                        >
                                            <dt className='shrink-0 text-gray-500 dark:text-gray-400'>
                                                {f.label}
                                            </dt>
                                            <dd className='text-right text-gray-900 dark:text-gray-100'>
                                                {renderFieldValue(f, item)}
                                            </dd>
                                        </div>
                                    ))}
                                </dl>
                            </div>
                        ))}
                    </div>

                    {/* Desktop: full table. */}
                    <div className='hidden md:block'>
                        <PanelTable
                            head={
                                <>
                                    {fields.map((f) => (
                                        <Th key={f.key}>{f.label}</Th>
                                    ))}
                                    <Th className='text-right'>Aksi</Th>
                                </>
                            }
                        >
                            {visible.map((item) => (
                                <Tr key={item[idField]}>
                                    {fields.map((f) => (
                                        <Td key={f.key}>
                                            {renderFieldValue(f, item)}
                                        </Td>
                                    ))}
                                    <Td className='text-right whitespace-nowrap align-middle'>
                                        <div className='inline-flex items-center gap-2'>
                                            <button
                                                type='button'
                                                onClick={() => openEdit(item)}
                                                className='inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-xs font-semibold'
                                            >
                                                <BsPencil /> Edit
                                            </button>
                                            <button
                                                type='button'
                                                onClick={() =>
                                                    setDeleting(item)
                                                }
                                                className='inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 text-xs font-semibold'
                                            >
                                                <BsTrash /> Hapus
                                            </button>
                                        </div>
                                    </Td>
                                </Tr>
                            ))}
                        </PanelTable>
                    </div>
                </>
            )}

            <PanelPagination
                page={currentPage}
                pageCount={pageCount}
                pageSize={pageSize}
                onChange={setPage}
                onPageSizeChange={(size) => {
                    setPageSize(size);
                    setPage(1);
                }}
                total={filtered.length}
            />

            {creating && (
                <ModalShell
                    onClose={closeForm}
                    overlayClassName='fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3'
                    panelClassName='bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl max-h-[90vh] flex flex-col'
                >
                    <div className='flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-800'>
                        <h2 className='text-lg font-bold text-gray-900 dark:text-gray-100'>
                            {editing ? "Edit" : "Tambah"} {title}
                        </h2>
                        <button
                            type='button'
                            onClick={closeForm}
                            className='p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800'
                        >
                            <BsX className='text-xl' />
                        </button>
                    </div>
                    <div
                        className={
                            formLayout === "grid"
                                ? "grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 overflow-y-auto"
                                : "space-y-3 p-4 overflow-y-auto"
                        }
                    >
                        {fields.map((f) => {
                            const raw = form[f.key];
                            const value =
                                f.type === TYPE_BOOLEAN
                                    ? toBool(raw)
                                    : (raw ?? "");
                            return (
                                <div key={f.key}>
                                    <label className='block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1'>
                                        {f.label}
                                        {f.required ? (
                                            <span className='text-red-500 ml-1'>
                                                *
                                            </span>
                                        ) : null}
                                    </label>
                                    {f.type === TYPE_TEXTAREA ? (
                                        <textarea
                                            value={value}
                                            onChange={(e) =>
                                                setForm((prev) => ({
                                                    ...prev,
                                                    [f.key]: e.target.value,
                                                }))
                                            }
                                            rows={f.rows ?? 4}
                                            required={f.required}
                                            className={inputClass}
                                        />
                                    ) : f.type === TYPE_SELECT ? (
                                        <select
                                            value={value}
                                            onChange={(e) =>
                                                setForm((prev) => ({
                                                    ...prev,
                                                    [f.key]: e.target.value,
                                                }))
                                            }
                                            required={f.required}
                                            className={inputClass}
                                        >
                                            <option value=''>— pilih —</option>
                                            {(f.options ?? []).map((opt) => (
                                                <option
                                                    key={
                                                        typeof opt === "string"
                                                            ? opt
                                                            : opt.value
                                                    }
                                                    value={
                                                        typeof opt === "string"
                                                            ? opt
                                                            : opt.value
                                                    }
                                                >
                                                    {typeof opt === "string"
                                                        ? opt
                                                        : opt.label}
                                                </option>
                                            ))}
                                        </select>
                                    ) : f.type === TYPE_BOOLEAN ? (
                                        <label className='inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200'>
                                            <input
                                                type='checkbox'
                                                checked={value}
                                                onChange={(e) =>
                                                    setForm((prev) => ({
                                                        ...prev,
                                                        [f.key]:
                                                            e.target.checked,
                                                    }))
                                                }
                                            />
                                            {f.checkLabel ?? "Aktif"}
                                        </label>
                                    ) : f.type === TYPE_JSON ? (
                                        <textarea
                                            value={fieldValueToString(f, raw)}
                                            onChange={(e) =>
                                                setForm((prev) => ({
                                                    ...prev,
                                                    [f.key]: e.target.value,
                                                }))
                                            }
                                            rows={f.rows ?? 6}
                                            className={`${inputClass} font-mono`}
                                            placeholder={f.placeholder ?? "[]"}
                                        />
                                    ) : (
                                        <input
                                            type={
                                                f.type === TYPE_NUMBER
                                                    ? "number"
                                                    : "text"
                                            }
                                            value={value}
                                            onChange={(e) =>
                                                setForm((prev) => ({
                                                    ...prev,
                                                    [f.key]: e.target.value,
                                                }))
                                            }
                                            placeholder={f.placeholder}
                                            required={f.required}
                                            min={f.min}
                                            max={f.max}
                                            className={inputClass}
                                        />
                                    )}
                                    {f.hint ? (
                                        <p className='text-[11px] text-gray-400 mt-1'>
                                            {f.hint}
                                        </p>
                                    ) : null}
                                </div>
                            );
                        })}
                    </div>
                    {editing && renderExtra ? (
                        <div className='px-4 pb-2 border-t border-gray-100 dark:border-slate-800 pt-3'>
                            {renderExtra(editing, { reload: load })}
                        </div>
                    ) : null}
                    {formError ? (
                        <p className='px-4 pb-1 text-xs text-red-500'>
                            {formError}
                        </p>
                    ) : null}
                    <div className='flex items-center justify-end gap-2 p-4 border-t border-gray-100 dark:border-slate-800'>
                        <button
                            type='button'
                            onClick={closeForm}
                            className='px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-200 dark:hover:bg-slate-700'
                        >
                            Batal
                        </button>
                        <button
                            type='button'
                            onClick={save}
                            disabled={saving}
                            className='px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold'
                        >
                            {saving ? "Menyimpan…" : "Simpan"}
                        </button>
                    </div>
                </ModalShell>
            )}

            {deleting && (
                <ModalShell
                    onClose={() => setDeleting(null)}
                    overlayClassName='fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3'
                    panelClassName='bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl p-4'
                >
                    <h2 className='text-base font-bold text-gray-900 dark:text-gray-100 mb-1'>
                        Hapus data?
                    </h2>
                    <p className='text-sm text-gray-500 dark:text-gray-400'>
                        Tindakan ini tidak bisa dibatalkan. Data akan dihapus
                        permanen.
                    </p>
                    <div className='flex items-center justify-end gap-2 mt-4'>
                        <button
                            type='button'
                            onClick={() => setDeleting(null)}
                            className='px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-200 text-sm font-medium'
                        >
                            Batal
                        </button>
                        <button
                            type='button'
                            onClick={confirmDelete}
                            className='px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold'
                        >
                            Hapus
                        </button>
                    </div>
                </ModalShell>
            )}
        </div>
    );
}
