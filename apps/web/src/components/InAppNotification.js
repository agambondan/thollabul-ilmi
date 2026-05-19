'use client';

import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function InAppNotification() {
    const router = useRouter();

    useEffect(() => {
        if (!('serviceWorker' in navigator)) return;

        const handler = (event) => {
            if (event.data?.type !== 'PUSH_NOTIFICATION') return;

            const { title, body, url } = event.data;

            toast(
                (t) => (
                    <div className='flex items-start gap-3 min-w-[280px]'>
                        <div className='shrink-0 mt-0.5'>
                            <span className='inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40'>
                                <svg className='w-4 h-4 text-emerald-600 dark:text-emerald-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' />
                                </svg>
                            </span>
                        </div>
                        <div className='flex-1 min-w-0'>
                            <p className='text-sm font-semibold text-gray-900 dark:text-white'>{title}</p>
                            <p className='text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2'>{body}</p>
                        </div>
                        <button
                            onClick={() => {
                                toast.dismiss(t.id);
                                if (url && url !== '/') {
                                    router.push(url);
                                }
                            }}
                            className='shrink-0 inline-flex items-center rounded bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-emerald-950 transition-colors'
                        >
                            Buka
                        </button>
                    </div>
                ),
                {
                    duration: 6000,
                    position: 'top-right',
                    style: {
                        background: 'transparent',
                        boxShadow: 'none',
                        padding: 0,
                    },
                },
            );
        };

        navigator.serviceWorker.addEventListener('message', handler);

        return () => {
            navigator.serviceWorker.removeEventListener('message', handler);
        };
    }, [router]);

    return null;
}
