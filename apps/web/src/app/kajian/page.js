'use client';

import Footer from '@/components/Footer';
import { NavbarTailwindCss } from '@/components/Navbar';
import Section from '@/components/Section';
import { useLocale } from '@/context/Locale';
import { useLayoutMode } from '@/lib/useLayoutMode';
import { kajianApi } from '@/lib/api';
import { getLocalizedField } from '@/lib/translation';
import { useEffect, useState } from 'react';
import { BsPlayCircle, BsSearch, BsYoutube } from 'react-icons/bs';
import { MdOutlinePlayLesson } from 'react-icons/md';

const getYouTubeId = (url) => {
    if (!url) return null;
    const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
};

const CATEGORIES = [
    { key: 'semua', labelKey: 'common.all' },
    { key: 'aqidah', labelKey: 'kajian.category_aqidah' },
    { key: 'fiqh', labelKey: 'kajian.category_fiqh' },
    { key: 'tazkiyah', labelKey: 'kajian.category_tazkiyah' },
    { key: 'sirah', labelKey: 'kajian.category_sirah' },
    { key: 'tafsir', labelKey: 'kajian.category_tafsir' },
    { key: 'hadith', labelKey: 'kajian.category_hadith' },
];


const catColor = {
    aqidah: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    fiqh: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    tazkiyah: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    sirah: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    tafsir: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
    hadith: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
};

