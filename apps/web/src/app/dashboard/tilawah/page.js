"use client";

import { useAuth } from "@/context/Auth";
import { useLocale } from "@/context/Locale";
import { streakApi, tilawahApi } from "@/lib/api";
import { useEffect, useState } from "react";
import { BsJournalCheck, BsX } from "react-icons/bs";

const todayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const isSameWeek = (dateStr) => {
    const d = new Date(dateStr + "T00:00:00");
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    return d >= startOfWeek;
};

const isSameMonth = (dateStr) => {
    const d = new Date(dateStr + "T00:00:00");
    const now = new Date();
    return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    );
};

const emptyForm = () => ({
    surah: "",
    ayahFrom: "",
    ayahTo: "",
    pages: "",
    notes: "",
});

const normalizeEntry = (entry) => ({
    id: String(entry.id ?? Date.now()),
    date: entry.date ?? todayStr(),
    surah: entry.surah ?? entry.title ?? "Tilawah",
    ayahFrom: entry.ayahFrom ?? entry.ayah_from ?? "",
    ayahTo: entry.ayahTo ?? entry.ayah_to ?? "",
    pages: Number(entry.pages ?? entry.pages_read ?? 0),
    notes: entry.notes ?? entry.note ?? "",
});

const TilawahPage = () => {
    const { t, lang } = useLocale();
    const { isAuthenticated } = useAuth();
    const [entries, setEntries] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState(emptyForm());
    const [syncError, setSyncError] = useState("");

    useEffect(() => {
        const load = async () => {
            if (isAuthenticated) {
                try {
                    const res = await tilawahApi.list();
                    if (!res.ok) throw new Error("failed");
                    const json = await res.json();
                    const items = json?.items ?? json?.data ?? json ?? [];
                    if (Array.isArray(items)) {
                        const normalized = items.map(normalizeEntry);
                        setEntries(normalized);
                        localStorage.setItem(
                            "tholabul_tilawah",
                            JSON.stringify(normalized),
                        );
                        setSyncError("");
                        return;
                    }
                } catch {
                    setSyncError(
                        "Belum bisa memuat tilawah dari server. Cache perangkat ditampilkan.",
                    );
                }
            }

            try {
                const local = JSON.parse(
                    localStorage.getItem("tholabul_tilawah") ?? "[]",
                );
                setEntries(
                    Array.isArray(local) ? local.map(normalizeEntry) : [],
                );
            } catch {}
        };

        load();
    }, [isAuthenticated]);

    const persist = (updated) => {
        setEntries(updated);
        try {
            localStorage.setItem("tholabul_tilawah", JSON.stringify(updated));
        } catch {}
    };

    const save = () => {
        if (!form.surah.trim()) return;
        const pages = Number(form.pages) || 0;
        const entry = {
            id: Date.now().toString(),
            date: todayStr(),
            surah: form.surah,
            ayahFrom: form.ayahFrom,
            ayahTo: form.ayahTo,
            pages,
            notes: form.notes,
        };
        persist([entry, ...entries]);
        if (isAuthenticated) {
            setSyncError("");
            if (pages > 0) {
                tilawahApi.add(pages, 0, form.notes, entry.date).catch(() => {
                    setSyncError(
                        "Catatan tilawah tersimpan di perangkat, tetapi belum tersinkron ke server.",
                    );
                });
            }
            streakApi.logActivity("tilawah").catch((e) => console.error(e));
        }
        setShowModal(false);
    };

    const todayEntry = entries.find((e) => e.date === todayStr());
    const pagesWeek = entries
        .filter((e) => isSameWeek(e.date))
        .reduce((s, e) => s + (e.pages ?? 0), 0);
    const pagesMonth = entries
        .filter((e) => isSameMonth(e.date))
        .reduce((s, e) => s + (e.pages ?? 0), 0);
    const recent = entries.slice(0, 10);

    return (
        <div className='px-4 py-6'>
            <div className='flex items-center justify-between mb-6'>
                <h1 className='text-xl font-bold text-gray-900 dark:text-white'>
                    {t("tilawah.title")}
                </h1>
                <button
                    onClick={() => {
                        setForm(emptyForm());
                        setShowModal(true);
                    }}
                    className='flex items-center gap-2 px-4 py-2 bg-emerald-700 text-white rounded-lg text-sm font-medium hover:bg-emerald-800 transition-colors'
                >
                    <BsJournalCheck />
                    {t("tilawah.log_btn")}
                </button>
            </div>
            {syncError ? (
                <div className='mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300'>
                    {syncError}
                </div>
            ) : null}

            {/* Today's entry */}
            {todayEntry ? (
                <div className='bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-xl p-4 mb-5'>
                    <p className='text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1'>
                        {t("tilawah.today_done")} ✓
                    </p>
                    <p className='text-sm font-medium text-gray-800 dark:text-white'>
                        {todayEntry.surah}
                        {todayEntry.ayahFrom
                            ? ` (${t("common.verse")} ${todayEntry.ayahFrom}–${todayEntry.ayahTo ?? todayEntry.ayahFrom})`
                            : ""}
                    </p>
                    <p className='text-xs text-gray-500 dark:text-gray-400 mt-0.5'>
                        {todayEntry.pages} {t("tilawah.pages_unit")}
                        {todayEntry.notes ? ` · ${todayEntry.notes}` : ""}
                    </p>
                </div>
            ) : (
                <div className='bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4 mb-5'>
                    <p className='text-sm text-amber-700 dark:text-amber-400'>
                        {t("tilawah.not_today")}{" "}
                        <button
                            onClick={() => {
                                setForm(emptyForm());
                                setShowModal(true);
                            }}
                            className='underline font-medium'
                        >
                            {t("tilawah.log_now")}
                        </button>
                    </p>
                </div>
            )}

            {/* Summary */}
            <div className='grid grid-cols-2 gap-3 mb-6'>
                <div className='bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4 text-center'>
                    <p className='text-2xl font-bold text-emerald-700 dark:text-emerald-400'>
                        {pagesWeek}
                    </p>
                    <p className='text-xs text-gray-500 dark:text-gray-400 mt-0.5'>
                        {t("tilawah.pages_week")}
                    </p>
                </div>
                <div className='bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4 text-center'>
                    <p className='text-2xl font-bold text-blue-600 dark:text-blue-400'>
                        {pagesMonth}
                    </p>
                    <p className='text-xs text-gray-500 dark:text-gray-400 mt-0.5'>
                        {t("tilawah.pages_month")}
                    </p>
                </div>
            </div>

            {/* Recent entries */}
            {recent.length > 0 && (
                <div className='bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden'>
                    <div className='px-5 py-3 border-b border-gray-100 dark:border-slate-700'>
                        <p className='text-sm font-semibold text-gray-700 dark:text-gray-300'>
                            {t("tilawah.recent_title")}
                        </p>
                    </div>
                    <table className='w-full text-sm'>
                        <thead>
                            <tr className='text-xs text-gray-400 dark:text-gray-500 border-b border-gray-50 dark:border-slate-700'>
                                <th className='text-left px-4 py-2 font-medium'>
                                    {t("tilawah.date_col")}
                                </th>
                                <th className='text-left px-4 py-2 font-medium'>
                                    {t("tilawah.surah_col")}
                                </th>
                                <th className='text-right px-4 py-2 font-medium'>
                                    {t("tilawah.page_col")}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {recent.map((e) => (
                                <tr
                                    key={e.id}
                                    className='border-b border-gray-50 dark:border-slate-700/50 last:border-0'
                                >
                                    <td className='px-4 py-2.5 text-gray-500 dark:text-gray-400 text-xs'>
                                        {new Date(
                                            e.date + "T00:00:00",
                                        ).toLocaleDateString(
                                            lang === "EN" ? "en-US" : "id-ID",
                                            { day: "numeric", month: "short" },
                                        )}
                                    </td>
                                    <td className='px-4 py-2.5 text-gray-700 dark:text-gray-300 text-sm'>
                                        {e.surah}
                                        {e.ayahFrom
                                            ? ` ${e.ayahFrom}–${e.ayahTo ?? e.ayahFrom}`
                                            : ""}
                                    </td>
                                    <td className='px-4 py-2.5 text-right text-emerald-600 dark:text-emerald-400 font-medium'>
                                        {e.pages}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div
                    className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'
                    onClick={(e) =>
                        e.target === e.currentTarget && setShowModal(false)
                    }
                >
                    <div className='bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md mx-4 p-6'>
                        <div className='flex items-center justify-between mb-4'>
                            <h2 className='text-base font-semibold text-gray-900 dark:text-white'>
                                {t("tilawah.modal_title")}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                            >
                                <BsX className='text-xl' />
                            </button>
                        </div>

                        <div className='space-y-3'>
                            <div>
                                <label className='block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1'>
                                    {t("tilawah.label_surah")}
                                </label>
                                <input
                                    type='text'
                                    value={form.surah}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            surah: e.target.value,
                                        }))
                                    }
                                    placeholder={t("tilawah.surah_placeholder")}
                                    className='w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500'
                                />
                            </div>
                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1'>
                                        {t("tilawah.label_ayah_from")}
                                    </label>
                                    <input
                                        type='number'
                                        min='1'
                                        value={form.ayahFrom}
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                ayahFrom: e.target.value,
                                            }))
                                        }
                                        placeholder='1'
                                        className='w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500'
                                    />
                                </div>
                                <div>
                                    <label className='block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1'>
                                        {t("tilawah.label_ayah_to")}
                                    </label>
                                    <input
                                        type='number'
                                        min='1'
                                        value={form.ayahTo}
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                ayahTo: e.target.value,
                                            }))
                                        }
                                        placeholder='30'
                                        className='w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500'
                                    />
                                </div>
                            </div>
                            <div>
                                <label className='block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1'>
                                    {t("tilawah.label_pages")}
                                </label>
                                <input
                                    type='number'
                                    min='0'
                                    value={form.pages}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            pages: e.target.value,
                                        }))
                                    }
                                    placeholder='2'
                                    className='w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500'
                                />
                            </div>
                            <div>
                                <label className='block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1'>
                                    {t("tilawah.label_notes")}
                                </label>
                                <input
                                    type='text'
                                    value={form.notes}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            notes: e.target.value,
                                        }))
                                    }
                                    placeholder={t("tilawah.notes_placeholder")}
                                    className='w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500'
                                />
                            </div>
                        </div>

                        <div className='flex justify-end gap-2 mt-5'>
                            <button
                                onClick={() => setShowModal(false)}
                                className='px-4 py-2 text-sm text-gray-600 dark:text-gray-400'
                            >
                                {t("common.cancel")}
                            </button>
                            <button
                                onClick={save}
                                disabled={!form.surah.trim()}
                                className='px-4 py-2 bg-emerald-700 text-white rounded-lg text-sm font-medium hover:bg-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors'
                            >
                                {t("common.save")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TilawahPage;
