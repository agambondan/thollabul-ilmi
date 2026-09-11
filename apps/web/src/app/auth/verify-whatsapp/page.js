"use client";

import { useAuth } from "@/context/Auth";
import { useLocale } from "@/context/Locale";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

// See the comment in ../verify-email/page.js — must go through the
// same-origin proxy, not a hardcoded production domain.
const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

const VerifyWhatsAppPage = () => {
    const { t } = useLocale();
    const { resendVerification } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const phone = searchParams.get("phone") || "";
    const [code, setCode] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [resent, setResent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/v1/auth/verify-whatsapp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone, code: code.trim() }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setError(data.message || "Kode tidak valid");
                setIsLoading(false);
                return;
            }
            router.push("/auth/login?registered=1");
        } catch {
            setError(t("common.load_error") || "Terjadi kesalahan");
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        setResent(false);
        await resendVerification(phone);
        setResent(true);
    };

    return (
        <main className='min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4'>
            <div className='w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-8'>
                <h1 className='text-xl font-bold text-emerald-900 dark:text-white mb-2 text-center'>
                    {t("auth.verify_whatsapp_title") || "Verifikasi WhatsApp"}
                </h1>
                <p className='text-sm text-gray-500 dark:text-gray-400 mb-6 text-center'>
                    {t("auth.verify_whatsapp_desc") ||
                        "Masukkan kode 6 digit yang dikirim ke WhatsApp kamu."}
                </p>

                {error && (
                    <div className='mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400'>
                        {error}
                    </div>
                )}
                {resent && (
                    <div className='mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-sm text-emerald-700 dark:text-emerald-400'>
                        {t("auth.resend_success") ||
                            "Kode baru sudah dikirim ulang."}
                    </div>
                )}

                <form onSubmit={handleSubmit} className='space-y-4'>
                    <div>
                        <label
                            htmlFor='verify-code'
                            className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
                        >
                            {t("auth.otp_code") || "Kode Verifikasi"}
                        </label>
                        <input
                            id='verify-code'
                            type='text'
                            inputMode='numeric'
                            maxLength={6}
                            required
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            className='w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-center text-lg tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-emerald-500'
                            placeholder='000000'
                        />
                    </div>
                    <button
                        type='submit'
                        disabled={isLoading}
                        className='w-full py-2.5 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-60 text-white font-semibold rounded-lg text-sm transition-colors'
                    >
                        {isLoading
                            ? t("auth.processing") || "Memproses..."
                            : t("auth.verify_btn") || "Verifikasi"}
                    </button>
                </form>

                <div className='mt-4 text-center'>
                    <button
                        type='button'
                        onClick={handleResend}
                        className='text-sm text-emerald-600 dark:text-emerald-400 font-medium hover:underline'
                    >
                        {t("auth.resend_code") || "Kirim ulang kode"}
                    </button>
                </div>

                <p className='mt-5 text-center text-sm text-gray-500 dark:text-gray-400'>
                    <Link
                        href='/auth/login'
                        className='text-emerald-600 dark:text-emerald-400 font-medium hover:underline'
                    >
                        {t("auth.login_here") || "Kembali ke halaman masuk"}
                    </Link>
                </p>
            </div>
        </main>
    );
};

export default function VerifyWhatsAppPageWrapper() {
    return (
        <Suspense>
            <VerifyWhatsAppPage />
        </Suspense>
    );
}
