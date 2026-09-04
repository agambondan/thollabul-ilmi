"use client";

import { PanelTable, Td, Th, Tr } from "@/components/panel/DataPanel";
import { useLocale } from "@/context/Locale";
import { adminLibraryApi, uploadWithProgress } from "@/lib/api";
import { useEffect, useState } from "react";
import {
    BsBoxArrowUpRight,
    BsPencil,
    BsPlusCircle,
    BsTrash,
    BsX,
} from "react-icons/bs";
import ModalShell from "@/components/ModalShell";

const FORMATS = ["link", "pdf", "epub", "html"];
const STATUSES = ["published", "draft"];
const SOURCE_TYPES = ["external", "uploaded"];
const LEVELS = ["Pemula", "Menengah", "Lanjutan"];
const LANGUAGES = ["Indonesia", "Arab", "Inggris"];
const CATEGORIES = [
    "Aqidah",
    "Akhlak",
    "Bahasa Arab",
    "Fiqh",
    "Hadith",
    "Quran",
    "Sirah",
    "Tafsir",
    "Umum",
];
const LICENSE_STATUSES = [
    "unverified",
    "needs_review",
    "verified",
    "restricted",
];
const EMPTY_FORM = {
    author: "",
    category: "",
    cover_url: "",
    description: "",
    file_mime_type: "",
    file_name: "",
    file_size_bytes: 0,
    format: "link",
    language: "Indonesia",
    level: "Pemula",
    license: "",
    license_status: "unverified",
    pages: "",
    slug: "",
    source_note: "",
    source_type: "external",
    source_url: "",
    is_source_verified: false,
    status: "published",
    tags: "",
    title: "",
};

const toForm = (item) => ({
    author: item.author ?? "",
    category: item.category ?? "",
    cover_url: item.cover_url ?? "",
    description: item.description ?? "",
    format: item.format ?? "link",
    file_mime_type: item.file_mime_type ?? "",
    file_name: item.file_name ?? "",
    file_size_bytes: item.file_size_bytes ?? 0,
    language: item.language ?? "Indonesia",
    level: item.level ?? "Pemula",
    license: item.license ?? "",
    license_status: item.license_status ?? "unverified",
    pages: item.pages ? String(item.pages) : "",
    slug: item.slug ?? "",
    source_note: item.source_note ?? "",
    source_type: item.source_type ?? "external",
    source_url: item.source_url ?? "",
    is_source_verified: Boolean(item.is_source_verified),
    status: item.status ?? "published",
    tags: item.tags ?? "",
    title: item.title ?? "",
});

const toPayload = (form) => ({
    ...form,
    is_source_verified: Boolean(form.is_source_verified),
    pages: Number(form.pages) || 0,
});

