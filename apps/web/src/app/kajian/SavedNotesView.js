"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/Auth";
import { useLocale } from "@/context/Locale";
import { kajianNoteApi, parseApiJson } from "@/lib/api";

const formatTime = (seconds) => {
    const s = Math.floor(Number(seconds) || 0);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) {
        return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    }
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

export default function SavedNotesView({ onPlayNote }) {
    const { t } = useLocale();
    const { isAuthenticated } = useAuth();
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState(null);

    useEffect(() => {
        let isMounted = true;
        const load = async () => {
            setLoading(true);
            const localNotes = [];

            // 1. Read local notes from localStorage
            if (typeof window !== "undefined") {
                for (let i = 0; i < window.localStorage.length; i += 1) {
                    const key = window.localStorage.key(i);
                    if (!key || !key.startsWith("kajian-notes:")) continue;
                    const idPart = key.replace("kajian-notes:", "");
                    try {
                        const parsed = JSON.parse(
                            window.localStorage.getItem(key) || "[]",
                        );
                        if (Array.isArray(parsed)) {
                            parsed.forEach((n) => {
                                localNotes.push({
                                    ...n,
                                    kajianId: idPart.startsWith("yt_")
                                        ? null
                                        : Number(idPart),
                                    videoId: idPart.startsWith("yt_")
                                        ? idPart.replace("yt_", "")
                                        : null,
                                });
                            });
                        }
                    } catch {}
                }
            }

            // 2. If logged in, fetch cloud notes
            if (isAuthenticated) {
                try {
                    const res = await kajianNoteApi.list();
                    if (res.ok) {
                        const data = await parseApiJson(res);
                        const items = Array.isArray(data?.items) ? data.items : [];
                        items.forEach((item) => {
                            localNotes.push({
                                id: item.id,
                                start: item.start_sec,
                                end: item.end_sec,
                                text: item.content,
                                createdAt: item.created_at,
                                kajianId: item.kajian_id,
                                kajian: item.kajian,
                                isCloud: true,
                            });
                        });
                    }
                } catch {}
            }

            if (!isMounted) return;

            // Deduplicate by ID
            const uniqueMap = new Map();
            localNotes.forEach((n) => {
                const key = String(n.id);
                if (!uniqueMap.has(key)) {
                    uniqueMap.set(key, n);
                }
            });

            const sorted = Array.from(uniqueMap.values()).sort(
                (a, b) => (b.createdAt || 0) - (a.createdAt || 0),
            );
            setNotes(sorted);
            setLoading(false);
        };

        load();
        return () => {
            isMounted = false;
        };
    }, [isAuthenticated]);

    const deleteNote = async (note) => {
        if (!confirm("Hapus catatan ini?")) return;
        setNotes((prev) => prev.filter((n) => n.id !== note.id));

        // Delete from localStorage
        if (typeof window !== "undefined") {
            for (let i = 0; i < window.localStorage.length; i += 1) {
                const key = window.localStorage.key(i);
                if (!key || !key.startsWith("kajian-notes:")) continue;
                try {
                    const parsed = JSON.parse(
                        window.localStorage.getItem(key) || "[]",
                    );
                    if (Array.isArray(parsed)) {
                        const filtered = parsed.filter((n) => n.id !== note.id);
                        window.localStorage.setItem(
                            key,
                            JSON.stringify(filtered),
                        );
                    }
                } catch {}
            }
        }

        // Delete from cloud
        const isNumeric = typeof note.id === "number" || /^\d+$/.test(String(note.id));
        if (isAuthenticated && isNumeric) {
            try {
                await kajianNoteApi.delete(note.id);
            } catch {}
        }
    };

    const copyNote = (note) => {
        const timeStr = note.end
            ? `${formatTime(note.start)} - ${formatTime(note.end)}`
            : formatTime(note.start);
        const title = note.kajian?.title ? `Kajian: ${note.kajian.title}\n` : "";
        const text = `📝 [${timeStr}]\n${title}${note.text}`;
        navigator?.clipboard?.writeText(text);
        setCopiedId(note.id);
        setTimeout(() => setCopiedId(null), 1500);
    };

    if (loading) {
        return (
            <div className='flex justify-center py-12'>
                <div className='animate-spin rounded-full h-6 w-6 border-2 border-emerald-500 border-t-transparent' />
            </div>
        );
    }

    if (notes.length === 0) {
        return (
            <div className='text-center py-16 text-sm text-gray-500 dark:text-gray-400'>
                <div className='text-4xl mb-3'>📝</div>
                <p className='font-semibold text-gray-700 dark:text-gray-200 mb-1'>
                    Belum ada catatan kajian
                </p>
                <p className='text-xs text-gray-400 max-w-sm mx-auto'>
                    Buka video kajian apa saja dan gunakan tombol &ldquo;+ Catat Momen&rdquo; untuk menandai poin faedah dan menit videonya.
                </p>
            </div>
        );
    }

    return (
        <div className='space-y-3'>
            <div className='flex items-center justify-between pb-2 border-b border-gray-100 dark:border-slate-800'>
                <span className='text-xs font-semibold text-gray-600 dark:text-gray-300'>
                    {notes.length} catatan tersimpan
                </span>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                {notes.map((n) => (
                    <div
                        key={n.id}
                        className='p-3.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors flex flex-col justify-between'
                    >
                        <div>
                            <div className='flex items-start justify-between gap-2 mb-2'>
                                <button
                                    type='button'
                                    onClick={() => onPlayNote?.(n)}
                                    className='inline-flex items-center gap-1 font-mono font-bold text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 transition-colors'
                                    title='Putar kajian dari timestamp ini'
                                >
                                    <span>▶</span>
                                    <span>{formatTime(n.start)}</span>
                                    {n.end && n.end > n.start && (
                                        <>
                                            <span className='text-gray-400'>-</span>
                                            <span>{formatTime(n.end)}</span>
                                        </>
                                    )}
                                </button>

                                <div className='flex items-center gap-1'>
                                    <button
                                        type='button'
                                        onClick={() => copyNote(n)}
                                        className='p-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                                        title='Salin catatan'
                                    >
                                        {copiedId === n.id ? "✓" : "📋"}
                                    </button>
                                    <button
                                        type='button'
                                        onClick={() => deleteNote(n)}
                                        className='p-1 text-xs text-gray-400 hover:text-red-600'
                                        title='Hapus catatan'
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>

                            {n.kajian && (
                                <p className='text-[11px] font-semibold text-gray-900 dark:text-gray-100 truncate mb-1'>
                                    {n.kajian.title}
                                </p>
                            )}

                            <p className='text-xs text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap line-clamp-4'>
                                {n.text}
                            </p>
                        </div>

                        {n.isCloud && (
                            <div className='mt-2.5 pt-2 border-t border-gray-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-gray-400'>
                                <span>☁️ Tersinkron Akun</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
