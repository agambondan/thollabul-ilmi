"use client";

import { useAuth } from "@/context/Auth";
import { useLocale } from "@/context/Locale";
import { sholatTrackerApi, streakApi } from "@/lib/api";
import { useEffect, useState } from "react";
import { BsCheckCircleFill, BsCircle } from "react-icons/bs";

const PRAYERS = ["Shubuh", "Dzuhur", "Ashar", "Maghrib", "Isya"];
const PRAYER_KEYS = ["subuh", "dzuhur", "ashar", "maghrib", "isya"];
const prayerKey = (label) =>
    label === "Shubuh" ? "subuh" : label.toLowerCase();

const todayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const dateStrOffset = (offset) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const buildMonthDays = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let d = 1; d <= daysInMonth; d++) {
        const ds = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        try {
            const entry = JSON.parse(
                localStorage.getItem(`sholat_log_${ds}`) ?? "{}",
            );
            const count = PRAYERS.filter((p) => entry[prayerKey(p)]).length;
            days.push({ day: d, date: ds, count });
        } catch {
            days.push({ day: d, date: ds, count: 0 });
        }
    }
    return days;
};

const normalizePrayerLog = (payload = {}) => {
    const prayers = payload?.prayers ?? payload;
    return PRAYER_KEYS.reduce((acc, key) => {
        const value = prayers?.[key];
        if (typeof value === "boolean") {
            acc[key] = value;
        } else if (value && typeof value === "object") {
            acc[key] = value.status && value.status !== "missed";
        }
        return acc;
    }, {});
};

