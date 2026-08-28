'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/Auth';
import Link from 'next/link';

const GoogleCallbackContent = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { doRefresh, refetchUser } = useAuth();
    const [status, setStatus] = useState('Menyelesaikan login dengan Google...');
    const [error, setError] = useState('');

    useEffect(() => {
        const errorParam = searchParams.get('error');
        if (errorParam) {
            setError(decodeURIComponent(errorParam));
            setStatus('');
            return;
        }

        // The backend already set the auth cookies (httpOnly refresh_token +
        // token) on the redirect that landed here — it never puts tokens in
        // this URL. Mint a fresh access token from the refresh_token cookie
        // and load it into app state.
        //
        // Deliberately run once on mount: doRefresh()/refetchUser() are
        // recreated on every AuthProvider render (not memoized), and unlike
        // the old URL-token flow, each doRefresh() call mints a genuinely
        // new token value, so setToken() never bails out on an identical
        // value — including them in the deps array would re-fire this
        // effect after every refresh, calling /auth/refresh in a loop.
        (async () => {
            try {
                const token = await doRefresh?.();
                if (!token) {
                    setError('Gagal menyelesaikan sesi login dari Google.');
                    setStatus('');
                    return;
                }
                refetchUser?.();
                setStatus('Login berhasil! Mengalihkan ke dashboard...');
                setTimeout(() => router.replace('/dashboard'), 800);
            } catch (err) {
                setError(err?.message || 'Gagal menyelesaikan sesi login.');
                setStatus('');
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <main className='min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4'>
            <div className='w-full max-w-md text-center bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-8'>
                <h1 className='text-xl font-bold text-emerald-900 dark:text-white mb-2'>
                    Login dengan Google
                </h1>
                {status && (
                    <p className='text-sm text-gray-600 dark:text-gray-300'>{status}</p>
                )}
                {error && (
                    <div className='mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400'>
                        {error}
                    </div>
                )}
                {error && (
                    <Link
                        href='/auth/login'
                        className='inline-block mt-6 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700'
                    >
                        Kembali ke halaman login
                    </Link>
                )}
            </div>
        </main>
    );
};

export default function GoogleCallbackPage() {
    return (
        <Suspense
            fallback={
                <main className='min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4'>
                    <div className='w-full max-w-md text-center bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-8 text-sm text-gray-600 dark:text-gray-300'>
                        Memuat autentikasi...
                    </div>
                </main>
            }
        >
            <GoogleCallbackContent />
        </Suspense>
    );
}
