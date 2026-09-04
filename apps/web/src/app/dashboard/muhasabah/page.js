"use client";

import { useAuth } from "@/context/Auth";
import { useLocale } from "@/context/Locale";
import { muhasabahApi, streakApi } from "@/lib/api";
import {
    muhasabahCreatePayload,
    normalizeMuhasabah,
    parseApiJson,
    pickItems,
    readLocalArray,
    todayISO,
    writeLocalArray,
} from "@/lib/personalSync";
import { useEffect, useRef, useState } from "react";
import { BsPencilSquare, BsTrash, BsX } from "react-icons/bs";
import { useModalA11y } from "@/lib/useModalA11y";

const MOODS = [
    { value: "baik", label: "Baik", emoji: "😊" },
    { value: "biasa", label: "Biasa", emoji: "😐" },
    { value: "berat", label: "Berat", emoji: "😢" },
    { value: "syukur", label: "Syukur", emoji: "🤲" },
];

const getMoodEmoji = (v) => MOODS.find((m) => m.value === v)?.emoji ?? "😐";

const MuhasabahPage = () => {
    const { t, lang } = useLocale();
    const { isAuthenticated } = useAuth();
    const fb = (type, msg) =>
        window.dispatchEvent(
            new CustomEvent(type, { detail: { message: msg } }),
        );
    const [list, setList] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({
        date: todayISO(),
        mood: "baik",
        content: "",
    });
    const [syncError, setSyncError] = useState("");
    const modalA11y = useModalA11y({
        open: showModal,
        onClose: () => setShowModal(false),
    });
    const textRef = useRef(null);

    useEffect(() => {
        const load = async () => {
            if (isAuthenticated) {
                try {
                    const items = pickItems(
                        await parseApiJson(await muhasabahApi.list()),
                    ).map(normalizeMuhasabah);
                    setList(items);
                    writeLocalArray("tholabul_muhasabah", items);
                    setSyncError("");
                    return;
                } catch {
                    setSyncError(
                        "Belum tersinkron. Menampilkan salinan lokal.",
                    );
                }
            }
            setList(
                readLocalArray("tholabul_muhasabah").map(normalizeMuhasabah),
            );
        };
        load();
    }, [isAuthenticated]);

    useEffect(() => {
        if (showModal && textRef.current) textRef.current.focus();
    }, [showModal]);

    const persist = (updated) => {
        setList(updated);
        writeLocalArray("tholabul_muhasabah", updated);
    };

    const openModal = () => {
        setForm({ date: todayISO(), mood: "baik", content: "" });
        setShowModal(true);
    };

    const save = async () => {
        if (!form.content.trim()) return;
        const entry = { id: Date.now().toString(), ...form };
        persist([entry, ...list]);
        if (isAuthenticated) {
            try {
                const saved = normalizeMuhasabah(
                    await parseApiJson(
                        await muhasabahApi.create(
                            muhasabahCreatePayload(entry),
                        ),
                    ),
                );
                persist([saved, ...list]);
                setSyncError("");
                fb("admin:success", t("admin.crud.save_success"));
            } catch {
                setSyncError(
                    "Muhasabah tersimpan lokal. Sinkron cloud belum berhasil.",
                );
            }
            streakApi.logActivity("muhasabah").catch((e) => console.error(e));
        }
        setShowModal(false);
    };

    const remove = async (id) => {
        if (!confirm(t("muhasabah.delete_confirm"))) return;
        persist(list.filter((e) => e.id !== id));
        if (isAuthenticated) {
            try {
                await parseApiJson(await muhasabahApi.delete(id));
                setSyncError("");
                fb("admin:success", t("admin.crud.delete_success"));
            } catch {
                setSyncError(
                    "Muhasabah dihapus lokal. Sinkron cloud belum berhasil.",
                );
            }
        }
    };

    return (
        <div className='px-4 py-6'>
            <div className='flex items-center justify-between mb-6'>
                <h1 className='text-xl font-bold text-gray-900 dark:text-gray-100 dark:text-white'>
                    {t("muhasabah.title")}
                </h1>
                <button
                    onClick={openModal}
                    className='flex items-center gap-2 px-4 py-2 bg-emerald-700 text-white rounded-lg text-sm font-medium hover:bg-emerald-800 transition-colors'
                >
                    <BsPencilSquare />
                    {t("muhasabah.write_btn")}
                </button>
            </div>
            {syncError ? (
                <div className='mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 dark:text-amber-400 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300'>
                    {syncError}
                </div>
            ) : null}

            {list.length === 0 ? (
                <div className='text-center py-16'>
                    <p className='text-4xl mb-3'>🤲</p>
                    <p className='text-gray-500 dark:text-gray-300 dark:text-gray-400 text-sm'>
                        {t("muhasabah.empty")}
                    </p>
                    <button
                        onClick={openModal}
                        className='mt-4 text-emerald-600 dark:text-emerald-400 text-sm hover:underline'
                    >
                        {t("muhasabah.write_first")}
                    </button>
                </div>
            ) : (
                <ul className='space-y-3'>
                    {list.map((entry) => (
                        <li
                            key={entry.id}
                            className='bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4'
                        >
                            <div className='flex items-start justify-between gap-3'>
                                <div className='flex items-center gap-2 mb-2'>
                                    <span className='text-2xl'>
                                        {getMoodEmoji(entry.mood)}
                                    </span>
                                    <span className='text-xs text-gray-400'>
                                        {entry.date
                                            ? new Date(
                                                  entry.date + "T00:00:00",
                                              ).toLocaleDateString(
                                                  lang === "EN"
                                                      ? "en-US"
                                                      : "id-ID",
                                                  {
                                                      weekday: "long",
                                                      day: "numeric",
                                                      month: "long",
                                                      year: "numeric",
                                                  },
                                              )
                                            : ""}
                                    </span>
                                </div>
                                <button
                                    onClick={() => remove(entry.id)}
                                    aria-label={t("muhasabah.delete")}
                                    className='text-gray-300 dark:text-slate-600 dark:text-slate-300 hover:text-red-500 transition-colors shrink-0'
                                >
                                    <BsTrash />
                                </button>
                            </div>
                            <p className='text-sm text-gray-700 dark:text-gray-200 dark:text-gray-300 leading-relaxed'>
                                {entry.content.length > 100
                                    ? entry.content.slice(0, 100) + "..."
                                    : entry.content}
                            </p>
                        </li>
                    ))}
                </ul>
            )}

            {/* Modal */}
            {showModal && (
                <div
                    className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'
                    onClick={(e) =>
                        e.target === e.currentTarget && setShowModal(false)
                    }
                >
                    <div
                        {...modalA11y}
                        className='bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md mx-4 p-6'
                    >
                        <div className='flex items-center justify-between mb-4'>
                            <h2 className='text-base font-semibold text-gray-900 dark:text-gray-100 dark:text-white'>
                                {t("muhasabah.write_btn")}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className='text-gray-400 hover:text-gray-600 hover:dark:text-gray-300 dark:hover:text-gray-200'
                            >
                                <BsX className='text-xl' />
                            </button>
                        </div>

                        <div className='space-y-4'>
                            <div>
                                <label
                                    htmlFor='page-label-date'
                                    className='block text-xs font-medium text-gray-600 dark:text-gray-300 dark:text-gray-400 mb-1'
                                >
                                    {t("muhasabah.label_date")}
                                </label>
                                <input
                                    id='page-label-date'
                                    type='date'
                                    value={form.date}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            date: e.target.value,
                                        }))
                                    }
                                    className='w-full px-3 py-2 border border-gray-200 dark:border-gray-700 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500'
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor='page-label-mood'
                                    className='block text-xs font-medium text-gray-600 dark:text-gray-300 dark:text-gray-400 mb-1'
                                >
                                    {t("muhasabah.label_mood")}
                                </label>
                                <select
                                    id='page-label-mood'
                                    value={form.mood}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            mood: e.target.value,
                                        }))
                                    }
                                    className='w-full px-3 py-2 border border-gray-200 dark:border-gray-700 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500'
                                >
                                    {MOODS.map((m) => (
                                        <option key={m.value} value={m.value}>
                                            {m.emoji} {m.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label
                                    htmlFor='page-label-notes'
                                    className='block text-xs font-medium text-gray-600 dark:text-gray-300 dark:text-gray-400 mb-1'
                                >
                                    {t("muhasabah.label_notes")}
                                </label>
                                <textarea
                                    id='page-label-notes'
                                    ref={textRef}
                                    value={form.content}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            content: e.target.value,
                                        }))
                                    }
                                    rows={5}
                                    placeholder={t("muhasabah.placeholder")}
                                    className='w-full px-3 py-2 border border-gray-200 dark:border-gray-700 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none'
                                />
                            </div>
                        </div>

                        <div className='flex justify-end gap-2 mt-5'>
                            <button
                                onClick={() => setShowModal(false)}
                                className='px-4 py-2 text-sm text-gray-600 dark:text-gray-300 dark:text-gray-400 hover:text-gray-800 hover:dark:text-gray-200 dark:hover:text-white transition-colors'
                            >
                                {t("common.cancel")}
                            </button>
                            <button
                                onClick={save}
                                disabled={!form.content.trim()}
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

export default MuhasabahPage;
