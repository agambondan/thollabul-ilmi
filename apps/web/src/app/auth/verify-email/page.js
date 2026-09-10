"use client";

import { useLocale } from "@/context/Locale";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

// Empty-string fallback (not a hardcoded domain) so this goes through the
// same-origin proxy at app/api/v1/[...path], exactly like Auth.js — a direct
// cross-origin URL here would bypass that proxy and silently hit the wrong
// backend in any environment where NEXT_PUBLIC_API_URL isn't set.
const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

const VerifyEmailPage = () => {
    const { t } = useLocale();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const [status, setStatus] = useState(token ? "verifying" : "missing");
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (!token) return;
        let cancelled = false;
        fetch(`${API_URL}/api/v1/auth/verify-email`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
        })
            .then(async (res) => {
                const data = await res.json().catch(() => ({}));
                if (cancelled) return;
                if (res.ok) {
                    setStatus("success");
                } else {
                    setStatus("error");
                    setMessage(data.message || "");
                }
            })
            .catch(() => {
                if (!cancelled) setStatus("error");
            });
        return () => {
            cancelled = true;
        };
    }, [token]);

    return (
        <main className='min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4'>
            <div className='w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-8 text-center'>
                <h1 className='text-xl font-bold text-emerald-900 dark:text-white mb-4'>
                    {t("auth.verify_email_title") || "Verifikasi Akun"}
                </h1>

                {status === "verifying" && (
                    <p className='text-sm text-gray-500 dark:text-gray-400'>
                        {t("common.loading") || "Memuat..."}
                    </p>
                )}

                {status === "missing" && (
                    <p className='text-sm text-red-600 dark:text-red-400'>
                        {t("auth.verify_email_missing_token") ||
                            "Link verifikasi tidak valid."}
                    </p>
                )}

                {status === "success" && (
                    <div>
                        <p className='text-sm text-emerald-700 dark:text-emerald-400 mb-4'>
                            {t("auth.verify_email_success") ||
                                "Akun kamu berhasil diverifikasi. Silakan masuk."}
                        </p>
                        <Link
                            href='/auth/login'
                            className='inline-block px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold rounded-lg text-sm'
                        >
                            {t("auth.login_btn") || "Masuk"}
                        </Link>
                    </div>
                )}

                {status === "error" && (
                    <div>
                        <p className='text-sm text-red-600 dark:text-red-400 mb-4'>
                            {message ||
                                t("auth.verify_email_error") ||
                                "Link verifikasi tidak valid atau sudah kedaluwarsa."}
                        </p>
                        <Link
                            href='/auth/login'
                            className='text-emerald-600 dark:text-emerald-400 text-sm font-medium hover:underline'
                        >
                            {t("auth.login_here") || "Kembali ke halaman masuk"}
                        </Link>
                    </div>
                )}
            </div>
        </main>
    );
};

export default function VerifyEmailPageWrapper() {
    return (
        <Suspense>
            <VerifyEmailPage />
        </Suspense>
    );
}
