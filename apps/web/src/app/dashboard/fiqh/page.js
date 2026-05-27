'use client';

import { useLocale } from '@/context/Locale';
import { getLocalizedField } from '@/lib/translation';
import { useEffect, useState } from 'react';
import { BsChevronDown, BsChevronUp, BsSearch } from 'react-icons/bs';

const CATEGORIES = ['thaharah', 'sholat', 'zakat', 'puasa', 'haji', 'muamalah', 'umum'];

const toStr = (v) => {
    if (!v) return '';
    if (typeof v === 'string') return v;
    return v.name ?? v.title ?? v.label ?? v.value ?? '';
};

const normalizeFiqhCategory = (value) => {
    const normalized = toStr(value).toLowerCase().replace(/_/g, '-').trim();
    if (normalized.startsWith('haji')) return 'haji';
    return normalized;
};

const getFiqhFilterCategory = (item) =>
    normalizeFiqhCategory(item?.category ?? item?.slug ?? item?.name);
const getFiqhDisplayCategory = (item) => toStr(item?.category ?? item?.slug);

export default function DashboardFiqhPage() {
    const { t, lang } = useLocale();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cat, setCat] = useState('');
    const [search, setSearch] = useState('');
    const [expanded, setExpanded] = useState(null);

    useEffect(() => {
        setLoading(true);
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/fiqh?page=0&size=100`)
            .then((r) => r.json())
            .then((d) => {
                const arr = d?.items ?? d ?? [];
                if (Array.isArray(arr) && arr.length > 0) setItems(arr);
            })
            .catch(e => console.error(e))
            .finally(() => setLoading(false));
    }, []);

    const filtered = items.filter(
        (i) =>
            (!cat || getFiqhFilterCategory(i) === cat) &&
            (!search ||
                [
                    getLocalizedField(i, 'title', lang),
                    getLocalizedField(i, 'content', lang),
                    getFiqhFilterCategory(i),
                ]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase()
                    .includes(search.toLowerCase())),
    );

    return (
        <div className='p-6'>
            <div className='mb-6'>
                <h1 className='text-xl font-bold text-gray-900 dark:text-white'>{t('fiqh.title')}</h1>
                <p className='text-sm text-gray-500 dark:text-gray-400 mt-0.5'>
                    {items.length} {t('fiqh.material_unit')}
                </p>
            </div>

            {/* Filters */}
            <div className='flex flex-wrap gap-2 mb-4'>
                <div className='relative mr-2'>
                    <BsSearch className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs' />
                    <input
                        type='text'
                        placeholder={t('fiqh.search_placeholder')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className='pl-8 pr-3 py-1.5 border border-gray-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white w-44'
                    />
                </div>
                {['', ...CATEGORIES].map((c) => (
                    <button
                        key={c}
                        onClick={() => setCat(c)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
                            cat === c
                                ? 'bg-emerald-700 text-white'
                                : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                        }`}>
                        {c || t('common.all')}
                    </button>
                ))}
            </div>

            {loading && (
                <div className='flex justify-center py-10'>
                    <div className='w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin' />
                </div>
            )}

            {/* List */}
            <div className='space-y-2'>
                {filtered.map((item) => {
                    const id = item.id ?? item._id;
                    const open = expanded === id;
                    return (
                        <div
                            key={id}
                            className='bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden'>
                            <button
                                onClick={() => setExpanded(open ? null : id)}
                                className='w-full text-left px-4 py-3 flex items-center justify-between gap-3'>
                                <div className='flex items-center gap-2'>
                                    <span className='px-2 py-0.5 bg-lime-100 dark:bg-lime-900/20 text-lime-700 dark:text-lime-400 rounded text-xs capitalize shrink-0'>
                                        {getFiqhDisplayCategory(item)}
                                    </span>
                                    <span className='text-sm font-semibold text-gray-900 dark:text-white'>
                                        {getLocalizedField(item, 'title', lang)}
                                    </span>
                                </div>
                                {open ? (
                                    <BsChevronUp className='text-gray-400 shrink-0' />
                                ) : (
                                    <BsChevronDown className='text-gray-400 shrink-0' />
                                )}
                            </button>
                            {open && (
                                <div className='px-4 pb-4 border-t border-gray-50 dark:border-slate-700 pt-3 space-y-2'>
                                    <p className='text-sm text-gray-700 dark:text-gray-300 leading-relaxed'>
                                        {getLocalizedField(item, 'content', lang)}
                                    </p>
                                    {item.dalil && (
                                        <p
                                            dir='rtl'
                                            className='text-base text-gray-600 dark:text-gray-400 font-arabic leading-loose text-right'>
                                            {toStr(item.dalil)}
                                        </p>
                                    )}
                                    {item.source && (
                                        <p className='text-xs text-gray-400 dark:text-gray-500'>
                                            {item.source}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
                {filtered.length === 0 && (
                    <p className='text-center py-10 text-gray-400 text-sm'>{t('common.no_results')}</p>
                )}
            </div>
        </div>
    );
}