const KajianPage = () => {
    const { t, lang } = useLocale();
    const { isWide } = useLayoutMode();
    const [kajian, setKajian] = useState([]);
    const [activeCategory, setActiveCategory] = useState('semua');
    const [search, setSearch] = useState('');

    useEffect(() => {
        kajianApi
            .list()
            .then((r) => r.json())
            .then((data) => {
                setKajian(Array.isArray(data) ? data : []);
            })
            .catch(e => console.error(e));
    }, []);

    const filtered = kajian.filter((k) => {
        const matchCat = activeCategory === 'semua' || k.category === activeCategory;
        const matchSearch =
            !search ||
            [
                getLocalizedField(k, 'title', lang),
                k.ustadz,
                getLocalizedField(k, 'description', lang),
                k.category,
                k.duration,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase()
                .includes(search.toLowerCase());
        return matchCat && matchSearch;
    });

    const totalKajian = kajian.length;
    const youtubeCount = kajian.filter((item) => item.platform === 'youtube').length;
    const categoryCount = new Set(kajian.map((item) => item.category)).size;

    return (
        <main className='min-h-screen flex flex-col'>
            <NavbarTailwindCss />
            <Section>
                <div className={isWide ? 'w-full px-4' : 'container mx-auto px-4 max-w-3xl'}>
                    {/* Header */}
                    <div className='flex items-center gap-3 mb-6'>
                        <div className='w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center'>
                            <MdOutlinePlayLesson className='text-xl text-emerald-700 dark:text-emerald-400' />
                        </div>
                        <div>
                            <h1 className='text-xl font-bold text-emerald-900 dark:text-white'>
                                {t('kajian.public_title')}
                            </h1>
                            <p className='text-xs text-gray-500 dark:text-gray-400'>
                                {t('kajian.public_subtitle')}
                            </p>
                        </div>
                    </div>

                    {/* Search */}
                    <div className='flex items-center gap-2 mb-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 px-3 py-2'>
                        <BsSearch className='text-gray-400 shrink-0' />
                        <input
                            type='text'
                            placeholder={t('kajian.public_search_placeholder')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className='flex-1 bg-transparent text-sm text-gray-700 dark:text-gray-200 outline-none'
                        />
                        {search && (
                            <button
                                type='button'
                                onClick={() => setSearch('')}
                                className='text-xs font-medium text-emerald-600 dark:text-emerald-400'
                            >
                                {t('common.clear')}
                            </button>
                        )}
                    </div>

                    <div className='grid grid-cols-3 gap-3 mb-4'>
                        <div className='rounded-xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-3'>
                            <p className='text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500'>
                                {t('kajian.total_label')}
                            </p>
                            <p className='text-lg font-bold text-emerald-700 dark:text-emerald-400'>
                                {totalKajian}
                            </p>
                        </div>
                        <div className='rounded-xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-3'>
                            <p className='text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500'>
                                {t('kajian.youtube_label')}
                            </p>
                            <p className='text-lg font-bold text-emerald-700 dark:text-emerald-400'>
                                {youtubeCount}
                            </p>
                        </div>
                        <div className='rounded-xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-3'>
                            <p className='text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500'>
                                {t('kajian.categories_label')}
                            </p>
                            <p className='text-lg font-bold text-emerald-700 dark:text-emerald-400'>
                                {categoryCount}
                            </p>
                        </div>
                    </div>

                    {/* Category filter */}
                    <div className='flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide'>
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat.key}
                                onClick={() => setActiveCategory(cat.key)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                                    activeCategory === cat.key
                                        ? 'bg-emerald-700 text-white'
                                        : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-emerald-100 dark:hover:bg-slate-600'
                                }`}
                            >
                                {t(cat.labelKey)}
                            </button>
                        ))}
                    </div>

                    {/* Results count */}
                    <div className='mb-4 flex items-center justify-between text-xs text-gray-400 dark:text-gray-500'>
                        <span>
                            {filtered.length} {t('kajian.results_found')}
                        </span>
                        {search && (
                            <button
                                type='button'
                                onClick={() => setSearch('')}
                                className='font-medium text-emerald-600 dark:text-emerald-400'
                            >
                                {t('common.reset_search')}
                            </button>
                        )}
                    </div>

                    {/* Cards */}
                    {filtered.length === 0 ? (
                        <div className='text-center py-16 text-gray-400 dark:text-gray-500'>
                            <BsPlayCircle className='text-4xl mx-auto mb-3' />
                            <p className='text-sm'>{t('kajian.not_found')}</p>
                        </div>
                    ) : (
                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                            {filtered.map((k) => (
                                <a
                                    key={k.id}
                                    href={k.url}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    className='group bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-sm transition-all p-4 flex flex-col gap-3'
                                >
                                    {/* Category + platform */}
                                    <div className='flex items-center justify-between'>
                                        <span
                                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${catColor[k.category] ?? 'bg-gray-100 text-gray-600'}`}
                                        >
                                            {t(CATEGORIES.find((cat) => cat.key === k.category)?.labelKey) || k.category}
                                        </span>
                                        {k.platform === 'youtube' && <BsYoutube className='text-red-500 text-lg' />}
                                    </div>
                                    {getYouTubeId(k.url) && (
                                        <div className='aspect-video rounded-lg overflow-hidden bg-black'>
                                            <iframe
                                                src={`https://www.youtube.com/embed/${getYouTubeId(k.url)}`}
                                                title={k.title}
                                                className='w-full h-full'
                                                allowFullScreen
                                            />
                                        </div>
                                    )}
                                    <div>
                                        <p className='font-semibold text-gray-800 dark:text-gray-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors mb-1'>{k.title}</p>
                                        <p className='text-xs text-gray-400 dark:text-gray-500'>{k.speaker} · {k.duration ? `${Math.floor(k.duration / 60)}m` : ''}</p>
                                    </div>

                                    {/* Title */}
                                    <div className='flex-1'>
                                        <h3 className='text-sm font-semibold text-gray-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors leading-snug'>
                                            {getLocalizedField(k, 'title', lang)}
                                        </h3>
                                        <p className='text-xs text-emerald-600 dark:text-emerald-400 mt-0.5'>
                                            {k.ustadz}
                                        </p>
                                    </div>

                                    {/* Description */}
                                    <p className='text-xs text-gray-500 dark:text-gray-400 line-clamp-2'>
                                        {getLocalizedField(k, 'description', lang)}
                                    </p>

                                    {/* Footer */}
                                    <div className='flex items-center justify-between'>
                                        <span className='text-xs text-gray-400 dark:text-gray-500'>
                                            {k.duration}
                                        </span>
                                        <span className='text-xs text-emerald-600 dark:text-emerald-400 font-medium group-hover:underline'>
                                            {t('kajian.watch')}
                                        </span>
                                    </div>
                                </a>
                            ))}
                        </div>
                    )}

                    <p className='text-center text-xs text-gray-400 dark:text-gray-500 mt-8'>
                        {t('kajian.external_note')}
                    </p>
                </div>
            </Section>
            <Footer />
        </main>
    );
};

export default KajianPage;
