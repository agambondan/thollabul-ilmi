'use client';

import { useLocale } from '@/context/Locale';
import { useAuth } from '@/context/Auth';
import {
    achievementApi,
    bookmarkApi,
    goalsApi,
    hafalanApi,
    muhasabahApi,
    sholatTrackerApi,
    statsApi,
    tilawahApi,
} from '@/lib/api';
import {
    buildLocalPrayerRows,
    calcLocalPrayerStreak,
    countDonePrayers,
    isGoalCompleted,
    isHafalanMemorized,
    normalizeGoal,
    normalizeHafalan,
    normalizeMuhasabah,
    normalizePrayerLog,
    normalizeTilawahEntry,
    parseApiJson,
    pickItems,
    prayerKey,
    readLocalArray,
    readLocalPrayerLog,
    sumTilawahPages,
    todayISO,
    writeLocalArray,
    writeLocalPrayerLog,
} from '@/lib/personalSync';
import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const isSameWeek = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    return d >= startOfWeek;
};

const isSameMonth = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
};

const normalizeHistoryRows = (payload) => {
    const byDate = new Map(buildLocalPrayerRows(7).map((row) => [row.date, { ...row, count: 0 }]));
    pickItems(payload).forEach((entry) => {
        const date = entry.date;
        if (!date || !byDate.has(date)) return;
        const current = byDate.get(date);
        const key = prayerKey(entry.prayer);
        if (!current.prayers) current.prayers = {};
        current.prayers[key] = entry.status !== 'missed';
        current.count = countDonePrayers(current.prayers);
    });
    return [...byDate.values()].map(({ date, count }) => ({ date, count }));
};

