'use client';

import { useLocale } from '@/context/Locale';
import { useLayoutMode } from '@/lib/useLayoutMode';
import { useState, useEffect } from 'react';
import { BsCheckCircle, BsChevronLeft, BsChevronRight, BsPlayFill, BsBook } from 'react-icons/bs';
import Link from 'next/link';
import { pushRecentBelajar } from '@/lib/recent';
import { authFetch } from '@/lib/api';

const API_URL = typeof window !== 'undefined' ? process.env.NEXT_PUBLIC_API_URL || '' : '';

export default function LessonsPage() {
    const { t } = useLocale();
    const { isWide } = useLayoutMode();
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeModuleId, setActiveModuleId] = useState(null);
    const [activeStepIdx, setActiveStepIdx] = useState(0);
    const [completed, setCompleted] = useState({});

    useEffect(() => {
        const fetchModules = async () => {
            try {
                const res = await fetch(`${API_URL}/api/v1/lessons`);
                if (res.ok) {
                    const data = await res.json();
                    const items = data?.data?.items || data?.items || [];
                    setModules(items);
                    if (items.length > 0) setActiveModuleId(items[0].slug);
                }
            } catch (e) {
                console.error('Failed to load lessons', e);
            } finally {
                setLoading(false);
            }
        };
        fetchModules();
    }, []);

    useEffect(() => {
        const fetchProgress = async () => {
            try {
                const res = await authFetch('/api/v1/lessons/progress');
                if (res.ok) {
                    const data = await res.json();
                    const items = data?.data?.items || data?.items || [];
                    const comp = {};
                    items.forEach(p => {
                        const m = modules.find(mod => mod.id === p.module_id);
                        if (m) comp[`${m.slug}_${p.step}`] = p.done;
                    });
                    setCompleted(comp);
                }
            } catch {}
        };
        if (modules.length > 0) fetchProgress();
    }, [modules]);

    const activeModule = modules.find((m) => m.slug === activeModuleId);
    const step = activeModule?.steps?.[activeStepIdx];
    const totalSteps = activeModule?.steps?.length || 0;
    
    const moduleProgress = totalSteps > 0 ? Math.round(
        ((Object.keys(completed).filter((k) => k.startsWith(activeModuleId) && completed[k]).length) / totalSteps) * 100
    ) : 0;

    const handleSelectModule = (slug) => {
        setActiveModuleId(slug);
        setActiveStepIdx(0);
    };

    const saveProgress = async (stepNum, done) => {
        try {
            await authFetch('/api/v1/lessons/progress', {
                method: 'PUT',
                body: JSON.stringify({ module_id: activeModule.id, step: stepNum, done }),
            });
        } catch {}
    };

    const next = () => {
        if (activeStepIdx < totalSteps - 1) {
            setActiveStepIdx(activeStepIdx + 1);
        } else {
            const key = `${activeModuleId}_${totalSteps}`;
            setCompleted({ ...completed, [key]: true });
            saveProgress(totalSteps, true);
            pushRecentBelajar({ href: `/dashboard/belajar/lessons`, title: activeModule.title, meta: 'Selesai' });
        }
    };

    const prev = () => {
        if (activeStepIdx > 0) setActiveStepIdx(activeStepIdx - 1);
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">{t('belajar.loading_modules')}</div>;
    }

    if (!activeModule || !step) {
        return <div className="p-8 text-center text-gray-500">{t('belajar.lessons_empty')}</div>;
    }

    const isStepDone = activeStepIdx < totalSteps - 1 
        ? completed[`${activeModuleId}_${activeStepIdx + 1}`]
        : completed[`${activeModuleId}_${totalSteps}`];

    return (
        <div className={isWide ? 'px-4 py-6' : 'px-4 py-6 max-w-md mx-auto'}>
            <Link href='/dashboard/belajar' className='inline-flex items-center text-sm text-gray-500 hover:text-emerald-600 mb-3'>
                <BsChevronLeft /> <span className='ml-1'>{t('belajar.back_to_learn')}</span>
            </Link>
            <h1 className='text-xl font-bold text-gray-900 dark:text-white mb-6'>
                {t('belajar.lessons')}
            </h1>

            <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
                <div className='sm:col-span-1 space-y-2'>
                    {modules.map((m) => (
                        <button
                            key={m.slug}
                            onClick={() => handleSelectModule(m.slug)}
                            className={`w-full text-left p-3 rounded-xl border transition-colors ${
                                activeModuleId === m.slug
                                    ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700'
                                    : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 hover:border-emerald-200'
                            }`}
                        >
                            <p className='text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2'>
                                {activeModuleId === m.slug ? <BsPlayFill className='text-emerald-500' /> : <BsBook className='text-gray-400' />}
                                {m.title}
                            </p>
                            <p className='text-xs text-gray-500 mt-1'>{m.steps?.length || 0} langkah</p>
                        </button>
                    ))}
                </div>

                <div className='sm:col-span-2'>
                    <div className='mb-4 flex items-center justify-between'>
                        <span className='text-xs font-bold text-emerald-600 uppercase tracking-wider'>
                            {activeModule.title} — {activeStepIdx + 1} / {totalSteps}
                        </span>
                        <span className='text-xs text-gray-500'>{moduleProgress}% selesai</span>
                    </div>
                    <div className='bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6 shadow-sm'>
                        <h2 className='text-lg font-bold text-gray-900 dark:text-white mb-3'>
                            {step.title}
                        </h2>
                        <p className='text-sm text-gray-600 dark:text-gray-300 leading-relaxed'>
                            {step.body}
                        </p>
                    </div>
                    <div className='flex items-center justify-between mt-4'>
                        <button 
                            onClick={prev} 
                            disabled={activeStepIdx === 0}
                            className='px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-700 disabled:opacity-30 flex items-center gap-1'
                        >
                            <BsChevronLeft /> Kembali
                        </button>
                        <button
                            onClick={next}
                            className='px-5 py-2.5 bg-emerald-700 text-white text-sm font-medium rounded-lg hover:bg-emerald-800 flex items-center gap-2'
                        >
                            {isStepDone && <BsCheckCircle className='text-emerald-200' />}
                            {activeStepIdx === totalSteps - 1 ? 'Selesai' : 'Lanjut'}
                            <BsChevronRight />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