const AdminLibraryPage = () => {
    const { t } = useLocale();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [search, setSearch] = useState("");
    const [deleteId, setDeleteId] = useState(null);
    const [resourceFile, setResourceFile] = useState(null);
    const [uploadingResource, setUploadingResource] = useState(false);
    const [resourceUploadProgress, setResourceUploadProgress] = useState(0);
    const [clearingResource, setClearingResource] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const res = await adminLibraryApi.list(0, 500);
            const data = await res.json();
            setItems(data?.items ?? data?.data?.items ?? data ?? []);
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
        setResourceFile(null);
        setShowModal(true);
    };

    const openEdit = (item) => {
        setEditId(item.id ?? item._id);
        setForm(toForm(item));
        setResourceFile(null);
        setShowModal(true);
    };

    const fb = (type, msg) =>
        window.dispatchEvent(
            new CustomEvent(type, { detail: { message: msg } }),
        );

    const save = async () => {
        setSaving(true);
        try {
            let res;
            if (editId) {
                res = await adminLibraryApi.update(editId, toPayload(form));
            } else {
                res = await adminLibraryApi.create(toPayload(form));
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
            const res = await adminLibraryApi.delete(deleteId);
            if (!res.ok) throw new Error(t("admin.error.save"));
            setDeleteId(null);
            load();
            fb("admin:success", t("admin.crud.delete_success"));
        } catch (err) {
            fb("admin:mutation-error", err.message);
        }
    };

    const uploadResource = async () => {
        if (!editId || !resourceFile) return;
        setUploadingResource(true);
        setResourceUploadProgress(1);
        try {
            const fd = new FormData();
            fd.append("file", resourceFile);
            const res = await uploadWithProgress(
                `/api/v1/library/books/${editId}/resource`,
                fd,
                (percent) => setResourceUploadProgress(percent),
            );
            setResourceUploadProgress(0);
            if (!res.ok) throw new Error("upload failed");
            const data = await res.json();
            const book = data?.data ?? data;
            setForm(toForm(book));
            setResourceFile(null);
            load();
        } catch (err) {
            fb("admin:mutation-error", err.message || "Gagal unggah resource.");
        } finally {
            setUploadingResource(false);
            setResourceUploadProgress(0);
        }
    };

    const clearResource = async () => {
        if (!editId || !form.file_name) return;
        setClearingResource(true);
        try {
            const res = await adminLibraryApi.clearResource(editId);
            if (!res.ok) throw new Error("clear resource failed");
            const data = await res.json();
            const book = data?.data ?? data;
            setForm(toForm(book));
            setResourceFile(null);
            load();
        } catch (err) {
            fb("admin:mutation-error", err.message || "Gagal hapus resource.");
        } finally {
            setClearingResource(false);
        }
    };

    const filtered = items.filter((item) => {
        const query = search.trim().toLowerCase();
        if (!query) return true;
        return [item.title, item.author, item.category, item.level, item.tags]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(query);
    });

    return (
        <div className='p-6'>
            <div className='mb-6 flex items-center justify-between'>
                <div>
                    <h1 className='text-xl font-bold text-gray-900 dark:text-gray-100 dark:text-white'>
                        {t("admin.nav.library")}
                    </h1>
                    <p className='text-sm text-gray-500 dark:text-gray-300 dark:text-gray-400'>
                        {items.length} {t("admin.library.books_unit")}
                    </p>
                </div>
                <button
                    className='flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-600'
                    onClick={openCreate}
                >
                    <BsPlusCircle />
                    {t("admin.library.add_book")}
                </button>
            </div>

            <div className='mb-4'>
                <input
                    className='w-full max-w-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white px-3 py-2 text-sm text-gray-900 dark:text-gray-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white'
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={t("admin.library.search_placeholder")}
                    type='text'
                    value={search}
                />
            </div>

            {loading ? (
                <p className='text-sm text-gray-500 dark:text-gray-300'>{t("common.loading")}</p>
            ) : (
                <PanelTable
                    head={
                        <>
                            <Th className='font-medium text-gray-600 dark:text-gray-300'>
                                {t("admin.field.title")}
                            </Th>
                            <Th className='hidden font-medium text-gray-600 dark:text-gray-300 md:table-cell'>
                                {t("admin.library.author")}
                            </Th>
                            <Th className='hidden font-medium text-gray-600 dark:text-gray-300 lg:table-cell'>
                                {t("admin.field.category")}
                            </Th>
                            <Th className='font-medium text-gray-600 dark:text-gray-300'>
                                {t("admin.library.format")}
                            </Th>
                            <Th className='hidden font-medium text-gray-600 dark:text-gray-300 lg:table-cell'>
                                {t("admin.library.license_status")}
                            </Th>
                            <Th className='hidden font-medium text-gray-600 dark:text-gray-300 md:table-cell'>
                                {t("admin.library.status")}
                            </Th>
                            <Th className='w-24'></Th>
                        </>
                    }
                >
                    {filtered.map((item) => (
                        <Tr key={item.id ?? item.slug}>
                            <Td className='max-w-xs truncate font-medium text-gray-900 dark:text-gray-100 dark:text-white'>
                                {item.title}
                                <p className='text-xs font-normal text-gray-400'>
                                    {item.slug}
                                </p>
                            </Td>
                            <Td className='hidden text-gray-500 dark:text-gray-300 dark:text-gray-400 md:table-cell'>
                                {item.author || "-"}
                            </Td>
                            <Td className='hidden text-gray-500 dark:text-gray-300 dark:text-gray-400 lg:table-cell'>
                                {item.category || "-"}
                            </Td>
                            <Td>
                                <span className='rounded bg-emerald-100 px-2 py-0.5 text-xs uppercase text-emerald-700 dark:text-emerald-400 dark:bg-emerald-900/30 dark:text-emerald-300'>
                                    {item.format || "link"}
                                </span>
                            </Td>
                            <Td className='hidden lg:table-cell'>
                                <span
                                    className={`rounded px-2 py-0.5 text-xs ${
                                        item.license_status === "verified"
                                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                                            : item.license_status ===
                                                "restricted"
                                              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                                              : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                                    }`}
                                >
                                    {item.license_status || "unverified"}
                                </span>
                                {item.is_source_verified ? (
                                    <p className='mt-1 text-[11px] text-emerald-600 dark:text-emerald-300'>
                                        {t("admin.library.source_verified")}
                                    </p>
                                ) : null}
                            </Td>
                            <Td className='hidden text-gray-500 dark:text-gray-300 dark:text-gray-400 md:table-cell'>
                                {item.status || "published"}
                            </Td>
                            <Td>
                                <div className='flex items-center justify-end gap-1.5'>
                                    {item.source_url && (
                                        <a
                                            className='rounded p-1.5 text-gray-400 hover:text-gray-600 hover:dark:text-gray-300'
                                            href={item.source_url}
                                            rel='noreferrer'
                                            target='_blank'
                                            title={t(
                                                "admin.library.source_url",
                                            )}
                                        >
                                            <BsBoxArrowUpRight />
                                        </a>
                                    )}
                                    <button
                                        aria-label={t("common.edit")}
                                        className='rounded p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                                        onClick={() => openEdit(item)}
                                        title={t("common.edit")}
                                    >
                                        <BsPencil />
                                    </button>
                                    <button
                                        aria-label={t("common.delete")}
                                        className='rounded p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                                        onClick={() =>
                                            setDeleteId(item.id ?? item._id)
                                        }
                                        title={t("common.delete")}
                                    >
                                        <BsTrash />
                                    </button>
                                </div>
                            </Td>
                        </Tr>
                    ))}
                    {filtered.length === 0 && (
                        <Tr>
                            <Td
                                className='px-4 py-8 text-center text-gray-400'
                                colSpan={7}
                            >
                                {t("admin.crud.no_data")}
                            </Td>
                        </Tr>
                    )}
                </PanelTable>
            )}

            {showModal && (
                <ModalShell
                    onClose={() => setShowModal(false)}
                    overlayClassName='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'
                    panelClassName='max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white dark:bg-slate-800'
                >
                    <div className='flex items-center justify-between border-b border-gray-100 p-5 dark:border-slate-700'>
                        <h2 className='font-bold text-gray-900 dark:text-gray-100 dark:text-white'>
                            {editId
                                ? t("admin.library.edit_book")
                                : t("admin.library.add_book")}
                        </h2>
                        <button
                            className='p-1 text-gray-400 hover:text-gray-600 hover:dark:text-gray-300 dark:hover:text-gray-200'
                            onClick={() => setShowModal(false)}
                        >
                            <BsX className='text-xl' />
                        </button>
                    </div>
                    <div className='space-y-4 p-5'>
                        <div className='grid gap-4 md:grid-cols-2'>
                            <Field label={t("admin.field.title")}>
                                <input
                                    className={inputClass}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            title: e.target.value,
                                        })
                                    }
                                    value={form.title}
                                />
                            </Field>
                            <Field label={t("admin.field.slug")}>
                                <input
                                    className={inputClass}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            slug: e.target.value,
                                        })
                                    }
                                    placeholder={t("admin.library.auto_slug")}
                                    value={form.slug}
                                />
                            </Field>
                        </div>
                        <div className='grid gap-4 md:grid-cols-3'>
                            <Field label={t("admin.library.author")}>
                                <input
                                    className={inputClass}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            author: e.target.value,
                                        })
                                    }
                                    value={form.author}
                                />
                            </Field>
                            <Field label={t("admin.field.category")}>
                                <input
                                    className={inputClass}
                                    list='library-category-options'
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            category: e.target.value,
                                        })
                                    }
                                    placeholder={t(
                                        "admin.library.category_placeholder",
                                    )}
                                    value={form.category}
                                />
                                <datalist id='library-category-options'>
                                    {CATEGORIES.map((cat) => (
                                        <option key={cat} value={cat} />
                                    ))}
                                </datalist>
                            </Field>
                            <Field label={t("admin.library.level")}>
                                <select
                                    className={inputClass}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            level: e.target.value,
                                        })
                                    }
                                    value={form.level}
                                >
                                    {LEVELS.map((lvl) => (
                                        <option key={lvl} value={lvl}>
                                            {lvl}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                        </div>
                        <div className='grid gap-4 md:grid-cols-4'>
                            <Field label={t("admin.library.language")}>
                                <select
                                    className={inputClass}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            language: e.target.value,
                                        })
                                    }
                                    value={form.language}
                                >
                                    {LANGUAGES.map((langOpt) => (
                                        <option key={langOpt} value={langOpt}>
                                            {langOpt}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                            <Field label={t("admin.library.format")}>
                                <select
                                    className={inputClass}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            format: e.target.value,
                                        })
                                    }
                                    value={form.format}
                                >
                                    {FORMATS.map((format) => (
                                        <option key={format} value={format}>
                                            {format}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                            <Field label={t("admin.library.status")}>
                                <select
                                    className={inputClass}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            status: e.target.value,
                                        })
                                    }
                                    value={form.status}
                                >
                                    {STATUSES.map((status) => (
                                        <option key={status} value={status}>
                                            {status}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                            <Field label={t("admin.library.pages")}>
                                <input
                                    className={inputClass}
                                    min='0'
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            pages: e.target.value,
                                        })
                                    }
                                    type='number'
                                    value={form.pages}
                                />
                            </Field>
                        </div>
                        <div className='grid gap-4 md:grid-cols-3'>
                            <Field label={t("admin.library.source_type")}>
                                <select
                                    className={inputClass}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            source_type: e.target.value,
                                        })
                                    }
                                    value={form.source_type}
                                >
                                    {SOURCE_TYPES.map((type) => (
                                        <option key={type} value={type}>
                                            {type}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                            <Field label={t("admin.library.license_status")}>
                                <select
                                    className={inputClass}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            license_status: e.target.value,
                                        })
                                    }
                                    value={form.license_status}
                                >
                                    {LICENSE_STATUSES.map((status) => (
                                        <option key={status} value={status}>
                                            {status}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                            <Field label={t("admin.library.source_verified")}>
                                <label className='flex min-h-[38px] items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white px-3 py-2 text-sm text-gray-700 dark:text-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white'>
                                    <input
                                        checked={form.is_source_verified}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                is_source_verified:
                                                    e.target.checked,
                                            })
                                        }
                                        type='checkbox'
                                    />
                                    {t("admin.library.source_verified_hint")}
                                </label>
                            </Field>
                        </div>
                        <Field label={t("admin.library.source_url")}>
                            <input
                                className={inputClass}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        source_url: e.target.value,
                                    })
                                }
                                placeholder={t("admin.library.url_placeholder")}
                                type='url'
                                value={form.source_url}
                            />
                        </Field>
                        <Field label={t("admin.library.resource_file")}>
                            <div className='rounded-lg border border-dashed border-gray-300 dark:border-gray-600 p-3 dark:border-slate-600'>
                                {editId ? (
                                    <div className='space-y-2'>
                                        <input
                                            accept='.pdf,.epub,.html,.htm,application/pdf,application/epub+zip,text/html'
                                            className='block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-emerald-800 dark:text-emerald-300 hover:file:bg-emerald-100 dark:text-gray-300 dark:file:bg-slate-700 dark:file:text-emerald-200'
                                            onChange={(e) =>
                                                setResourceFile(
                                                    e.target.files?.[0] ?? null,
                                                )
                                            }
                                            type='file'
                                        />
                                        <div className='flex flex-wrap items-center gap-2'>
                                            <button
                                                className='rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-600 disabled:opacity-50'
                                                disabled={
                                                    !resourceFile ||
                                                    uploadingResource
                                                }
                                                onClick={uploadResource}
                                                type='button'
                                            >
                                                {uploadingResource
                                                    ? `${t("admin.library.uploading_resource")} ${resourceUploadProgress}%`
                                                    : t(
                                                          "admin.library.upload_resource",
                                                      )}
                                            </button>
                                            {uploadingResource &&
                                                resourceUploadProgress > 0 && (
                                                    <div className='w-full bg-gray-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden'>
                                                        <div
                                                            className='bg-emerald-600 h-1.5 rounded-full transition-all duration-200'
                                                            style={{
                                                                width: `${resourceUploadProgress}%`,
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                            {form.file_name ? (
                                                <>
                                                    <span className='text-xs text-gray-500 dark:text-gray-300 dark:text-gray-400'>
                                                        {form.file_name}{" "}
                                                        {form.file_size_bytes
                                                            ? `· ${Math.round(Number(form.file_size_bytes) / 1024)} KB`
                                                            : ""}
                                                    </span>
                                                    <button
                                                        className='rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 dark:text-red-400 hover:bg-red-50 disabled:opacity-50 dark:border-red-900/60 dark:text-red-300 dark:hover:bg-red-950/30'
                                                        disabled={
                                                            clearingResource
                                                        }
                                                        onClick={clearResource}
                                                        type='button'
                                                    >
                                                        {clearingResource
                                                            ? t(
                                                                  "admin.library.clearing_resource",
                                                              )
                                                            : t(
                                                                  "admin.library.clear_resource",
                                                              )}
                                                    </button>
                                                </>
                                            ) : null}
                                        </div>
                                    </div>
                                ) : (
                                    <p className='text-xs text-gray-500 dark:text-gray-300 dark:text-gray-400'>
                                        {t(
                                            "admin.library.resource_file_save_first",
                                        )}
                                    </p>
                                )}
                            </div>
                        </Field>
                        <Field label={t("admin.library.cover_url")}>
                            <input
                                className={inputClass}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        cover_url: e.target.value,
                                    })
                                }
                                placeholder={t("admin.library.url_placeholder")}
                                type='url'
                                value={form.cover_url}
                            />
                        </Field>
                        <Field label={t("admin.field.description")}>
                            <textarea
                                className={inputClass}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        description: e.target.value,
                                    })
                                }
                                rows={3}
                                value={form.description}
                            />
                        </Field>
                        <div className='grid gap-4 md:grid-cols-2'>
                            <Field label={t("admin.library.tags")}>
                                <input
                                    className={inputClass}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            tags: e.target.value,
                                        })
                                    }
                                    value={form.tags}
                                />
                            </Field>
                            <Field label={t("admin.library.license")}>
                                <input
                                    className={inputClass}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            license: e.target.value,
                                        })
                                    }
                                    value={form.license}
                                />
                            </Field>
                        </div>
                        <Field label={t("admin.library.source_note")}>
                            <textarea
                                className={inputClass}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        source_note: e.target.value,
                                    })
                                }
                                rows={2}
                                value={form.source_note}
                            />
                        </Field>
                    </div>
                    <div className='flex gap-3 border-t border-gray-100 p-5 dark:border-slate-700'>
                        <button
                            className='flex-1 rounded-lg border border-gray-300 dark:border-gray-600 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:border-slate-600 dark:text-gray-300 dark:hover:bg-slate-700'
                            onClick={() => setShowModal(false)}
                        >
                            {t("common.cancel")}
                        </button>
                        <button
                            className='flex-1 rounded-lg bg-emerald-700 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50'
                            disabled={saving || !form.title}
                            onClick={save}
                        >
                            {saving ? t("common.saving") : t("common.save")}
                        </button>
                    </div>
                </ModalShell>
            )}

            {deleteId && (
                <ModalShell
                    onClose={() => setDeleteId(null)}
                    overlayClassName='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'
                    panelClassName='w-full max-w-sm rounded-2xl bg-white p-6 dark:bg-slate-800'
                >
                    <h2 className='mb-2 font-bold text-gray-900 dark:text-gray-100 dark:text-white'>
                        {t("admin.crud.delete_title", {
                            item: t("admin.library.book"),
                        })}
                    </h2>
                    <p className='mb-5 text-sm text-gray-500 dark:text-gray-300 dark:text-gray-400'>
                        {t("admin.crud.delete_body")}
                    </p>
                    <div className='flex gap-3'>
                        <button
                            className='flex-1 rounded-lg border border-gray-300 dark:border-gray-600 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 dark:border-slate-600 dark:text-gray-300'
                            onClick={() => setDeleteId(null)}
                        >
                            {t("common.cancel")}
                        </button>
                        <button
                            className='flex-1 rounded-lg bg-red-600 py-2 text-sm font-medium text-white hover:bg-red-500'
                            onClick={confirmDelete}
                        >
                            {t("common.delete")}
                        </button>
                    </div>
                </ModalShell>
            )}
        </div>
    );
};

const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white";

const Field = ({ children, label }) => (
    <div>
        {/*
         * The control is passed in as children, so the label is bound by
         * wrapping rather than htmlFor — clicking the text still focuses it.
         */}
        <label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200 dark:text-gray-300'>
            <span className='mb-1 block'>{label}</span>
            {children}
        </label>
    </div>
);

export default AdminLibraryPage;
