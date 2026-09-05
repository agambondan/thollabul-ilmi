"use client";

import { contentAuditLogApi, parseApiError } from "@/lib/api";
import { useLocale } from "@/context/Locale";
import { useEffect, useState } from "react";
import { BsClockHistory, BsDownload, BsSearch } from "react-icons/bs";

const TARGET_LABELS = {
    quran: "Qur'an",
    hadith: "Hadith",
    fiqh: "Fiqh",
    doa: "Doa",
    siroh: "Siroh",
    dzikir: "Dzikir",
};

const formatDate = (iso) => {
    if (!iso) return "-";
    try {
        return new Date(iso).toLocaleString();
    } catch {
        return iso;
    }
};

export default function AdminAuditLogsPage() {
    const { lang } = useLocale();
    const [targetType, setTargetType] = useState("");
    const [search, setSearch] = useState("");
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);

    const fb = (type, msg) =>
        window.dispatchEvent(
            new CustomEvent(type, { detail: { message: msg } }),
        );

    const load = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (targetType) params.set("target_type", targetType);
            params.set("limit", "100");
            const r = await contentAuditLogApi.list(params);
            const data = await r.json();
            setItems(data?.items || data?.data?.items || []);
        } catch (err) {
            fb("admin:toast-error", parseApiError(err) || "Gagal memuat log");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [targetType]);

    const handleExportCSV = async () => {
        try {
            const params = new URLSearchParams();
            if (targetType) params.set("target_type", targetType);
            const r = await contentAuditLogApi.export(params);
            if (!r.ok) throw new Error("Gagal export");
            const blob = await r.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `content-audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            fb("admin:toast-success", "Audit log CSV berhasil diunduh");
        } catch (err) {
            fb("admin:toast-error", err.message || "Gagal export CSV");
        }
    };

    const filtered = items.filter((it) => {
        if (!search.trim()) return true;
        const q = search.trim().toLowerCase();
        return (
            (it.target_title || "").toLowerCase().includes(q) ||
            (it.target_id || "").toLowerCase().includes(q) ||
            (it.old_value || "").toLowerCase().includes(q) ||
            (it.new_value || "").toLowerCase().includes(q) ||
            (it.modifier?.name || "").toLowerCase().includes(q)
        );
    });

    return (
        <div className='p-4 md:p-8 max-w-7xl mx-auto'>
            <div className='mb-6'>
                <div className='flex items-center gap-2'>
                    <BsClockHistory className='text-emerald-600 text-xl' />
                    <h1 className='text-xl md:text-2xl font-bold text-gray-900 dark:text-white'>
                        {lang === "EN"
                            ? "Content Change Audit Logs"
                            : "Log Riwayat Perubahan Dalil"}
                    </h1>
                </div>
                <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
                    {lang === "EN"
                        ? "Audit trail of all content and translation modifications made via direct apply or admin review."
                        : "Rekam jejak seluruh perubahan teks dan terjemahan dalil yang telah diterapkan ke database."}
                </p>
            </div>

            <div className='flex flex-wrap items-center justify-between gap-3 mb-4'>
                <div className='flex items-center gap-2'>
                    <select
                        value={targetType}
                        onChange={(e) => setTargetType(e.target.value)}
                        className='rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 focus:border-emerald-500 focus:outline-none'
                    >
                        <option value=''>All Targets</option>
                        {Object.entries(TARGET_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>
                                {v}
                            </option>
                        ))}
                    </select>
                </div>

                <div className='flex items-center gap-2'>
                    <div className='relative'>
                        <BsSearch className='absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs' />
                        <input
                            type='text'
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder='Search logs...'
                            className='pl-7 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-200 focus:border-emerald-500 focus:outline-none w-48'
                        />
                    </div>
                    <button
                        type='button'
                        onClick={handleExportCSV}
                        className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors'
                    >
                        <BsDownload className='text-xs' />
                        Export CSV
                    </button>
                </div>
            </div>

            <div className='rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden'>
                <div className='overflow-x-auto'>
                    <table className='w-full text-sm'>
                        <thead className='bg-gray-50 dark:bg-slate-800/60 text-xs uppercase text-gray-500 dark:text-gray-400'>
                            <tr>
                                <th className='px-3 py-2.5 text-left'>Target</th>
                                <th className='px-3 py-2.5 text-left'>Field</th>
                                <th className='px-3 py-2.5 text-left'>Before</th>
                                <th className='px-3 py-2.5 text-left'>After</th>
                                <th className='px-3 py-2.5 text-left'>Modifier</th>
                                <th className='px-3 py-2.5 text-left'>Timestamp</th>
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
                            {!loading && filtered.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className='px-3 py-6 text-center text-gray-400'
                                    >
                                        {lang === "EN"
                                            ? "No audit logs found"
                                            : "Belum ada riwayat perubahan"}
                                    </td>
                                </tr>
                            )}
                            {filtered.map((it) => (
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
                                    <td className='px-3 py-2.5 text-xs text-gray-600 dark:text-gray-400 font-mono'>
                                        {it.field}
                                    </td>
                                    <td className='px-3 py-2.5 text-xs text-red-600 dark:text-red-400 max-w-xs line-clamp-2'>
                                        {it.old_value || "(kosong)"}
                                    </td>
                                    <td className='px-3 py-2.5 text-xs text-emerald-600 dark:text-emerald-400 max-w-xs line-clamp-2 font-medium'>
                                        {it.new_value}
                                    </td>
                                    <td className='px-3 py-2.5 text-xs text-gray-700 dark:text-gray-300'>
                                        {it.modifier?.name || "Admin"}
                                        {it.reason && (
                                            <p className='text-[10px] text-gray-400 italic'>
                                                {it.reason}
                                            </p>
                                        )}
                                    </td>
                                    <td className='px-3 py-2.5 text-xs text-gray-500 dark:text-gray-400'>
                                        {formatDate(it.created_at)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
