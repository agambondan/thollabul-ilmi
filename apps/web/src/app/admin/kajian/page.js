"use client";

import {
    applySort,
    PanelFilterCheckboxGroup,
    PanelPagination,
    PanelTable,
    Td,
    Th,
    toggleSort,
    Tr,
} from "@/components/panel/DataPanel";
import { adminKajianApi, parseApiError } from "@/lib/api";
import { useLocale } from "@/context/Locale";
import { getLocalizedField } from "@/lib/translation";
import { useEffect, useMemo, useState } from "react";
import {
    BsBoxArrowUpRight,
    BsCameraVideo,
    BsPencil,
    BsPlusCircle,
    BsTrash,
    BsX,
} from "react-icons/bs";
import ModalShell from "@/components/ModalShell";

// Quick-pick values for the free-text `topic` field (channel focus tags) —
// not the same as the real `category` enum below.
const TOPIC_QUICK_OPTIONS = [
    "aqidah",
    "fiqh",
    "akhlak",
    "tafsir",
    "hadits",
    "sirah",
    "tahsin",
    "umum",
];
// Mirrors model.KajianCategory in services/api/app/model/kajian.go.
const CATEGORIES = [
    "akidah_tauhid",
    "tafsir_quran",
    "hadis_sunnah",
    "fikih_ibadah",
    "fikih_muamalah",
    "akhlak_adab",
    "tazkiyatun_nufus",
    "sirah_sejarah",
    "keluarga_parenting",
    "umum",
];
const TYPES = ["video", "audio", "text"];

const parseDurationSeconds = (value) => {
    if (typeof value === "number") return value;
    const raw = String(value ?? "").trim();
    if (!raw) return 0;
    if (!raw.includes(":")) return Number(raw) || 0;
    return raw
        .split(":")
        .map((part) => Number(part) || 0)
        .reduce((total, part) => total * 60 + part, 0);
};

const formatDuration = (value) => {
    const totalSeconds = parseDurationSeconds(value);
    if (!totalSeconds) return "";
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const mm = hours > 0 ? String(minutes).padStart(2, "0") : minutes;
    const ss = String(seconds).padStart(2, "0");
    return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
};

const DurationBadge = ({ duration }) => {
    const label = formatDuration(duration);
    if (!label) return null;
    return (
        <span className='absolute bottom-0.5 right-0.5 px-1 rounded bg-black/75 text-white text-[10px] leading-tight font-medium'>
            {label}
        </span>
    );
};

const KajianThumbnail = ({ src, alt, className, duration, onClick }) => {
    const [failed, setFailed] = useState(false);

    if (!src || failed) {
        return (
            <div
                className={`relative flex items-center justify-center bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-gray-500 ${className}`}
            >
                <BsCameraVideo />
                <DurationBadge duration={duration} />
            </div>
        );
    }

    return (
        <button
            type='button'
            onClick={onClick}
            className={`relative block overflow-hidden ${className}`}
        >
            <img
                src={src}
                alt={alt}
                onError={() => setFailed(true)}
                className='w-full h-full object-cover'
            />
            <DurationBadge duration={duration} />
        </button>
    );
};

const EMPTY_FORM = {
    title: "",
    speaker: "",
    topic: "umum",
    category: "umum",
    type: "video",
    url: "",
    duration_seconds: "",
    description: "",
    thumbnail_url: "",
    published_at: "",
};

