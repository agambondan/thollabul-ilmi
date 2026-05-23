'use client';

import { useLocale } from '@/context/Locale';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
    MdAccessTime,
    MdCalendarToday,
    MdNightsStay,
    MdOutlineWbSunny,
    MdWbSunny,
} from 'react-icons/md';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

const DASHBOARD_LOCATION = {
    label: 'Kecamatan Cileungsi',
    lat: -6.399,
    lng: 106.959,
};

const PRAYER_KEYS = [
    { key: 'fajr', label: 'Subuh', icon: MdNightsStay },
    { key: 'dhuhr', label: 'Dzuhur', icon: MdWbSunny },
    { key: 'asr', label: 'Ashar', icon: MdOutlineWbSunny },
    { key: 'maghrib', label: 'Maghrib', icon: MdOutlineWbSunny },
    { key: 'isha', label: 'Isya', icon: MdNightsStay },
];

const DISPLAY_PRAYERS = [
    { key: 'fajr', label: 'Subuh', icon: MdNightsStay },
    { key: 'sunrise', label: 'Terbit', icon: MdOutlineWbSunny },
    { key: 'dhuhr', label: 'Dzuhur', icon: MdWbSunny },
    { key: 'asr', label: 'Ashar', icon: MdOutlineWbSunny },
    { key: 'maghrib', label: 'Maghrib', icon: MdOutlineWbSunny },
    { key: 'isha', label: 'Isya', icon: MdNightsStay },
];

const parseMinutes = (str) => {
    if (!str) return null;
    const m = str.match(/(\d+):(\d+)/);
    return m ? +m[1] * 60 + +m[2] : null;
};

const formatTime = (value) => {
    if (!value) return '--:--';
    const match = String(value).match(/(\d{1,2}):(\d{2})/);
    if (!match) return value;
    return `${match[1].padStart(2, '0')}:${match[2]}`;
};

const fmtCountdown = (secs) => {
    if (secs < 0) return '00:00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
};

const fmtRemainingText = (secs, label) => {
    if (secs < 0) return `${label} sudah lewat`;
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    if (h <= 0) return `${label} dalam ${Math.max(1, m)} menit`;
    return `${label} dalam ${h} jam ${m} menit`;
};

const formatGregorianDate = (date) =>
    date.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

const formatHijriDate = (date) => {
    try {
        return new Intl.DateTimeFormat('id-ID-u-ca-islamic-civil', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        })
            .format(date)
            .replace(/\sAH$/i, ' H');
    } catch {
        return '';
    }
};