const SholatTrackerPage = () => {
    const { t, lang } = useLocale();
    const { isAuthenticated } = useAuth();
    const [log, setLog] = useState({});
    const [last7, setLast7] = useState([]);
    const [monthDays, setMonthDays] = useState([]);
    const [syncError, setSyncError] = useState("");

    useEffect(() => {
        const loadToday = async () => {
            let stored = {};
            try {
                stored = JSON.parse(
                    localStorage.getItem(`sholat_log_${todayStr()}`) ?? "{}",
                );
            } catch {}
            if (isAuthenticated) {
                try {
                    const res = await sholatTrackerApi.today();
                    if (!res.ok) throw new Error("failed");
                    const data = await res.json();
                    const serverLog = data?.data ?? data ?? {};
                    if (serverLog && typeof serverLog === "object") {
                        const merged = {
                            ...stored,
                            ...normalizePrayerLog(serverLog),
                        };
                        stored = merged;
                        setSyncError("");
                        try {
                            localStorage.setItem(
                                `sholat_log_${todayStr()}`,
                                JSON.stringify(merged),
                            );
                        } catch {}
                    }
                } catch {
                    setSyncError(
                        "Belum bisa memuat log sholat dari server. Cache perangkat ditampilkan.",
                    );
                }
            }
            setLog(stored);
        };
        loadToday();
        setMonthDays(buildMonthDays());
        const rows = [];
        for (let i = -6; i <= 0; i++) {
            const ds = dateStrOffset(i);
            try {
                const entry = JSON.parse(
                    localStorage.getItem(`sholat_log_${ds}`) ?? "{}",
                );
                const count = PRAYERS.filter((p) => entry[prayerKey(p)]).length;
                rows.push({ date: ds, count });
            } catch {
                rows.push({ date: ds, count: 0 });
            }
        }
        setLast7(rows);
    }, [isAuthenticated]);

    const toggle = (prayer) => {
        const key = prayerKey(prayer);
        const nowDone = !log[key];
        const updated = { ...log, [key]: nowDone };
        setLog(updated);
        try {
            localStorage.setItem(
                `sholat_log_${todayStr()}`,
                JSON.stringify(updated),
            );
        } catch {}
        if (isAuthenticated) {
            setSyncError("");
            sholatTrackerApi
                .update({
                    date: todayStr(),
                    prayer: key,
                    status: nowDone ? "munfarid" : "missed",
                })
                .catch(() => {
                    setSyncError(
                        "Perubahan sholat tersimpan di perangkat, tetapi belum tersinkron ke server.",
                    );
                });
            streakApi.logActivity("prayer").catch((e) => console.error(e));
        }
        setLast7((prev) =>
            prev.map((row) => {
                if (row.date !== todayStr()) return row;
                const count = PRAYERS.filter((p) =>
                    prayerKey(p) === key ? !log[key] : updated[prayerKey(p)],
                ).length;
                return { ...row, count };
            }),
        );
        setMonthDays(buildMonthDays());
    };

    const doneCount = PRAYERS.filter((p) => log[prayerKey(p)]).length;
    const pct = Math.round((doneCount / 5) * 100);

    return (
        <div className='px-4 py-6'>
            <h1 className='text-xl font-bold text-gray-900 dark:text-white mb-6'>
                {t("sholat.title")}
            </h1>
            {syncError ? (
                <div className='mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300'>
                    {syncError}
                </div>
            ) : null}

            {/* Progress card */}
            <div className='bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5 mb-6'>
                <div className='flex items-center justify-between mb-2'>
                    <span className='text-sm font-semibold text-gray-700 dark:text-gray-300'>
                        {t("sholat.today")}
                    </span>
                    <span className='text-2xl font-bold text-emerald-700 dark:text-emerald-400'>
                        {doneCount}/5
                    </span>
                </div>
                <div className='h-3 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden'>
                    <div
                        className='h-full bg-emerald-500 rounded-full transition-all duration-500'
                        style={{ width: `${pct}%` }}
                    />
                </div>
                <p className='text-xs text-gray-400 dark:text-gray-500 mt-1.5'>
                    {pct}% {t("sholat.pct_done")}
                </p>
            </div>

            {/* Prayer buttons */}
            <div className='grid grid-cols-1 gap-3 mb-8'>
                {PRAYERS.map((p) => {
                    const done = !!log[prayerKey(p)];
                    return (
                        <button
                            key={p}
                            onClick={() => toggle(p)}
                            className={`flex items-center gap-4 px-5 py-4 rounded-xl border transition-all text-left w-full ${
                                done
                                    ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700"
                                    : "bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-700"
                            }`}
                        >
                            {done ? (
                                <BsCheckCircleFill className='text-emerald-500 text-2xl shrink-0' />
                            ) : (
                                <BsCircle className='text-gray-300 dark:text-slate-600 text-2xl shrink-0' />
                            )}
                            <span
                                className={`text-base font-medium ${
                                    done
                                        ? "text-emerald-700 dark:text-emerald-400"
                                        : "text-gray-700 dark:text-gray-300"
                                }`}
                            >
                                {p}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Last 7 days table */}
            <div className='bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden mb-6'>
                <div className='px-5 py-3 border-b border-gray-100 dark:border-slate-700'>
                    <p className='text-sm font-semibold text-gray-700 dark:text-gray-300'>
                        {t("sholat.last_7_days")}
                    </p>
                </div>
                <table className='w-full text-sm'>
                    <thead>
                        <tr className='text-xs text-gray-400 dark:text-gray-500 border-b border-gray-50 dark:border-slate-700'>
                            <th className='text-left px-5 py-2 font-medium'>
                                {t("sholat.date_col")}
                            </th>
                            <th className='text-right px-5 py-2 font-medium'>
                                {t("sholat.prayers_col")}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {last7.map((row) => (
                            <tr
                                key={row.date}
                                className={`border-b border-gray-50 dark:border-slate-700/50 last:border-0 ${
                                    row.date === todayStr()
                                        ? "bg-emerald-50/50 dark:bg-emerald-900/10"
                                        : ""
                                }`}
                            >
                                <td className='px-5 py-2.5 text-gray-700 dark:text-gray-300'>
                                    {new Date(
                                        row.date + "T00:00:00",
                                    ).toLocaleDateString(
                                        lang === "EN" ? "en-US" : "id-ID",
                                        {
                                            weekday: "short",
                                            day: "numeric",
                                            month: "short",
                                        },
                                    )}
                                </td>
                                <td className='px-5 py-2.5 text-right'>
                                    <span
                                        className={`font-semibold ${
                                            row.count === 5
                                                ? "text-emerald-600 dark:text-emerald-400"
                                                : row.count >= 3
                                                  ? "text-amber-500 dark:text-amber-400"
                                                  : "text-gray-400 dark:text-gray-500"
                                        }`}
                                    >
                                        {row.count}/5
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Monthly calendar heatmap */}
            {monthDays.length > 0 && (
                <div className='bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5'>
                    <div className='flex items-center justify-between mb-3'>
                        <p className='text-sm font-semibold text-gray-700 dark:text-gray-300'>
                            {t("sholat.monthly_title")}
                        </p>
                        <span className='text-xs text-gray-400 dark:text-gray-500'>
                            {monthDays.filter((d) => d.count === 5).length}{" "}
                            {t("sholat.perfect_days")} ✨
                        </span>
                    </div>
                    <div className='grid grid-cols-7 gap-1'>
                        {Array.from({ length: 7 }, (_, i) =>
                            new Date(2024, 0, 7 + i).toLocaleDateString(
                                lang === "EN" ? "en-US" : "id-ID",
                                { weekday: "short" },
                            ),
                        ).map((d) => (
                            <div
                                key={d}
                                className='text-[10px] text-gray-400 dark:text-gray-500 text-center font-medium pb-1'
                            >
                                {d}
                            </div>
                        ))}
                        {Array.from({
                            length: new Date(
                                new Date().getFullYear(),
                                new Date().getMonth(),
                                1,
                            ).getDay(),
                        }).map((_, i) => (
                            <div key={`empty-${i}`} />
                        ))}
                        {monthDays.map((d) => {
                            const isToday = d.date === todayStr();
                            const isFuture = d.date > todayStr();
                            const bgColor = isFuture
                                ? "bg-gray-50 dark:bg-slate-700/30"
                                : d.count === 5
                                  ? "bg-emerald-500 dark:bg-emerald-600"
                                  : d.count >= 3
                                    ? "bg-amber-400 dark:bg-amber-500"
                                    : d.count >= 1
                                      ? "bg-orange-300 dark:bg-orange-600"
                                      : "bg-gray-200 dark:bg-slate-700";
                            return (
                                <div
                                    key={d.day}
                                    title={`${d.date}: ${d.count}/5`}
                                    className={`aspect-square rounded-md flex items-center justify-center text-[11px] font-medium transition-all ${bgColor} ${
                                        isToday
                                            ? "ring-2 ring-emerald-500 ring-offset-1 dark:ring-offset-slate-800"
                                            : ""
                                    } ${
                                        isFuture
                                            ? "text-gray-300 dark:text-slate-600"
                                            : d.count > 0
                                              ? "text-white"
                                              : "text-gray-400 dark:text-gray-500"
                                    }`}
                                >
                                    {d.day}
                                </div>
                            );
                        })}
                    </div>
                    <div className='flex items-center gap-3 mt-3 text-[10px] text-gray-400 dark:text-gray-500'>
                        <span className='flex items-center gap-1'>
                            <span className='w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block' />
                            5/5
                        </span>
                        <span className='flex items-center gap-1'>
                            <span className='w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block' />
                            3-4
                        </span>
                        <span className='flex items-center gap-1'>
                            <span className='w-2.5 h-2.5 rounded-sm bg-orange-300 inline-block' />
                            1-2
                        </span>
                        <span className='flex items-center gap-1'>
                            <span className='w-2.5 h-2.5 rounded-sm bg-gray-200 dark:bg-slate-700 inline-block' />
                            0
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SholatTrackerPage;