const StatsPage = () => {
    const { t, lang } = useLocale();
    const { isAuthenticated } = useAuth();
    const [todayPrayer, setTodayPrayer] = useState({});
    const [muhasabahCount, setMuhasabahCount] = useState(0);
    const [activeGoals, setActiveGoals] = useState(0);
    const [bookmarkCount, setBookmarkCount] = useState(0);
    const [hafalCount, setHafalCount] = useState(0);
    const [last7, setLast7] = useState([]);
    const [achievements, setAchievements] = useState([]);
    const [points, setPoints] = useState(0);
    const [prayerStreak, setPrayerStreak] = useState(0);
    const [tilawahWeek, setTilawahWeek] = useState(0);
    const [tilawahMonth, setTilawahMonth] = useState(0);
    const [syncError, setSyncError] = useState('');

    useEffect(() => {
        const localPrayer = readLocalPrayerLog(todayISO());
        const localMuhasabah = readLocalArray('tholabul_muhasabah').map(normalizeMuhasabah);
        const localGoals = readLocalArray('tholabul_goals').map(normalizeGoal);
        const localHafalan = readLocalArray('tholabul_hafalan').map(normalizeHafalan);
        const localTilawah = readLocalArray('tholabul_tilawah').map(normalizeTilawahEntry);

        setTodayPrayer(localPrayer);
        setMuhasabahCount(localMuhasabah.length);
        setActiveGoals(localGoals.filter((g) => !isGoalCompleted(g)).length);
        setHafalCount(localHafalan.filter(isHafalanMemorized).length);
        setPrayerStreak(calcLocalPrayerStreak());
        setTilawahWeek(sumTilawahPages(localTilawah, isSameWeek));
        setTilawahMonth(sumTilawahPages(localTilawah, isSameMonth));
        setLast7(buildLocalPrayerRows(7));

        const loadApiStats = async () => {
            if (!isAuthenticated) return;
            try {
                const [
                    todayPayload,
                    historyPayload,
                    muhasabahPayload,
                    goalsPayload,
                    hafalanPayload,
                    tilawahPayload,
                    statsPayload,
                ] = await Promise.all([
                    sholatTrackerApi.today().then(parseApiJson),
                    sholatTrackerApi.history().then(parseApiJson),
                    muhasabahApi.list().then(parseApiJson),
                    goalsApi.list().then(parseApiJson),
                    hafalanApi.list().then(parseApiJson),
                    tilawahApi.list().then(parseApiJson),
                    statsApi.summary().then(parseApiJson),
                ]);
                const prayer = normalizePrayerLog(todayPayload);
                const muhasabah = pickItems(muhasabahPayload).map(normalizeMuhasabah);
                const goals = pickItems(goalsPayload).map(normalizeGoal);
                const hafalan = pickItems(hafalanPayload).map(normalizeHafalan);
                const tilawah = pickItems(tilawahPayload).map(normalizeTilawahEntry);
                const stats = statsPayload?.data ?? statsPayload ?? {};

                setTodayPrayer(prayer);
                setMuhasabahCount(muhasabah.length);
                setActiveGoals(goals.filter((g) => !isGoalCompleted(g)).length);
                setHafalCount(
                    Number(stats.hafalan ?? NaN) || hafalan.filter(isHafalanMemorized).length,
                );
                setPrayerStreak(Number(stats.streak ?? NaN) || calcLocalPrayerStreak());
                setTilawahWeek(sumTilawahPages(tilawah, isSameWeek));
                setTilawahMonth(sumTilawahPages(tilawah, isSameMonth));
                setLast7(normalizeHistoryRows(historyPayload));
                writeLocalPrayerLog(todayISO(), prayer);
                writeLocalArray('tholabul_muhasabah', muhasabah);
                writeLocalArray('tholabul_goals', goals);
                writeLocalArray('tholabul_hafalan', hafalan);
                writeLocalArray('tholabul_tilawah', tilawah);
                setSyncError('');
            } catch {
                setSyncError('Stat personal memakai salinan lokal karena sinkron server belum tersedia.');
            }
        };
        loadApiStats();

        bookmarkApi
            .list()
            .then((r) => r.json())
            .then((d) => {
                const items = d?.items ?? d ?? [];
                setBookmarkCount(Array.isArray(items) ? items.length : 0);
            })
            .catch(e => console.error(e));

        if (isAuthenticated) {
            achievementApi
                .mine()
                .then((r) => r.json())
                .then((d) => setAchievements(Array.isArray(d) ? d : (d?.data ?? [])))
                .catch(e => console.error(e));
            achievementApi
                .points()
                .then((r) => r.json())
                .then((d) => setPoints(d?.total_points ?? d?.data?.total_points ?? 0))
                .catch(e => console.error(e));
        }

    }, [isAuthenticated]);

    const prayerCount = countDonePrayers(todayPrayer);

    return (
        <div className='px-4 py-6'>
            <h1 className='text-xl font-bold text-gray-900 dark:text-white mb-6'>
                {t('stats.title')}
            </h1>
            {syncError ? (
                <div className='mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300'>
                    {syncError}
                </div>
            ) : null}

            {/* Stat cards */}
            <div className='grid grid-cols-2 gap-3 mb-6'>
                <div className='bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4'>
                    <p className='text-2xl font-bold text-emerald-700 dark:text-emerald-400'>
                        {prayerCount}/5
                    </p>
                    <p className='text-xs text-gray-500 dark:text-gray-400 mt-0.5'>
                        {t('stats.today_prayers')}
                    </p>
                </div>
                <div className='bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4'>
                    <p className='text-2xl font-bold text-purple-600 dark:text-purple-400'>
                        {muhasabahCount}
                    </p>
                    <p className='text-xs text-gray-500 dark:text-gray-400 mt-0.5'>
                        {t('stats.total_muhasabah')}
                    </p>
                </div>
                <div className='bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4'>
                    <p className='text-2xl font-bold text-blue-600 dark:text-blue-400'>
                        {activeGoals}
                    </p>
                    <p className='text-xs text-gray-500 dark:text-gray-400 mt-0.5'>
                        {t('stats.active_goals')}
                    </p>
                </div>
                <div className='bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4'>
                    <p className='text-2xl font-bold text-amber-600 dark:text-amber-400'>
                        {bookmarkCount}
                    </p>
                    <p className='text-xs text-gray-500 dark:text-gray-400 mt-0.5'>
                        {t('stats.total_bookmarks')}
                    </p>
                </div>
                <div className='bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4'>
                    <div className='flex items-center gap-1.5'>
                        <p className='text-2xl font-bold text-orange-600 dark:text-orange-400'>
                            {prayerStreak}
                        </p>
                        <span className='text-xl'>🔥</span>
                    </div>
                    <p className='text-xs text-gray-500 dark:text-gray-400 mt-0.5'>
                        {t('stats.prayer_streak')}
                    </p>
                </div>
                {isAuthenticated && (
                    <div className='col-span-2 bg-gradient-to-r from-amber-500 to-yellow-400 rounded-xl p-4 flex items-center justify-between'>
                        <div>
                            <p className='text-2xl font-bold text-white'>{points}</p>
                            <p className='text-xs text-amber-100 mt-0.5'>
                                {t('stats.total_points')}
                            </p>
                        </div>
                        <span className='text-4xl'>⭐</span>
                    </div>
                )}
            </div>

            {/* Hafalan summary */}
            <div className='bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4 mb-6'>
                <p className='text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1'>
                    {t('stats.hafalan_title')}
                </p>
                <p className='text-2xl font-bold text-emerald-700 dark:text-emerald-400'>
                    {hafalCount}
                    <span className='text-sm font-normal text-gray-400 dark:text-gray-500 ml-1'>
                        {t('stats.surah_unit')}
                    </span>
                </p>
            </div>

            {/* Tilawah summary */}
            <div className='bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4 mb-6'>
                <p className='text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3'>
                    {t('stats.tilawah_title')}
                </p>
                <div className='flex gap-6'>
                    <div>
                        <p className='text-2xl font-bold text-teal-600 dark:text-teal-400'>
                            {tilawahWeek}
                            <span className='text-xs font-normal text-gray-400 dark:text-gray-500 ml-1'>
                                {t('tilawah.pages_unit')}
                            </span>
                        </p>
                        <p className='text-xs text-gray-400 dark:text-gray-500 mt-0.5'>
                            {t('stats.this_week')}
                        </p>
                    </div>
                    <div>
                        <p className='text-2xl font-bold text-teal-600 dark:text-teal-400'>
                            {tilawahMonth}
                            <span className='text-xs font-normal text-gray-400 dark:text-gray-500 ml-1'>
                                {t('tilawah.pages_unit')}
                            </span>
                        </p>
                        <p className='text-xs text-gray-400 dark:text-gray-500 mt-0.5'>
                            {t('stats.this_month')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Achievement badges */}
            {isAuthenticated && achievements.length > 0 && (
                <div className='bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4 mb-6'>
                    <p className='text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3'>
                        {t('stats.achievements')} ({achievements.length})
                    </p>
                    <div className='grid grid-cols-3 gap-2'>
                        {achievements.map((ua) => {
                            const a = ua.achievement ?? ua;
                            return (
                                <div
                                    key={ua.id ?? a.id}
                                    className='flex flex-col items-center bg-amber-50 dark:bg-slate-700 rounded-lg p-2 text-center'
                                >
                                    <span className='text-2xl mb-1'>{a.icon || '🏅'}</span>
                                    <p className='text-[11px] font-semibold text-gray-700 dark:text-gray-200 leading-tight'>
                                        {a.name}
                                    </p>
                                    <p className='text-[10px] text-gray-400 dark:text-gray-400 mt-0.5 leading-tight'>
                                        {a.description}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Prayer bar chart */}
            <div className='bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5'>
                <p className='text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4'>
                    {t('stats.prayer_chart_title')}
                </p>
                <div className='flex items-end justify-between gap-2 h-28'>
                    {last7.map((row) => {
                        const heightPct = Math.max(4, (row.count / 5) * 100);
                        const isToday = row.date === todayISO();
                        return (
                            <div
                                key={row.date}
                                className='flex-1 flex flex-col items-center gap-1'
                            >
                                <span className='text-xs font-semibold text-gray-600 dark:text-gray-300'>
                                    {row.count}
                                </span>
                                <div
                                    className={`w-full rounded-t-md transition-all ${
                                        isToday
                                            ? 'bg-emerald-500'
                                            : row.count === 5
                                              ? 'bg-emerald-400'
                                              : row.count >= 3
                                                ? 'bg-amber-400'
                                                : 'bg-gray-200 dark:bg-slate-600'
                                    }`}
                                    style={{ height: `${heightPct}%` }}
                                />
                                <span className='text-[10px] text-gray-400 dark:text-gray-500'>
                                    {new Date(row.date + 'T00:00:00').toLocaleDateString(
                                        lang === 'EN' ? 'en-US' : 'id-ID',
                                        { weekday: 'short' },
                                    )}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Streak line chart */}
            {last7.length > 0 && (
                <div className='bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5 mt-6'>
                    <p className='text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4'>
                        {t('stats.weekly_activity') ?? 'Aktivitas Mingguan'}
                    </p>
                    <ResponsiveContainer width='100%' height={200}>
                        <LineChart data={last7.map((r) => ({ date: r.date.slice(5), count: r.count }))}>
                            <XAxis dataKey='date' tick={{ fontSize: 11 }} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Line type='monotone' dataKey='count' stroke='#10b981' strokeWidth={2} dot={{ fill: '#10b981' }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
};

export default StatsPage;
