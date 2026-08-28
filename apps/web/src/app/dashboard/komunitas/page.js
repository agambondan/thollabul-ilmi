'use client';

import { useLocale } from '@/context/Locale';
import { useLayoutMode } from '@/lib/useLayoutMode';
import Link from 'next/link';
import { BsChatDots, BsStarFill } from 'react-icons/bs';
import ChatBox from './_components/ChatBox';

export default function KomunitasPage() {
    const { t } = useLocale();
    const { isWide } = useLayoutMode();

    return (
        <div className={isWide ? 'px-4 py-6' : 'px-4 py-6 max-w-md mx-auto'}>
            <div className='mb-6'>
                <h1 className='text-2xl font-bold text-gray-900 dark:text-white mb-2'>
                    {t('komunitas.title')}
                </h1>
                <p className='text-sm text-gray-600 dark:text-gray-400'>
                    {t('komunitas.desc')}
                </p>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                {/* Kolom Kiri: Forum + Chat */}
                <div className='space-y-6'>
                    {/* Pintasan Forum */}
                    <div className='bg-gradient-to-br from-emerald-700 to-teal-800 rounded-2xl p-6 text-white shadow-md'>
                        <BsChatDots className='text-3xl text-emerald-300 mb-3' />
                        <h2 className='text-lg font-bold mb-1'>Tanya Jawab Islam</h2>
                        <p className='text-sm text-emerald-100 mb-4 opacity-90 leading-relaxed'>
                            Diskusikan hal-hal seputar fiqh, aqidah, dan keseharian bersama komunitas.
                        </p>
                        <Link 
                            href='/dashboard/forum/ask' 
                            className='inline-block px-4 py-2 bg-white text-emerald-800 text-xs font-bold rounded-lg hover:bg-emerald-50 transition-colors'
                        >
                            Buat Pertanyaan
                        </Link>
                    </div>

                    {/* Chat Realtime SSE Stand-in */}
                    <ChatBox />
                </div>

                {/* Kolom Kanan: Leaderboard + Blog Highlight */}
                <div className='space-y-6'>
                    <div className='bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5'>
                        <h3 className='text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2'>
                            <BsStarFill className='text-amber-500' /> Hall of Fame
                        </h3>
                        <p className='text-xs text-gray-500 mb-3'>Top 3 hafalan dan muroja'ah minggu ini</p>
                        {/* Ponytail: Render static mock until Leaderboard API integration */}
                        <div className='space-y-3'>
                            {['Ahmad', 'Siti', 'Budi'].map((n, i) => (
                                <div key={i} className='flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-700'>
                                    <div className='flex items-center gap-2'>
                                        <div className='w-6 h-6 rounded bg-emerald-100 text-emerald-700 font-bold text-[10px] flex items-center justify-center'>{i+1}</div>
                                        <span className='text-sm font-medium text-gray-800 dark:text-gray-200'>{n}</span>
                                    </div>
                                    <span className='text-xs font-bold text-amber-600'>{(3-i)*120} pts</span>
                                </div>
                            ))}
                        </div>
                        <Link href='/dashboard/leaderboard' className='block text-center text-xs font-bold text-emerald-600 mt-4 hover:underline'>Lihat Peringkat Penuh &rarr;</Link>
                    </div>

                    <div className='bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5'>
                        <h3 className='text-sm font-bold text-gray-900 dark:text-white mb-4'>
                            {t('komunitas.highlight')}
                        </h3>
                        {/* Ponytail: Render static mock until Blog API integration */}
                        <div className='space-y-4'>
                            <Link href='/dashboard/blog/adab-menuntut-ilmu' className='block group'>
                                <p className='text-sm font-bold text-gray-800 dark:text-gray-200 group-hover:text-emerald-600 transition-colors'>Adab Menuntut Ilmu Menurut Salaf</p>
                                <p className='text-xs text-gray-500 mt-1'>Oleh Admin • 2 hari lalu</p>
                            </Link>
                            <Link href='/dashboard/blog/keutamaan-sholat-subuh' className='block group'>
                                <p className='text-sm font-bold text-gray-800 dark:text-gray-200 group-hover:text-emerald-600 transition-colors'>Keutamaan Sholat Subuh Berjamaah</p>
                                <p className='text-xs text-gray-500 mt-1'>Oleh Tim Redaksi • 5 hari lalu</p>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