export default function PrayerCountdownWidget({ basePath = '/jadwal-sholat' }) {
    const { t } = useLocale();
    const [prayers, setPrayers] = useState(null);
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const today = new Date().toISOString().slice(0, 10);
        fetch(
            `${API_URL}/api/v1/sholat-times?lat=${DASHBOARD_LOCATION.lat}&lng=${DASHBOARD_LOCATION.lng}&method=kemenag&madhab=shafi&date=${today}`,
        )
            .then((r) => r.json())
            .then((d) => setPrayers(d?.data?.prayers ?? d?.prayers ?? null))
            .catch(e => console.error(e));
    }, []);

    useEffect(() => {
        const iv = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(iv);
    }, []);

    if (!prayers) return null;

    const nowMins = now.getHours() * 60 + now.getMinutes();

    let nextPrayer = null;
    let nextMins = null;
    for (const p of PRAYER_KEYS) {
        const mins = parseMinutes(prayers[p.key]);
        if (mins !== null && mins > nowMins) {
            nextPrayer = p;
            nextMins = mins;
            break;
        }
    }
    if (!nextPrayer) {
        // After Isha, next is Fajr tomorrow.
        nextPrayer = PRAYER_KEYS[0];
        const fajrMins = parseMinutes(prayers['fajr']);
        nextMins = fajrMins !== null ? fajrMins + 24 * 60 : null;
    }

    const secsLeft = nextMins !== null ? (nextMins - nowMins) * 60 - now.getSeconds() : null;
    const hijriDate = formatHijriDate(now);

    return (
        <Link
            href={basePath}
            className='block rounded-2xl border border-stone-200 bg-[#f8f5ed] px-4 py-4 text-stone-900 shadow-sm transition-colors hover:border-emerald-200 hover:bg-[#fbf8f1] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-emerald-700'
            aria-label='Jadwal sholat hari ini'
        >
            <div className='flex flex-wrap items-start justify-between gap-3'>
                <div className='inline-flex max-w-full items-center gap-1.5 rounded-lg border border-stone-200 bg-white/55 px-2.5 py-2 text-[10px] font-extrabold uppercase tracking-wide text-emerald-800 dark:border-slate-700 dark:bg-slate-900/60 dark:text-emerald-300'>
                    <MdAccessTime className='text-sm' />
                    <span className='truncate'>{DASHBOARD_LOCATION.label}</span>
                </div>
                <div className='text-right text-xs font-bold text-stone-800 dark:text-slate-200'>
                    <p>{formatGregorianDate(now)}</p>
                    {hijriDate ? (
                        <p className='mt-1 flex items-center justify-end gap-1 text-amber-700 dark:text-amber-300'>
                            <MdCalendarToday className='text-sm' />
                            {hijriDate}
                        </p>
                    ) : null}
                </div>
            </div>

            <div className='py-7 text-center'>
                <p className='text-xs font-extrabold uppercase tracking-wide text-emerald-800 dark:text-emerald-300'>
                    Menuju {nextPrayer.label}
                </p>
                <p className='mt-2 text-5xl font-extrabold leading-none text-stone-800 tabular-nums dark:text-white'>
                    {formatTime(prayers[nextPrayer.key])}
                </p>
                <p className='mt-3 text-sm font-semibold text-stone-500 dark:text-slate-400'>
                    {secsLeft !== null ? fmtRemainingText(secsLeft, nextPrayer.label) : ''}
                </p>
                <div className='mt-4 inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white/65 px-3 py-2 text-sm font-extrabold text-stone-700 shadow-sm dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200'>
                    <MdAccessTime className='text-emerald-700 dark:text-emerald-300' />
                    <span className='tabular-nums'>
                        {secsLeft !== null ? fmtCountdown(secsLeft) : '--:--:--'}
                    </span>
                </div>
            </div>

            <div className='border-t border-stone-200 pt-3 dark:border-slate-700'>
                <div className='grid grid-cols-3 gap-y-3 min-[390px]:grid-cols-6'>
                    {DISPLAY_PRAYERS.map((prayer) => {
                        const Icon = prayer.icon;
                        const isActive = prayer.key === nextPrayer.key;

                        return (
                            <div
                                key={prayer.key}
                                className={`flex min-w-0 flex-col items-center gap-1 text-center ${
                                    isActive
                                        ? 'text-amber-700 dark:text-amber-300'
                                        : 'text-stone-600 dark:text-slate-400'
                                }`}
                            >
                                <span className='text-[11px] font-extrabold leading-tight'>
                                    {prayer.label}
                                </span>
                                <Icon
                                    className={`text-2xl ${
                                        isActive
                                            ? 'text-amber-700 dark:text-amber-300'
                                            : 'text-emerald-800/75 dark:text-slate-400'
                                    }`}
                                    aria-hidden='true'
                                />
                                <span className='text-[11px] font-extrabold tabular-nums leading-tight'>
                                    {formatTime(prayers[prayer.key])}
                                </span>
                            </div>
                        );
                    })}
                </div>
                <p className='sr-only'>
                    {t('prayer_schedule.next')}: {nextPrayer.label}{' '}
                    {formatTime(prayers[nextPrayer.key])}
                    {secsLeft !== null ? `, ${fmtCountdown(secsLeft)}` : ''}
                </p>
            </div>
        </Link>
    );
}
