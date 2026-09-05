"use client";

import { useState } from "react";
import { notificationApi } from "@/lib/api";
import { useLocale } from "@/context/Locale";
import { BsBell, BsSend, BsCheckCircle, BsExclamationTriangle } from "react-icons/bs";

export default function AdminPushNotificationPage() {
    const { t } = useLocale();
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [url, setUrl] = useState("/");
    const [sending, setSending] = useState(false);
    const [result, setResult] = useState(null);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!title.trim() || !body.trim()) return;

        setSending(true);
        setResult(null);

        try {
            const res = await notificationApi.broadcastPush({
                title: title.trim(),
                body: body.trim(),
                url: url.trim() || "/",
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || errData.error || "Gagal mengirim broadcast notifikasi.");
            }

            const data = await res.json();
            const payload = data?.data ?? data;
            setResult({
                ok: true,
                sent: payload.sent ?? 0,
                tokens: payload.tokens ?? 0,
            });
            setTitle("");
            setBody("");
            setUrl("/");
        } catch (err) {
            setResult({
                ok: false,
                error: err.message,
            });
        } finally {
            setSending(false);
        }
    };

    return (
        <div className='p-6 w-full'>
            <div className='mb-6'>
                <h1 className='text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2'>
                    <BsBell className='text-emerald-600 dark:text-emerald-400' />
                    Broadcast Push Notification
                </h1>
                <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
                    Kirim notifikasi push langsung ke browser, PWA, dan perangkat mobile yang telah terdaftar.
                </p>
            </div>

            {result && (
                <div
                    className={`mb-6 p-4 rounded-xl border flex items-start gap-3 ${
                        result.ok
                            ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200"
                            : "bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-200"
                    }`}
                >
                    {result.ok ? (
                        <BsCheckCircle className='text-xl shrink-0 mt-0.5' />
                    ) : (
                        <BsExclamationTriangle className='text-xl shrink-0 mt-0.5' />
                    )}
                    <div className='text-sm'>
                        {result.ok ? (
                            <p>
                                <strong>Broadcast berhasil dikirim!</strong> Terkirim ke <strong>{result.sent}</strong> perangkat aktif (dari {result.tokens} total token terdaftar).
                            </p>
                        ) : (
                            <p>
                                <strong>Gagal mengirim broadcast:</strong> {result.error}
                            </p>
                        )}
                    </div>
                </div>
            )}

            <form onSubmit={handleSend} className='bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 space-y-4 shadow-sm'>
                <div>
                    <label className='block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1'>
                        Judul Notifikasi <span className='text-rose-500'>*</span>
                    </label>
                    <input
                        type='text'
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder='Contoh: Waktu Ashar Segera Masuk / Kajian Akbar Malam Ini'
                        required
                        className='w-full border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500'
                    />
                </div>

                <div>
                    <label className='block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1'>
                        Isi Pesan <span className='text-rose-500'>*</span>
                    </label>
                    <textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        rows={3}
                        placeholder='Tuliskan pesan notifikasi yang akan muncul di banner perangkat...'
                        required
                        className='w-full border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500'
                    />
                </div>

                <div>
                    <label className='block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1'>
                        Target URL (Saat Notifikasi Diklik)
                    </label>
                    <input
                        type='text'
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder='/jadwal-sholat atau /dashboard/kajian'
                        className='w-full border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500'
                    />
                    <p className='text-xs text-gray-400 mt-1'>
                        Gunakan URL internal seperti <code>/jadwal-sholat</code>, <code>/dashboard</code>, atau URL lengkap.
                    </p>
                </div>

                <div className='pt-2 flex justify-end'>
                    <button
                        type='submit'
                        disabled={sending || !title.trim() || !body.trim()}
                        className='flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                    >
                        <BsSend />
                        {sending ? "Mengirim..." : "Kirim Push Notifikasi"}
                    </button>
                </div>
            </form>
        </div>
    );
}
