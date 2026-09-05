"use client";

import { contentReportApi, parseApiError } from "@/lib/api";
import { useLocale } from "@/context/Locale";
import { useEffect, useMemo, useState } from "react";
import { BsCheckCircle, BsXCircle, BsHourglassSplit } from "react-icons/bs";
import ModalShell from "@/components/ModalShell";

const STATUSES = [
    { value: "", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "reviewed", label: "Reviewed" },
    { value: "resolved", label: "Resolved" },
    { value: "rejected", label: "Rejected" },
];

const CATEGORY_LABELS = {
    translation_error: "Translation Error",
    arabic_text_error: "Arabic/Harakat Error",
    tafsir_error: "Tafsir Error",
    sanad_grading_error: "Grading/Sanad Error",
    typo: "Typo",
    other: "Other",
};

const TARGET_LABELS = {
    quran: "Qur'an",
    hadith: "Hadith",
    fiqh: "Fiqh",
    doa: "Doa",
    siroh: "Siroh",
    dzikir: "Dzikir",
    general: "General",
};

const formatDate = (iso) => {
    if (!iso) return "-";
    try {
        return new Date(iso).toLocaleString();
    } catch {
        return iso;
    }
};

const AdminReportsPage = () => {
    const { t, lang } = useLocale();
    const [status, setStatus] = useState("");
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [active, setActive] = useState(null);
    const [saving, setSaving] = useState(false);
    const [adminNote, setAdminNote] = useState("");

    const fb = (type, msg) =>
        window.dispatchEvent(
            new CustomEvent(type, { detail: { message: msg } }),
        );

    const load = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (status) params.set("status", status);
            params.set("limit", "100");
            const r = await contentReportApi.adminList(params);
            const data = await r.json();
            setItems(data?.items || data?.data?.items || []);
        } catch (err) {
            fb("admin:toast-error", parseApiError(err) || "Gagal memuat laporan");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status]);

    const stats = useMemo(() => {
        const counts = { pending: 0, reviewed: 0, resolved: 0, rejected: 0 };
        items.forEach((it) => {
            if (counts[it.status] !== undefined) counts[it.status] += 1;
        });
        return counts;
    }, [items]);

    const updateStatus = async (newStatus) => {
        if (!active) return;
        setSaving(true);
        try {
            const r = await contentReportApi.adminUpdateStatus(active.id, {
                status: newStatus,
                admin_note: adminNote,
            });
            if (!r.ok) {
                const data = await r.json().catch(() => ({}));
                throw new Error(data?.message || "Gagal memperbarui status");
            }
            fb("admin:toast-success", `Status diperbarui: ${newStatus}`);
            setActive(null);
            setAdminNote("");
            await load();
        } catch (err) {
            fb("admin:toast-error", err.message || "Error");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className='p-4 md:p-8 max-w-7xl mx-auto'>
            <div className='mb-6'>
                <h1 className='text-xl md:text-2xl font-bold text-gray-900 dark:text-white'>
                    {lang === "EN"
                        ? "Content Correction Reports"
                        : "Laporan Koreksi Konten"}
                </h1>
                <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
                    {lang === "EN"
                        ? "Review user-submitted correction reports for Qur'an, Hadith, Fiqh, and other dalil content."
                        : "Tinjau laporan koreksi dari user untuk konten Al-Qur'an, Hadits, Fiqh, dan dalil lainnya."}
                </p>
            </div>

            <div className='grid grid-cols-2 md:grid-cols-4 gap-3 mb-6'>
                {[
                    { key: "pending", icon: BsHourglassSplit, color: "text-amber-500" },
                    { key: "reviewed", icon: BsCheckCircle, color: "text-sky-500" },
                    { key: "resolved", icon: BsCheckCircle, color: "text-emerald-500" },
                    { key: "rejected", icon: BsXCircle, color: "text-red-500" },
                ].map(({ key, icon: Icon, color }) => (
                    <div
                        key={key}
                        className='rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4'
                    >
                        <div className='flex items-center gap-2'>
                            <Icon className={color} />
                            <p className='text-xs font-semibold uppercase text-gray-500 dark:text-gray-400'>
                                {key}
                            </p>
                        </div>
                        <p className='mt-2 text-2xl font-bold text-gray-900 dark:text-white'>
                            {stats[key] || 0}
                        </p>
                    </div>
                ))}
            </div>

            <div className='flex items-center gap-2 mb-4'>
                {STATUSES.map((s) => (
                    <button
                        key={s.value}
                        type='button'
                        onClick={() => setStatus(s.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                            status === s.value
                                ? "bg-emerald-600 text-white border-emerald-600"
                                : "bg-white dark:bg-slate-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800"
                        }`}
                    >
                        {s.label}
                    </button>
                ))}
            </div>

            <div className='rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden'>
                <div className='overflow-x-auto'>
                    <table className='w-full text-sm'>
                        <thead className='bg-gray-50 dark:bg-slate-800/60 text-xs uppercase text-gray-500 dark:text-gray-400'>
                            <tr>
                                <th className='px-3 py-2.5 text-left'>Target</th>
                                <th className='px-3 py-2.5 text-left'>Category</th>
                                <th className='px-3 py-2.5 text-left'>Description</th>
                                <th className='px-3 py-2.5 text-left'>Status</th>
                                <th className='px-3 py-2.5 text-left'>Created</th>
                                <th className='px-3 py-2.5 text-right'>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className='px-3 py-6 text-center text-gray-400'
                                    >
                                        Loading...
                                    </td>
                                </tr>
                            )}
                            {!loading && items.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className='px-3 py-6 text-center text-gray-400'
                                    >
                                        {lang === "EN"
                                            ? "No reports found"
                                            : "Belum ada laporan"}
                                    </td>
                                </tr>
                            )}
                            {items.map((it) => (
                                <tr
                                    key={it.id}
                                    className='border-t border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50'
                                >
                                    <td className='px-3 py-2.5'>
                                        <p className='font-semibold text-gray-800 dark:text-gray-200 text-xs'>
                                            {TARGET_LABELS[it.target_type] || it.target_type}
                                        </p>
                                        <p className='text-xs text-gray-500 dark:text-gray-400'>
                                            {it.target_title || it.target_id}
                                        </p>
                                    </td>
                                    <td className='px-3 py-2.5 text-xs text-gray-600 dark:text-gray-400'>
                                        {CATEGORY_LABELS[it.category] || it.category}
                                    </td>
                                    <td className='px-3 py-2.5 text-xs text-gray-700 dark:text-gray-300 max-w-md'>
                                        <p className='line-clamp-2'>{it.description}</p>
                                        {it.correction && (
                                            <p className='mt-1 line-clamp-1 text-emerald-600 dark:text-emerald-400 italic'>
                                                → {it.correction}
                                            </p>
                                        )}
                                    </td>
                                    <td className='px-3 py-2.5 text-xs'>
                                        <span
                                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                                                it.status === "pending"
                                                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                                    : it.status === "resolved"
                                                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                                      : it.status === "rejected"
                                                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                                        : "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400"
                                            }`}
                                        >
                                            {it.status}
                                        </span>
                                    </td>
                                    <td className='px-3 py-2.5 text-xs text-gray-500 dark:text-gray-400'>
                                        {formatDate(it.created_at)}
                                    </td>
                                    <td className='px-3 py-2.5 text-right'>
                                        <button
                                            type='button'
                                            onClick={() => {
                                                setActive(it);
                                                setAdminNote(it.admin_note || "");
                                            }}
                                            className='text-emerald-600 dark:text-emerald-400 hover:underline text-xs font-semibold'
                                        >
                                            Review
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <ModalShell
                isOpen={!!active}
                onClose={() => {
                    setActive(null);
                    setAdminNote("");
                }}
                title='Review Report'
                maxWidth='max-w-2xl'
            >
                {active && (
                    <div className='space-y-4'>
                        <div>
                            <p className='text-xs font-semibold uppercase text-gray-500 dark:text-gray-400'>
                                Target
                            </p>
                            <p className='text-sm font-medium text-gray-900 dark:text-white'>
                                {TARGET_LABELS[active.target_type] || active.target_type} ·{" "}
                                {active.target_title || active.target_id}
                            </p>
                            {active.target_id && (
                                <p className='text-xs text-gray-400 mt-0.5'>
                                    ID: {active.target_id}
                                </p>
                            )}
                        </div>

                        <div>
                            <p className='text-xs font-semibold uppercase text-gray-500 dark:text-gray-400'>
                                Category
                            </p>
                            <p className='text-sm text-gray-700 dark:text-gray-300'>
                                {CATEGORY_LABELS[active.category] || active.category}
                            </p>
                        </div>

                        <div>
                            <p className='text-xs font-semibold uppercase text-gray-500 dark:text-gray-400'>
                                Description
                            </p>
                            <p className='text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line'>
                                {active.description}
                            </p>
                        </div>

                        {active.correction && (
                            <div>
                                <p className='text-xs font-semibold uppercase text-gray-500 dark:text-gray-400'>
                                    User-suggested Correction
                                </p>
                                <p className='text-sm text-emerald-700 dark:text-emerald-400 italic'>
                                    {active.correction}
                                </p>
                            </div>
                        )}

                        <div>
                            <p className='text-xs font-semibold uppercase text-gray-500 dark:text-gray-400'>
                                Reporter
                            </p>
                            <p className='text-sm text-gray-700 dark:text-gray-300'>
                                {active.user?.name || "-"} · {active.user?.email || ""}
                            </p>
                            <p className='text-xs text-gray-400 mt-0.5'>
                                Submitted: {formatDate(active.created_at)}
                            </p>
                        </div>

                        <div>
                            <label className='text-xs font-semibold uppercase text-gray-500 dark:text-gray-400'>
                                Admin Note (optional)
                            </label>
                            <textarea
                                rows={2}
                                value={adminNote}
                                onChange={(e) => setAdminNote(e.target.value)}
                                placeholder='Notes for internal record...'
                                className='mt-1 w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-sm text-gray-800 dark:text-gray-200 focus:border-emerald-500 focus:outline-none'
                            />
                        </div>

                        <div className='flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-800'>
                            <button
                                type='button'
                                disabled={saving}
                                onClick={() => updateStatus("rejected")}
                                className='rounded-lg px-3 py-1.5 text-xs font-medium bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50'
                            >
                                Reject
                            </button>
                            <button
                                type='button'
                                disabled={saving}
                                onClick={() => updateStatus("reviewed")}
                                className='rounded-lg px-3 py-1.5 text-xs font-medium bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/50'
                            >
                                Mark Reviewed
                            </button>
                            <button
                                type='button'
                                disabled={saving}
                                onClick={() => updateStatus("resolved")}
                                className='rounded-lg px-3 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white'
                            >
                                {saving ? "..." : "Resolve"}
                            </button>
                        </div>
                    </div>
                )}
            </ModalShell>
        </div>
    );
};

export default AdminReportsPage;
