"use client";

import { useAuth } from "@/context/Auth";
import { useLocale } from "@/context/Locale";
import { buildRegisterHref, getSafeNextPath } from "@/lib/authRedirect";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { BsEye, BsEyeSlash } from "react-icons/bs";

const LoginPage = () => {
    const { login, isAuthenticated, isLoading: authLoading } = useAuth();
    const { t } = useLocale();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const nextUrl = getSafeNextPath(searchParams.get("next"), "/dashboard");
    const registered = searchParams.get("registered") === "1";

    useEffect(() => {
        if (authLoading) return;
        if (isAuthenticated) router.replace(nextUrl);
    }, [isAuthenticated, authLoading, router, nextUrl]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);
        try {
            await login(email, password);
            router.push(nextUrl);
        } catch (err) {
            setError(err.message);
            setIsLoading(false);
        }
    };

    return (
        <main className='min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4'>
            <div className='w-full max-w-md'>
                <div className='text-center mb-8'>
                    <Link href='/' className='inline-block'>
                        <h1 className='text-2xl font-extrabold text-emerald-800 dark:text-emerald-400'>
                            Thullaabul &apos;Ilmi
                        </h1>
                        <p
                            className='text-sm text-emerald-600 dark:text-emerald-500'
                            style={{ fontFamily: "Amiri, serif" }}
                        >
                            طُلَّابُ الْعِلْمِ
                        </p>
                    </Link>
                </div>

                <div className='bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-8'>
                    <h2 className='text-xl font-bold text-emerald-900 dark:text-white mb-6'>
                        {t("auth.sign_in_title")}
                    </h2>

                    {registered && (
                        <div className='mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-sm text-emerald-700 dark:text-emerald-400'>
                            {t("auth.register_success")}
                        </div>
                    )}

                    {error && (
                        <div className='mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400'>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className='space-y-4'>
                        <div>
                            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                {t("auth.email")}
                            </label>
                            <input
                                type='email'
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className='w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500'
                                placeholder='nama@email.com'
                            />
                        </div>
                        <div>
                            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                {t("auth.password")}
                            </label>
                            <div className='relative'>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    className='w-full px-3 py-2 pr-10 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500'
                                    placeholder='••••••••'
                                />
                                <button
                                    type='button'
                                    aria-label={
                                        showPassword
                                            ? "Sembunyikan password"
                                            : "Lihat password"
                                    }
                                    onClick={() =>
                                        setShowPassword((current) => !current)
                                    }
                                    className='absolute inset-y-0 right-0 flex w-10 items-center justify-center text-gray-500 hover:text-emerald-700 dark:text-gray-300 dark:hover:text-emerald-300'
                                >
                                    {showPassword ? <BsEyeSlash /> : <BsEye />}
                                </button>
                            </div>
                        </div>
                        <button
                            type='submit'
                            disabled={isLoading}
                            className='w-full py-2.5 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-60 text-white font-semibold rounded-lg text-sm transition-colors'
                        >
                            {isLoading
                                ? t("auth.processing")
                                : t("auth.login_btn")}
                        </button>
                    </form>

                    <div className='my-5 flex items-center gap-3'>
                        <div className='flex-1 h-px bg-gray-200 dark:bg-slate-600' />
                        <span className='text-xs uppercase text-gray-400 tracking-wider'>
                            atau
                        </span>
                        <div className='flex-1 h-px bg-gray-200 dark:bg-slate-600' />
                    </div>

                    <a
                        href={`${process.env.NEXT_PUBLIC_API_URL || "https://api-thollabul.jangkauin.site"}/api/v1/auth/google`}
                        className='w-full inline-flex items-center justify-center gap-2 py-2.5 border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-800 dark:text-white font-semibold rounded-lg text-sm transition-colors'
                    >
                        <svg
                            width='18'
                            height='18'
                            viewBox='0 0 48 48'
                            xmlns='http://www.w3.org/2000/svg'
                            aria-hidden='true'
                        >
                            <path
                                fill='#FFC107'
                                d='M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z'
                            />
                            <path
                                fill='#FF3D00'
                                d='M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z'
                            />
                            <path
                                fill='#4CAF50'
                                d='M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z'
                            />
                            <path
                                fill='#1976D2'
                                d='M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z'
                            />
                        </svg>
                        Masuk dengan Google
                    </a>

                    <p className='mt-5 text-center text-sm text-gray-500 dark:text-gray-400'>
                        {t("auth.no_account")}{" "}
                        <Link
                            href={buildRegisterHref(nextUrl)}
                            className='text-emerald-600 dark:text-emerald-400 font-medium hover:underline'
                        >
                            {t("auth.register_now")}
                        </Link>
                    </p>
                </div>
            </div>
        </main>
    );
};

import { Suspense } from "react";

export default function LoginPageWrapper() {
    return (
        <Suspense>
            <LoginPage />
        </Suspense>
    );
}
