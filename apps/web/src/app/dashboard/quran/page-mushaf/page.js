'use client';

import ContentWidth from '@/components/layout/ContentWidth';
import MushafAyahList from '@/components/quran/MushafAyahList';
import MushafContinuousView from '@/components/quran/MushafContinuousView';
import { useLocale } from '@/context/Locale';
import { quranApi } from '@/lib/api';
import { QURAN_FONTS, useQuranFont } from '@/lib/useQuranFont';
import { useState } from 'react';

const DashboardPageMushafPage = () => {
    const { t, lang } = useLocale();
    const [mode, setMode] = useState('page');
    const [value, setValue] = useState(1);
    const [view, setView] = useState('continuous');
    const [showTranslation, setShowTranslation] = useState(true);
    const [ayahs, setAyahs] = useState([]);
    const [loading, setLoading] = useState(false);
    const { fontId, setFont } = useQuranFont();

    const fetchData = async () => {
        setLoading(true);
        try {
            const req =
                mode === 'page' ? quranApi.byPage(value) : quranApi.byHizb(value);
            const res = await req;
            const data = await res.json();
            const items = data?.items ?? data?.data?.items ?? [];
            setAyahs(items);
        } catch {
            setAyahs([]);
        } finally {
            setLoading(false);
        }
    };

    const max = mode === 'page' ? 604 : 240;
    const minLabel = t(mode === 'page' ? 'mushaf.go_to_page' : 'mushaf.go_to_hizb');
    const inputId = `dashboard-quran-mushaf-${mode}-value`;
    const inputName = mode === 'page' ? 'page' : 'hizb';

    return (
        <ContentWidth compact='max-w-3xl' className='px-4 py-6'>
            <h1 className='text-xl font-bold text-gray-900 dark:text-white mb-1'>
                {t('mushaf.title')}
            </h1>
            <p className='text-sm text-gray-500 dark:text-gray-400 mb-6'>
                {t('mushaf.subtitle')}
            </p>

            <div className='bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 mb-6 space-y-4'>
                <div className='flex gap-2'>
                    <button
                        type='button'
                        onClick={() => {
                            setMode('page');
                            setValue(1);
                            setAyahs([]);
                        }}
                        aria-pressed={mode === 'page'}
                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            mode === 'page'
                                ? 'bg-emerald-700 text-white'
                                : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300'
                        }`}
                    >
                        {t('mushaf.by_page')}
                    </button>
                    <button
                        type='button'
                        onClick={() => {
                            setMode('hizb');
                            setValue(1);
                            setAyahs([]);
                        }}
                        aria-pressed={mode === 'hizb'}
                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            mode === 'hizb'
                                ? 'bg-emerald-700 text-white'
                                : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300'
                        }`}
                    >
                        {t('mushaf.by_hizb')}
                    </button>
                </div>

                <div>
                    <label
                        htmlFor={inputId}
                        className='block text-xs text-gray-500 dark:text-gray-400 mb-1'
                    >
                        {minLabel} (1 - {max})
                    </label>
                    <div className='flex gap-2'>
                        <input
                            id={inputId}
                            name={inputName}
                            type='number'
                            inputMode='numeric'
                            autoComplete='off'
                            min={1}
                            max={max}
                            value={value}
                            onChange={(e) =>
                                setValue(
                                    Math.max(
                                        1,
                                        Math.min(max, Number(e.target.value) || 1),
                                    ),
                                )
                            }
                            className='min-w-0 flex-1 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-200 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-900'
                        />
                        <button
                            type='button'
                            onClick={fetchData}
                            disabled={loading}
                            className='px-5 py-2 bg-emerald-700 text-white rounded-lg text-sm font-medium hover:bg-emerald-800 disabled:opacity-50'
                        >
                            {loading ? t('common.loading') : t('mushaf.go')}
                        </button>
                    </div>
                </div>

                {ayahs.length > 0 && (
                    <div className='pt-3 border-t border-gray-100 dark:border-slate-700 space-y-3'>
                        <div>
                            <p className='text-xs text-gray-500 dark:text-gray-400 mb-1.5'>
                                {t('mushaf.view')}
                            </p>
                            <div className='flex gap-2'>
                                {[
                                    { id: 'continuous', label: t('mushaf.continuous') },
                                    { id: 'list', label: t('mushaf.list') },
                                ].map((v) => (
                                    <button
                                        key={v.id}
                                        type='button'
                                        onClick={() => setView(v.id)}
                                        aria-pressed={view === v.id}
                                        className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                            view === v.id
                                                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                                                : 'bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-300'
                                        }`}
                                    >
                                        {v.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <p className='text-xs text-gray-500 dark:text-gray-400 mb-1.5'>
                                {t('mushaf.font')}
                            </p>
                            <div className='flex flex-wrap gap-1.5'>
                                {QURAN_FONTS.map((f) => (
                                    <button
                                        key={f.id}
                                        type='button'
                                        onClick={() => setFont(f.id)}
                                        aria-pressed={fontId === f.id}
                                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                                            fontId === f.id
                                                ? 'bg-emerald-700 text-white'
                                                : 'bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-300'
                                        }`}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            type='button'
                            onClick={() => setShowTranslation((v) => !v)}
                            className='w-full px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600'
                        >
                            {showTranslation
                                ? t('mushaf.translation_off')
                                : t('mushaf.translation_on')}
                        </button>
                    </div>
                )}
            </div>

            {ayahs.length > 0 &&
                (view === 'continuous' ? (
                    <MushafContinuousView
                        ayahs={ayahs}
                        lang={lang}
                        showTranslation={showTranslation}
                        readerBasePath='/dashboard/quran'
                    />
                ) : (
                    <MushafAyahList
                        ayahs={ayahs}
                        lang={lang}
                        readerBasePath='/dashboard/quran'
                        t={t}
                    />
                ))}

            {!loading && ayahs.length === 0 && (
                <div className='text-center py-12'>
                    <p className='text-gray-400 dark:text-gray-500 text-sm'>
                        {t('mushaf.empty_hint')}
                    </p>
                </div>
            )}
        </ContentWidth>
    );
};

export default DashboardPageMushafPage;