const AdminStudiesPage = () => {
    const { t, lang } = useLocale();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [search, setSearch] = useState("");
    const [topicFilters, setTopicFilters] = useState([]);
    const [categoryFilters, setCategoryFilters] = useState([]);
    const [sort, setSort] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const load = async () => {
        setLoading(true);
        try {
            const r = await adminKajianApi.list(0, 500);
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
            title: item.title ?? "",
            speaker: item.speaker ?? item.ustadz ?? "",
            topic: item.topic ?? "umum",
            category: item.category ?? "umum",
            type: item.type ?? "video",
            url: item.url ?? "",
            duration_seconds: item.duration_seconds ?? item.duration ?? "",
            description:
                getLocalizedField(item, "description", lang) ||
                item.description ||
                "",
            thumbnail_url: item.thumbnail_url ?? item.thumbnail ?? "",
            published_at: item.published_at ?? "",
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
            const payload = {
                title: form.title,
                speaker: form.speaker,
                topic: form.topic,
                category: form.category,
                type: form.type,
                url: form.url,
                duration_seconds: parseDurationSeconds(form.duration_seconds),
                description: form.description,
                thumbnail_url: form.thumbnail_url,
                published_at: form.published_at,
            };
            let res;
            if (editId) {
                res = await adminKajianApi.update(editId, payload);
            } else {
                res = await adminKajianApi.create(payload);
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

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            const res = await adminKajianApi.delete(deleteId);
            if (!res.ok)
                throw new Error(
                    await parseApiError(res, t("admin.error.save")),
                );
            setDeleteId(null);
            load();
            fb("admin:success", t("admin.crud.delete_success"));
        } catch (err) {
            fb("admin:mutation-error", err.message);
        }
    };

    // `topic` isn't a clean single category — it's a comma-joined set of
    // sub-topic phrases scraped per channel (e.g. "Fikih muamalah dasar,
    // Fikih ibadah harian, ..."), matching how the backend itself treats it
    // (`topic ILIKE '%<value>%'` in kajian_repository.go), so the filter
    // checks substring containment against each distinct segment rather than
    // exact equality — an exact match against the whole string would never
    // hit since no video's `topic` equals a single short label.
    const topicOptions = useMemo(() => {
        const segments = new Set();
        for (const item of items) {
            for (const part of (item.topic ?? "").split(",")) {
                const trimmed = part.trim();
                if (trimmed) segments.add(trimmed);
            }
        }
        return [...segments]
            .sort((a, b) => a.localeCompare(b))
            .map((value) => ({ value, label: value }));
    }, [items]);

    const categoryOptions = useMemo(
        () =>
            CATEGORIES.map((value) => ({
                value,
                label: t(`admin.kajian.category_${value}`),
            })),
        [t],
    );

    const filtered = items.filter((i) => {
        const q = search.toLowerCase();
        const matchesSearch =
            getLocalizedField(i, "title", lang)?.toLowerCase().includes(q) ||
            getLocalizedField(i, "description", lang)
                ?.toLowerCase()
                .includes(q) ||
            i.speaker?.toLowerCase().includes(q) ||
            i.topic?.toLowerCase().includes(q);
        const matchesTopic =
            topicFilters.length === 0 ||
            topicFilters.some((segment) => i.topic?.includes(segment));
        const matchesCategory =
            categoryFilters.length === 0 ||
            categoryFilters.includes(i.category ?? "umum");
        return matchesSearch && matchesTopic && matchesCategory;
    });

    const sorted = applySort(filtered, sort, {
        title: (a, b) =>
            (getLocalizedField(a, "title", lang) ?? "").localeCompare(
                getLocalizedField(b, "title", lang) ?? "",
            ),
        topic: (a, b) => (a.topic ?? "").localeCompare(b.topic ?? ""),
        category: (a, b) =>
            (a.category ?? "").localeCompare(b.category ?? ""),
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
                <div>
                    <h1 className='text-xl font-bold text-gray-900 dark:text-white'>
                        {t("admin.nav.studies")}
                    </h1>
                    <p className='text-sm text-gray-500 dark:text-gray-400'>
                        {items.length} {t("admin.kajian.studies_unit")}
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className='flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors'
                >
                    <BsPlusCircle />
                    {t("admin.kajian.add_study")}
                </button>
            </div>

            <div className='mb-4 flex flex-wrap items-center gap-3'>
                <input
                    type='text'
                    placeholder={t("admin.kajian.search_placeholder")}
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                    }}
                    className='w-full max-w-xs px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white'
                />
                <PanelFilterCheckboxGroup
                    label={t("admin.field.category")}
                    selected={categoryFilters}
                    onChange={(values) => {
                        setCategoryFilters(values);
                        setPage(1);
                    }}
                    options={categoryOptions}
                />
                <PanelFilterCheckboxGroup
                    label={t("admin.field.topic")}
                    selected={topicFilters}
                    onChange={(values) => {
                        setTopicFilters(values);
                        setPage(1);
                    }}
                    options={topicOptions}
                />
            </div>

            <PanelPagination
                page={currentPage}
                pageCount={pageCount}
                total={filtered.length}
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
                <p className='text-sm text-gray-500 dark:text-gray-300'>
                    {t("common.loading")}
                </p>
            ) : filtered.length === 0 ? (
                <p className='text-sm text-gray-500 dark:text-gray-300'>
                    {t("admin.crud.no_data")}
                </p>
            ) : (
                <>
                    {/* Mobile: stacked cards so every field is reachable without
                        horizontal scrolling. */}
                    <div className='space-y-3 md:hidden'>
                        {visible.map((item) => (
                            <div
                                key={item.id ?? item._id}
                                className='rounded-xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-4'
                            >
                                <div className='flex items-start justify-between gap-2 mb-2'>
                                    <div className='flex items-start gap-3 min-w-0'>
                                        <KajianThumbnail
                                            src={
                                                item.thumbnail_url ??
                                                item.thumbnail
                                            }
                                            alt=''
                                            duration={
                                                item.duration_seconds ??
                                                item.duration
                                            }
                                            className='w-16 h-10 rounded-lg shrink-0'
                                            onClick={() =>
                                                setPreviewImage({
                                                    src:
                                                        item.thumbnail_url ??
                                                        item.thumbnail,
                                                    title: getLocalizedField(
                                                        item,
                                                        "title",
                                                        lang,
                                                    ),
                                                    duration:
                                                        item.duration_seconds ??
                                                        item.duration,
                                                })
                                            }
                                        />
                                        <p className='font-medium text-gray-900 dark:text-white'>
                                            {getLocalizedField(
                                                item,
                                                "title",
                                                lang,
                                            )}
                                        </p>
                                    </div>
                                    <div className='flex items-center gap-1 shrink-0'>
                                        {item.url && (
                                            <a
                                                href={item.url}
                                                target='_blank'
                                                rel='noreferrer'
                                                className='p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                                            >
                                                <BsBoxArrowUpRight />
                                            </a>
                                        )}
                                        <button
                                            onClick={() => openEdit(item)}
                                            aria-label={t("common.edit")}
                                            className='p-1 text-blue-600 hover:text-blue-700 dark:hover:text-blue-400'
                                        >
                                            <BsPencil />
                                        </button>
                                        <button
                                            onClick={() =>
                                                setDeleteId(item.id ?? item._id)
                                            }
                                            aria-label={t("common.delete")}
                                            className='p-1 text-red-600 hover:text-red-700 dark:hover:text-red-400'
                                        >
                                            <BsTrash />
                                        </button>
                                    </div>
                                </div>
                                <div className='flex flex-wrap items-center gap-2 mb-1'>
                                    <span className='px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded text-xs capitalize'>
                                        {item.type ?? "-"}
                                    </span>
                                    <span className='px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded text-xs'>
                                        {t(
                                            `admin.kajian.category_${item.category ?? "umum"}`,
                                        )}
                                    </span>
                                    <span className='text-xs text-gray-500 dark:text-gray-400 capitalize'>
                                        {item.topic}
                                    </span>
                                </div>
                                <p className='text-xs text-gray-500 dark:text-gray-400'>
                                    {item.speaker ?? "-"}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Desktop: full table. */}
                    <div className='hidden md:block'>
                        <PanelTable
                            head={
                                <>
                                    <Th className='w-24'></Th>
                                    <Th
                                        sortKey='title'
                                        activeSort={sort}
                                        onSort={(key) =>
                                            setSort((s) => toggleSort(s, key))
                                        }
                                    >
                                        {t("admin.field.title")}
                                    </Th>
                                    <Th className='hidden md:table-cell'>
                                        Ustadz
                                    </Th>
                                    <Th className='w-24'>Tipe</Th>
                                    <Th
                                        className='w-32 hidden lg:table-cell'
                                        sortKey='category'
                                        activeSort={sort}
                                        onSort={(key) =>
                                            setSort((s) => toggleSort(s, key))
                                        }
                                    >
                                        {t("admin.field.category")}
                                    </Th>
                                    <Th
                                        className='w-24 hidden lg:table-cell'
                                        sortKey='topic'
                                        activeSort={sort}
                                        onSort={(key) =>
                                            setSort((s) => toggleSort(s, key))
                                        }
                                    >
                                        {t("admin.field.topic")}
                                    </Th>
                                    <Th className='w-24'></Th>
                                </>
                            }
                        >
                            {visible.map((item) => (
                                <Tr key={item.id ?? item._id}>
                                    <Td>
                                        <KajianThumbnail
                                            src={
                                                item.thumbnail_url ??
                                                item.thumbnail
                                            }
                                            alt=''
                                            duration={
                                                item.duration_seconds ??
                                                item.duration
                                            }
                                            className='w-20 h-12 rounded-lg'
                                            onClick={() =>
                                                setPreviewImage({
                                                    src:
                                                        item.thumbnail_url ??
                                                        item.thumbnail,
                                                    title: getLocalizedField(
                                                        item,
                                                        "title",
                                                        lang,
                                                    ),
                                                    duration:
                                                        item.duration_seconds ??
                                                        item.duration,
                                                })
                                            }
                                        />
                                    </Td>
                                    <Td className='text-gray-900 dark:text-white font-medium max-w-xs truncate'>
                                        {getLocalizedField(item, "title", lang)}
                                    </Td>
                                    <Td className='text-gray-500 dark:text-gray-400 hidden md:table-cell'>
                                        {item.speaker ?? "-"}
                                    </Td>
                                    <Td>
                                        <span className='px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded text-xs capitalize'>
                                            {item.type ?? "-"}
                                        </span>
                                    </Td>
                                    <Td className='text-gray-500 dark:text-gray-400 hidden lg:table-cell'>
                                        <span className='px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded text-xs'>
                                            {t(
                                                `admin.kajian.category_${item.category ?? "umum"}`,
                                            )}
                                        </span>
                                    </Td>
                                    <Td className='text-gray-500 dark:text-gray-400 hidden lg:table-cell capitalize'>
                                        {item.topic}
                                    </Td>
                                    <Td>
                                        <div className='flex items-center gap-1.5 justify-end'>
                                            {item.url && (
                                                <a
                                                    href={item.url}
                                                    target='_blank'
                                                    rel='noreferrer'
                                                    className='p-1.5 text-gray-400 hover:text-gray-600 hover:dark:text-gray-300 rounded'
                                                >
                                                    <BsBoxArrowUpRight />
                                                </a>
                                            )}
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
                                    </Td>
                                </Tr>
                            ))}
                        </PanelTable>
                    </div>
                </>
            )}

            {showModal && (
                <ModalShell
                    onClose={() => setShowModal(false)}
                    overlayClassName='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'
                    panelClassName='bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto'
                >
                    <div className='flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-700'>
                        <h2 className='font-bold text-gray-900 dark:text-white'>
                            {editId
                                ? t("admin.kajian.edit_study")
                                : t("admin.kajian.add_study")}
                        </h2>
                        <button
                            onClick={() => setShowModal(false)}
                            className='p-1 text-gray-400 hover:text-gray-600 hover:dark:text-gray-300 dark:hover:text-gray-200'
                        >
                            <BsX className='text-xl' />
                        </button>
                    </div>
                    <div className='p-5 space-y-4'>
                        <div>
                            <label
                                htmlFor='page-title'
                                className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
                            >
                                {t("admin.field.title")}
                            </label>
                            <input
                                id='page-title'
                                type='text'
                                value={form.title}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        title: e.target.value,
                                    })
                                }
                                className='w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white'
                            />
                        </div>
                        <div className='grid grid-cols-2 gap-4'>
                            <div>
                                <label
                                    htmlFor='page-ustadz'
                                    className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
                                >
                                    Ustadz
                                </label>
                                <input
                                    id='page-ustadz'
                                    type='text'
                                    value={form.speaker}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            speaker: e.target.value,
                                        })
                                    }
                                    className='w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white'
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor='page-duration'
                                    className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
                                >
                                    {t("admin.kajian.duration")}
                                </label>
                                <input
                                    id='page-duration'
                                    type='text'
                                    value={form.duration_seconds}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            duration_seconds: e.target.value,
                                        })
                                    }
                                    placeholder={t(
                                        "admin.kajian.duration_placeholder",
                                    )}
                                    className='w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white'
                                />
                            </div>
                        </div>
                        <div className='grid grid-cols-2 gap-4'>
                            <div>
                                <label
                                    htmlFor='page-tipe'
                                    className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
                                >
                                    Tipe
                                </label>
                                <select
                                    id='page-tipe'
                                    value={form.type}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            type: e.target.value,
                                        })
                                    }
                                    className='w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white'
                                >
                                    {TYPES.map((p) => (
                                        <option key={p} value={p}>
                                            {p}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label
                                    htmlFor='page-category'
                                    className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
                                >
                                    {t("admin.field.category")}
                                </label>
                                <select
                                    id='page-category'
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
                                            {t(`admin.kajian.category_${c}`)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label
                                htmlFor='page-topic'
                                className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
                            >
                                {t("admin.field.topic")}
                            </label>
                            <select
                                id='page-topic'
                                value={form.topic}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        topic: e.target.value,
                                    })
                                }
                                className='w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white'
                            >
                                {TOPIC_QUICK_OPTIONS.map((c) => (
                                    <option key={c} value={c}>
                                        {c}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label
                                htmlFor='page-url'
                                className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
                            >
                                URL
                            </label>
                            <input
                                id='page-url'
                                type='url'
                                value={form.url}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        url: e.target.value,
                                    })
                                }
                                placeholder={t("admin.kajian.url_placeholder")}
                                className='w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white'
                            />
                        </div>
                        <div>
                            <label
                                htmlFor='page-thumbnail-url'
                                className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
                            >
                                {t("admin.kajian.thumbnail_url")}
                            </label>
                            <input
                                id='page-thumbnail-url'
                                type='url'
                                value={form.thumbnail_url}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        thumbnail_url: e.target.value,
                                    })
                                }
                                placeholder={t("admin.kajian.url_placeholder")}
                                className='w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white'
                            />
                        </div>
                        <div>
                            <label
                                htmlFor='page-description'
                                className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
                            >
                                {t("admin.field.description")}
                            </label>
                            <textarea
                                id='page-description'
                                value={form.description}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        description: e.target.value,
                                    })
                                }
                                rows={2}
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
                            disabled={
                                saving || !form.title.trim() || !form.type
                            }
                            className='flex-1 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium'
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
                    panelClassName='bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm p-6'
                >
                    <h2 className='font-bold text-gray-900 dark:text-white mb-2'>
                        {t("admin.crud.delete_title", {
                            item: t("admin.kajian.study"),
                        })}
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
                </ModalShell>
            )}

            {previewImage && (
                <ModalShell
                    onClose={() => setPreviewImage(null)}
                    overlayClassName='fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4'
                    panelClassName='relative w-full max-w-3xl max-h-[85vh]'
                    label={previewImage.title}
                >
                    <button
                        onClick={() => setPreviewImage(null)}
                        aria-label={t("common.close")}
                        className='absolute -top-3 -right-3 z-10 p-1.5 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 rounded-full shadow-lg'
                    >
                        <BsX className='text-xl' />
                    </button>
                    <img
                        src={previewImage.src}
                        alt={previewImage.title}
                        className='w-full max-h-[85vh] object-contain rounded-xl bg-black'
                    />
                    {previewImage.title && (
                        <p className='mt-2 text-center text-sm text-white'>
                            {previewImage.title}
                            {formatDuration(previewImage.duration) && (
                                <span className='text-gray-300'>
                                    {" "}
                                    · {formatDuration(previewImage.duration)}
                                </span>
                            )}
                        </p>
                    )}
                </ModalShell>
            )}
        </div>
    );
};

export default AdminStudiesPage;
