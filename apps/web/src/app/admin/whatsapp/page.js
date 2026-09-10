"use client";

import { whatsappApi } from "@/lib/api";
import { useEffect, useRef, useState } from "react";
import {
    BsWhatsapp,
    BsCheckCircle,
    BsExclamationTriangle,
    BsArrowRepeat,
    BsBoxArrowRight,
} from "react-icons/bs";

export default function AdminWhatsAppPage() {
    const [status, setStatus] = useState("disconnected");
    const [phone, setPhone] = useState(null);
    const [qr, setQr] = useState(null);
    const [error, setError] = useState(null);
    const [pairing, setPairing] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);
    const esRef = useRef(null);

    const loadStatus = async () => {
        try {
            const res = await whatsappApi.status();
            if (!res.ok) return;
            const data = await res.json();
            setStatus(data.status || "disconnected");
            setPhone(data.phone || null);
        } catch {
            // keep last known status
        }
    };

    useEffect(() => {
        loadStatus();
        return () => {
            esRef.current?.close();
        };
    }, []);

    const startPairing = () => {
        setError(null);
        setQr(null);
        setPairing(true);
        // The stream is admin-only; EventSource can't set an Authorization
        // header, so it relies on the httpOnly "token" cookie login already
        // sets (see setAuthCookies in the API) via withCredentials.
        const es = new EventSource(whatsappApi.pairStreamUrl(), {
            withCredentials: true,
        });
        esRef.current = es;

        es.addEventListener("status", (event) => {
            try {
                const data = JSON.parse(event.data);
                setStatus(data.status);
                if (data.qr) setQr(data.qr);
                if (data.phone) setPhone(data.phone);
                if (data.error) setError(data.error);
                if (
                    data.status === "connected" ||
                    data.status === "timeout" ||
                    data.status === "error"
                ) {
                    setPairing(false);
                    setQr(null);
                    es.close();
                }
            } catch {
                // ignore malformed event
            }
        });

        es.onerror = () => {
            setPairing(false);
            es.close();
        };
    };

    const handleLogout = async () => {
        setLoggingOut(true);
        setError(null);
        try {
            const res = await whatsappApi.logout();
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setError(data.message || "Gagal logout");
            } else {
                setStatus("disconnected");
                setPhone(null);
            }
        } finally {
            setLoggingOut(false);
        }
    };

    return (
        <div className='p-6 w-full max-w-2xl'>
            <div className='mb-6'>
                <h1 className='text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2'>
                    <BsWhatsapp className='text-emerald-600 dark:text-emerald-400' />
                    WhatsApp Verifikasi
                </h1>
                <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
                    Pasangkan satu nomor WhatsApp (scan QR seperti WhatsApp
                    Web) untuk mengirim kode OTP verifikasi akun ke user yang
                    memilih daftar via WhatsApp.
                </p>
            </div>

            <div className='bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 shadow-sm'>
                <div className='flex items-center justify-between mb-4'>
                    <div className='flex items-center gap-2'>
                        {status === "connected" ? (
                            <BsCheckCircle className='text-emerald-600 dark:text-emerald-400 text-lg' />
                        ) : (
                            <BsExclamationTriangle className='text-amber-500 text-lg' />
                        )}
                        <span className='font-semibold text-gray-800 dark:text-gray-100'>
                            {status === "connected"
                                ? `Terhubung${phone ? ` — ${phone}` : ""}`
                                : status === "pending"
                                  ? "Menunggu scan QR..."
                                  : "Belum terhubung"}
                        </span>
                    </div>
                    <button
                        type='button'
                        onClick={loadStatus}
                        className='text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400'
                        title='Refresh status'
                    >
                        <BsArrowRepeat />
                    </button>
                </div>

                {error && (
                    <div className='mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-200 text-sm'>
                        {error}
                    </div>
                )}

                {status === "connected" ? (
                    <button
                        type='button'
                        onClick={handleLogout}
                        disabled={loggingOut}
                        className='flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 disabled:opacity-50'
                    >
                        <BsBoxArrowRight />
                        {loggingOut ? "Memproses..." : "Logout & Pasang Ulang"}
                    </button>
                ) : (
                    <div>
                        {qr ? (
                            <div className='flex flex-col items-center gap-3'>
                                <img
                                    src={qr}
                                    alt='QR pairing WhatsApp'
                                    className='w-56 h-56 border border-gray-200 dark:border-slate-600 rounded-lg'
                                />
                                <p className='text-xs text-gray-500 dark:text-gray-400 text-center'>
                                    Buka WhatsApp di HP → Perangkat Tertaut →
                                    Tautkan Perangkat, lalu scan kode ini.
                                </p>
                            </div>
                        ) : (
                            <button
                                type='button'
                                onClick={startPairing}
                                disabled={pairing}
                                className='flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-800 disabled:opacity-50'
                            >
                                <BsWhatsapp />
                                {pairing
                                    ? "Menyiapkan QR..."
                                    : "Mulai Pairing"}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
