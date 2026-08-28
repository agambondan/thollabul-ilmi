"use client";

import { useAuth } from "@/context/Auth";
import { useLocale } from "@/context/Locale";
import { amalanApi, streakApi } from "@/lib/api";
import { useEffect, useState } from "react";
import { BsCheckCircleFill, BsCircle } from "react-icons/bs";

const FALLBACK_KEYS = [
    "amalan.item.subuh_jamaah",
    "amalan.item.dhuha",
    "amalan.item.tahajud",
    "amalan.item.quran",
    "amalan.item.dzikir_pagi",
    "amalan.item.dzikir_petang",
    "amalan.item.puasa_sunnah",
];

const todayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const localKey = () => `tholabul_amalan_${todayStr()}`;

const AmalanPage = () => {
    const { t } = useLocale();
    const { isAuthenticated } = useAuth();
    // items: [{ id: string, label: string, done: boolean, serverId: number|null, isKey: boolean }]
    const [items, setItems] = useState([]);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const stored = (() => {
            try {
                return JSON.parse(localStorage.getItem(localKey()) ?? "{}");
            } catch {
                return {};
            }
        })();

        const loadFallback = () => {
            setItems(
                FALLBACK_KEYS.map((k) => ({
                    id: k,
                    label: k,
                    done: !!stored[k],
                    serverId: null,
                    isKey: true,
                })),
            );
            setLoaded(true);
        };

        if (isAuthenticated) {
            amalanApi
                .today()
                .then((r) => r.json())
                .then((data) => {
                    const list =
                        data?.items ?? (Array.isArray(data) ? data : []);
                    if (list.length > 0) {
                        setItems(
                            list.map((item) => ({
                                id: String(item.id),
                                label:
                                    item.name_id ??
                                    item.name ??
                                    item.title ??
                                    String(item.id),
                                done: !!item.is_checked,
                                serverId: item.id,
                                isKey: false,
                            })),
                        );
                        setLoaded(true);
                    } else {
                        loadFallback();
                    }
                })
                .catch(loadFallback);
        } else {
            loadFallback();
        }
    }, [isAuthenticated]);

    const toggle = (idx) => {
        const item = items[idx];
        const newDone = !item.done;
        const updated = items.map((it, i) =>
            i === idx ? { ...it, done: newDone } : it,
        );
        setItems(updated);

        try {
            const stored = JSON.parse(localStorage.getItem(localKey()) ?? "{}");
            stored[item.id] = newDone;
            localStorage.setItem(localKey(), JSON.stringify(stored));
        } catch {}

        if (isAuthenticated) {
            if (item.serverId !== null)
                amalanApi.check(item.serverId).catch((e) => console.error(e));
            if (newDone)
                streakApi.logActivity("amalan").catch((e) => console.error(e));
        }
    };

    const doneCount = items.filter((it) => it.done).length;
    const total = items.length;
    const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

    return (
        <div className='px-4 py-6'>
            <h1 className='text-xl font-bold text-gray-900 dark:text-white mb-1'>
                {t("amalan.title")}
            </h1>
            <p className='text-sm text-gray-500 dark:text-gray-400 mb-6'>
                {t("amalan.completed_today")}:{" "}
                <span className='font-semibold text-emerald-700 dark:text-emerald-400'>
                    {doneCount}
                </span>
            </p>

            {/* Progress */}
            <div className='bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5 mb-6'>
                <div className='flex items-center justify-between mb-2'>
                    <span className='text-sm font-semibold text-gray-700 dark:text-gray-300'>
                        {t("amalan.progress")}
                    </span>
                    <span className='text-2xl font-bold text-emerald-700 dark:text-emerald-400'>
                        {doneCount}/{total}
                    </span>
                </div>
                <div className='h-3 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden'>
                    <div
                        className='h-full bg-emerald-500 rounded-full transition-all duration-500'
                        style={{ width: `${pct}%` }}
                    />
                </div>
                <p className='text-xs text-gray-400 dark:text-gray-500 mt-1.5'>
                    {pct}%
                </p>
            </div>

            {/* Checklist */}
            {loaded && (
                <ul className='space-y-2'>
                    {items.map((item, idx) => {
                        const done = item.done;
                        const label = item.isKey ? t(item.label) : item.label;
                        return (
                            <li key={item.id}>
                                <button
                                    onClick={() => toggle(idx)}
                                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl border transition-all text-left ${
                                        done
                                            ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700"
                                            : "bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-700"
                                    }`}
                                >
                                    {done ? (
                                        <BsCheckCircleFill className='text-emerald-500 text-xl shrink-0' />
                                    ) : (
                                        <BsCircle className='text-gray-300 dark:text-slate-600 text-xl shrink-0' />
                                    )}
                                    <span
                                        className={`text-sm font-medium ${
                                            done
                                                ? "text-emerald-700 dark:text-emerald-400 line-through"
                                                : "text-gray-700 dark:text-gray-300"
                                        }`}
                                    >
                                        {label}
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};

export default AmalanPage;
