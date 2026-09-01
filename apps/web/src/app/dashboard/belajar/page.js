'use client';

import { useLocale } from '@/context/Locale';
import { useLayoutMode } from '@/lib/useLayoutMode';
import { getRecentBelajar } from '@/lib/recent';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BsBook, BsJournalCheck, BsSearch, BsPlayFill, BsAward } from 'react-icons/bs';
import { FaBrain } from 'react-icons/fa';
import { MdMenuBook, MdOutlinePlayLesson, MdTimeline, MdOutlineAutoStories, MdExplore, MdOutlineDirectionsWalk } from 'react-icons/md';

/**
 * Also rendered by the public /belajar route. `basePath` keeps an anonymous
 * visitor on public URLs instead of bouncing them into the auth-gated
 * dashboard tree.
 */
export default function BelajarPage({ basePath = '/dashboard' }) {
    const { t } = useLocale();
    const { isWide } = useLayoutMode();
    const [recent, setRecent] = useState([]);
    const [search, setSearch] = useState('');

    useEffect(() => {
        setRecent(getRecentBelajar());
    }, []);

    const root = basePath === '/dashboard' ? '/dashboard' : '';
    const lessonsHref = `${root}/belajar/lessons`;

    const MODULES = [
        { labelKey: 'belajar.mod.lessons', href: lessonsHref, icon: <BsPlayFill className='text-xl text-emerald-600' />, descKey: 'belajar.mod.lessons_d' },
        { labelKey: 'belajar.mod.kajian', href: `${root}/kajian`, icon: <MdOutlinePlayLesson className='text-xl text-blue-500' />, descKey: 'belajar.mod.kajian_d' },
        { labelKey: 'belajar.mod.fiqh', href: `${root}/fiqh`, icon: <MdMenuBook className='text-xl text-amber-500' />, descKey: 'belajar.mod.fiqh_d' },
        { labelKey: 'belajar.mod.siroh', href: `${root}/siroh`, icon: <MdOutlineAutoStories className='text-xl text-rose-500' />, descKey: 'belajar.mod.siroh_d' },
        { labelKey: 'belajar.mod.sejarah', href: `${root}/sejarah`, icon: <MdTimeline className='text-xl text-indigo-500' />, descKey: 'belajar.mod.sejarah_d' },
        { labelKey: 'belajar.mod.kamus', href: `${root}/kamus`, icon: <BsBook className='text-xl text-teal-500' />, descKey: 'belajar.mod.kamus_d' },
        { labelKey: 'belajar.mod.quiz', href: `${root}/quiz`, icon: <FaBrain className='text-xl text-purple-500' />, descKey: 'belajar.mod.quiz_d' },
        { labelKey: 'belajar.mod.library', href: `${root}/library`, icon: <BsBook className='text-xl text-emerald-500' />, descKey: 'belajar.mod.library_d' },
    ].map((m) => ({ ...m, label: t(m.labelKey), desc: t(m.descKey) }));

    const filtered = MODULES.filter(m => m.label.toLowerCase().includes(search.toLowerCase()) || m.desc.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className={isWide ? 'px-4 py-6' : 'px-4 py-6 max-w-md mx-auto'}>
            <div className='flex items-center justify-between mb-4'>
                <h1 className='text-xl font-bold text-gray-900 dark:text-white'>
                    {t('belajar.title')}
                </h1>
                <Link 
                    href={lessonsHref}
                    className='text-xs font-semibold px-3 py-1.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 rounded-lg hover:bg-emerald-200'
                >
                    {t('belajar.lessons_start')} &rarr;
                </Link>
            </div>

            <div className='relative mb-6'>
                <BsSearch className='absolute left-3 top-3 text-gray-400' />
                <input 
                    type='text'
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t("belajar.search_placeholder")}
                    className='w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500'
                />
            </div>

            {/* Recent */}
            {recent.length > 0 && !search && (
                <div className='mb-6'>
                    <h2 className='text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3'>
                        {t('belajar.recent')}
                    </h2>
                    <div className='flex gap-3 overflow-x-auto pb-2 scrollbar-none'>
                        {recent.map((item, idx) => (
                            <Link 
                                key={idx} 
                                href={item.href}
                                className='shrink-0 w-48 p-3 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl hover:shadow-sm'
                            >
                                <p className='text-xs font-bold text-gray-900 dark:text-white truncate'>{item.title}</p>
                                <p className='text-[10px] text-gray-400 mt-1 truncate'>{item.meta || t('belajar.continue')}</p>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Grid */}
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                {filtered.map((item, idx) => (
                    <Link 
                        key={idx}
                        href={item.href}
                        className='p-4 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl flex items-start gap-3 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors group'
                    >
                        <div className='p-2.5 bg-gray-50 dark:bg-slate-700/50 rounded-xl shrink-0 group-hover:scale-105 transition-transform'>
                            {item.icon}
                        </div>
                        <div>
                            <p className='text-sm font-bold text-gray-900 dark:text-white group-hover:text-emerald-600 transition-colors'>
                                {item.label}
                            </p>
                            <p className='text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2'>
                                {item.desc}
                            </p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
