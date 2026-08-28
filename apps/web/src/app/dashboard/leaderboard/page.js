"use client";

import { useAuth } from "@/context/Auth";
import { leaderboardApi } from "@/lib/api";
import { useEffect, useState } from "react";
import { BsTrophyFill } from "react-icons/bs";
import { useLocale } from "@/context/Locale";
import { useLayoutMode } from "@/lib/useLayoutMode";

const MEDALS = ["🥇", "🥈", "🥉"];

const LeaderboardPage = () => {
    const { user } = useAuth();
    const { t } = useLocale();
    const { isWide } = useLayoutMode();
    const [tab, setTab] = useState("streak");
    const [streakList, setStreakList] = useState([]);
    const [hafalanList, setHafalanList] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const sr = await leaderboardApi.streak();
                const sData = await sr.json();
                const s = sData?.items ?? sData ?? [];
                setStreakList(Array.isArray(s) ? s : []);
            } catch {
                setStreakList([]);
            }
            try {
                const hr = await leaderboardApi.hafalan();
                const hData = await hr.json();
                const h = hData?.items ?? hData ?? [];
                setHafalanList(Array.isArray(h) ? h : []);
            } catch {
                setHafalanList([]);
            }
            setLoading(false);
        };
        load();
    }, []);

    const activeList = tab === "streak" ? streakList : hafalanList;
    const scoreLabel =
        tab === "streak" ? t("leaderboard.days_unit") : t("stats.surah_unit");

    return (
        <div className={isWide ? "px-4 py-6" : "px-4 py-6 max-w-md mx-auto"}>
            <div className='flex items-center gap-2 mb-6'>
                <BsTrophyFill className='text-amber-500 text-xl' />
                <h1 className='text-xl font-bold text-gray-900 dark:text-white'>
                    {t("leaderboard.title")}
                </h1>
            </div>

            {/* Tabs */}
            <div className='flex gap-1 mb-6 bg-gray-100 dark:bg-slate-800 rounded-lg p-1'>
                {["streak", "hafalan"].map((tabKey) => (
                    <button
                        key={tabKey}
                        onClick={() => setTab(tabKey)}
                        className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
                            tab === tabKey
                                ? "bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-sm"
                                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                        }`}
                    >
                        {tabKey === "streak"
                            ? t("leaderboard.streak_tab")
                            : t("leaderboard.hafalan")}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className='text-center py-16 text-gray-400 text-sm'>
                    {t("leaderboard.loading")}
                </div>
            ) : activeList.length === 0 ? (
                <div className='text-center py-16'>
                    <BsTrophyFill className='mx-auto text-4xl text-gray-200 dark:text-slate-700 mb-3' />
                    <p className='text-gray-400 text-sm'>
                        {t("leaderboard.empty") ??
                            "Belum ada data leaderboard."}
                    </p>
                </div>
            ) : (
                <ul className='space-y-2'>
                    {activeList.map((item, idx) => {
                        const isCurrentUser =
                            user?.name &&
                            item.name?.toLowerCase() ===
                                user.name.toLowerCase();
                        return (
                            <li
                                key={idx}
                                className={`flex items-center gap-4 px-4 py-3.5 rounded-xl border transition-all ${
                                    isCurrentUser
                                        ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700"
                                        : "bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700"
                                }`}
                            >
                                <span className='text-xl w-7 text-center shrink-0'>
                                    {idx < 3 ? MEDALS[idx] : `${idx + 1}`}
                                </span>
                                <span
                                    className={`flex-1 text-sm font-medium ${
                                        isCurrentUser
                                            ? "text-emerald-700 dark:text-emerald-400"
                                            : "text-gray-700 dark:text-gray-300"
                                    }`}
                                >
                                    {item.name}
                                    {isCurrentUser && (
                                        <span className='ml-2 text-xs text-emerald-500'>
                                            ({t("leaderboard.you")})
                                        </span>
                                    )}
                                </span>
                                <span
                                    className={`text-sm font-bold ${
                                        idx === 0
                                            ? "text-amber-500"
                                            : idx === 1
                                              ? "text-gray-400"
                                              : idx === 2
                                                ? "text-amber-700 dark:text-amber-600"
                                                : "text-gray-500 dark:text-gray-400"
                                    }`}
                                >
                                    {item.score}{" "}
                                    <span className='text-xs font-normal text-gray-400'>
                                        {scoreLabel}
                                    </span>
                                </span>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};

export default LeaderboardPage;
