'use client';

import { useLocale } from '@/context/Locale';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { MdAccessTime } from 'react-icons/md';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

const PRAYER_KEYS = [
    { key: 'fajr', labelKey: 'prayer.fajr' },
    { key: 'dhuhr', labelKey: 'prayer.dhuhr' },
    { key: 'asr', labelKey: 'prayer.asr' },
    { key: 'maghrib', labelKey: 'prayer.maghrib' },
    { key: 'isha', labelKey: 'prayer.isha' },
];

const parseMinutes = (str) => {
    if (!str) return null;
    const m = str.match(/(\d+):(\d+)/);
    return m ? +m[1] * 60 + +m[2] : null;
};

const fmtCountdown = (secs) => {
    if (secs < 0) return '00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}j ${String(m).padStart(2, '0')}m`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export default function PrayerCountdownWidget({ basePath = '/jadwal-sholat' }) {
    const { t } = useLocale();
    const [prayers, setPrayers] = useState(null);
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const today = new Date().toISOString().slice(0, 10);
        fetch(
            `${API_URL}/api/v1/sholat-times?lat=-6.2088&lng=106.8456&method=kemenag&madhab=shafi&date=${today}`,
        )
            .then((r) => r.json())
            .then((d) => setPrayers(d?.data?.prayers ?? null))
            .catch(e => console.error(e));
    }, []);

    useEffect(() => {
        const iv = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(iv);
    }, []);

    if (!prayers) return null;

    const nowMins = now.getHours() * 60 + now.getMinutes();

    // Find next prayer
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
        // After Isha — next is Fajr tomorrow
        nextPrayer = PRAYER_KEYS[0];
        const fajrMins = parseMinutes(prayers['fajr']);
        nextMins = fajrMins !== null ? fajrMins + 24 * 60 : null;
    }

    const secsLeft = nextMins !== null ? (nextMins - nowMins) * 60 - now.getSeconds() : null;

    return (
        <Link
            href={basePath}
            className='block bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-700 dark:to-teal-700 rounded-2xl px-4 py-3 text-white hover:opacity-90 transition-opacity'
        >
            <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                    <MdAccessTime className='text-xl text-emerald-200' />
                    <div>
                        <p className='text-xs text-emerald-200 leading-none'>
                            {t('prayer_schedule.next') ?? 'Waktu berikutnya'}
                        </p>
                        <p className='text-sm font-bold leading-tight'>
                            {t(nextPrayer.labelKey)} — {prayers[nextPrayer.key]}
                        </p>
                    </div>
                </div>
                <div className='text-right'>
                    <p className='text-xs text-emerald-200 leading-none mb-0.5'>
                        {t('prayer_schedule.in') ?? 'dalam'}
                    </p>
                    <p className='text-2xl font-extrabold tabular-nums leading-none'>
                        {secsLeft !== null ? fmtCountdown(secsLeft) : '--:--'}
                    </p>
                </div>
            </div>
        </Link>
    );
}
