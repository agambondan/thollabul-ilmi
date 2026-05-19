'use client';

import ContentWidth from '@/components/layout/ContentWidth';
import { useAuth } from '@/context/Auth';
import { useLocale } from '@/context/Locale';
import { achievementApi } from '@/lib/api';
import { useEffect, useState } from 'react';
import { BsAward, BsCheckCircle, BsLightning, BsStar, BsTrophy } from 'react-icons/bs';

export function AchievementContent() {
    const { t, lang } = useLocale();
    const { isAuthenticated } = useAuth();
    const [achievements, setAchievements] = useState([]);
    const [earnedIds, setEarnedIds] = useState(new Set());
    const [points, setPoints] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            achievementApi.list().then((r) => r.json()),
            isAuthenticated
                ? achievementApi.mine().then((r) => r.json())
                : Promise.resolve({ items: [] }),
            isAuthenticated
                ? achievementApi.points().then((r) => r.json())
                : Promise.resolve({}),
        ])
            .then(([allData, mineData, pointsData]) => {
                const all = allData?.items ?? allData ?? [];
                const mine = mineData?.items ?? mineData ?? [];
                const earned = new Set(
                    mine.map((ua) => ua.achievement_id ?? ua.achievement?.id ?? ua.id),
                );
                setAchievements(all);
                setEarnedIds(earned);
                setPoints(pointsData?.total_points ?? pointsData?.points ?? null);
            })
            .catch(e => console.error(e))
            .finally(() => setLoading(false));
    }, [isAuthenticated]);

    const fmt = (n) =>
        n != null
            ? new Intl.NumberFormat(lang === 'EN' ? 'en-US' : 'id-ID').format(n)
            : '—';

    return (
        <ContentWidth compact='max-w-3xl' className='px-4 py-6'>
            <div className='text-center mb-8'>
                <div className='inline-flex items-center justify-center w-16 h-16 bg-amber-100 dark:bg-amber-900/40 rounded-2xl mb-4'>
                    <BsTrophy className='text-3xl text-amber-600 dark:text-amber-400' />
                </div>
                <h1 className='text-2xl font-bold text-gray-900 dark:text-white mb-1'>
                    {t('stats.achievements') ?? 'Pencapaian'}
                </h1>
                <p className='text-sm text-gray-500 dark:text-gray-400'>
                    {t('achievements.subtitle') ?? 'Kumpulkan badge dengan menyelesaikan aktivitas'}
                </p>
            </div>

            {isAuthenticated && points != null && (
                <div className='bg-gradient-to-br from-amber-500 to-amber-700 rounded-2xl p-5 mb-6 text-white text-center shadow-sm'>
                    <p className='text-xs uppercase tracking-wider opacity-80 mb-1'>
                        {t('stats.total_points') ?? 'Total Poin'}
                    </p>
                    <p className='text-4xl font-extrabold tabular-nums'>{fmt(points)}</p>
                    <p className='text-xs opacity-70 mt-1'>
                        {achievements.filter((a) => earnedIds.has(a.id)).length}
                        /{achievements.length} {t('achievements.badges_earned') ?? 'badge diperoleh'}
                    </p>
                </div>
            )}

            {!isAuthenticated && (
                <div className='text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700'>
                    <p className='text-4xl mb-3'>🏅</p>
                    <p className='text-sm text-gray-500 dark:text-gray-400'>
                        {t('achievements.login_hint') ?? 'Login untuk melihat pencapaian kamu.'}
                    </p>
                </div>
            )}

            {loading && (
                <div className='space-y-3'>
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className='p-4 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 animate-pulse'>
                            <div className='flex items-center gap-3'>
                                <div className='w-12 h-12 bg-gray-200 dark:bg-slate-700 rounded-xl' />
                                <div className='flex-1'>
                                    <div className='h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/3 mb-2' />
                                    <div className='h-3 bg-gray-200 dark:bg-slate-700 rounded w-2/3' />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && achievements.length > 0 && (
                <div className='space-y-2'>
                    {achievements.map((a) => {
                        const earned = earnedIds.has(a.id);
                        return (
                            <div
                                key={a.id}
                                className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${
                                    earned
                                        ? 'bg-white dark:bg-slate-800 border-amber-200 dark:border-amber-800'
                                        : 'bg-gray-50 dark:bg-slate-900/50 border-gray-100 dark:border-slate-700 opacity-60'
                                }`}
                            >
                                <div
                                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${
                                        earned
                                            ? 'bg-amber-100 dark:bg-amber-900/30'
                                            : 'bg-gray-200 dark:bg-slate-700'
                                    }`}
                                >
                                    {a.icon || '🏅'}
                                </div>
                                <div className='flex-1 min-w-0'>
                                    <div className='flex items-center gap-2'>
                                        <p className='text-sm font-semibold text-gray-900 dark:text-white'>
                                            {a.name}
                                        </p>
                                        {earned && (
                                            <BsCheckCircle className='text-emerald-500 shrink-0' />
                                        )}
                                    </div>
                                    <p className='text-xs text-gray-500 dark:text-gray-400 mt-0.5'>
                                        {a.description}
                                    </p>
                                </div>
                                <div className='text-right shrink-0'>
                                    {earned ? (
                                        <span className='text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full'>
                                            {t('achievements.earned') ?? 'Diperoleh'}
                                        </span>
                                    ) : (
                                        <span className='text-xs bg-gray-100 dark:bg-slate-700 text-gray-400 px-2 py-0.5 rounded-full'>
                                            {t('achievements.locked') ?? 'Terkunci'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {!loading && achievements.length === 0 && (
                <div className='text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700'>
                    <BsAward className='text-4xl text-gray-300 dark:text-gray-600 mx-auto mb-3' />
                    <p className='text-sm text-gray-500 dark:text-gray-400'>
                        {t('achievements.empty') ?? 'Belum ada pencapaian yang tersedia.'}
                    </p>
                </div>
            )}
        </ContentWidth>
    );
}

export default function AchievementPage() {
    return (
        <main className='min-h-screen flex flex-col bg-parchment-50 dark:bg-slate-900'>
            <div className='pt-[72px]'>
                <AchievementContent />
            </div>
        </main>
    );
}
