"use client";

import { useEffect, useState } from "react";
import { BsBookmarkFill, BsTrash, BsPlay } from "react-icons/bs";
import { useLocale } from "@/context/Locale";
import { getLocalizedField } from "@/lib/translation";

const formatTime = (seconds) => {
    const s = Math.floor(Number(seconds) || 0);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) {
        return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    }
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

export default function SavedBookmarksView() {
    const { t } = useLocale();
    const [groups, setGroups] = useState([]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const out = [];
        for (let i = 0; i < window.localStorage.length; i += 1) {
            const key = window.localStorage.key(i);
            if (!key || !key.startsWith("kajian-bookmarks:")) continue;
            const kajianId = key.split(":")[1];
            let seconds = [];
            try {
                const arr = JSON.parse(window.localStorage.getItem(key) || "[]");
                seconds = Array.isArray(arr)
                    ? arr.map((n) => Number(n)).filter((n) => Number.isFinite(n))
                    : [];
            } catch {
                seconds = [];
            }
            if (!seconds.length) continue;
            out.push({ key, kajianId, seconds });
        }
        setGroups(out);
    }, []);

    const removeBookmark = (kajianId, second) => {
        const key = `kajian-bookmarks:${kajianId}`;
        try {
            const arr = JSON.parse(window.localStorage.getItem(key) || "[]")
                .map(Number)
                .filter((n) => Number.isFinite(n) && n !== second);
            window.localStorage.setItem(key, JSON.stringify(arr));
        } catch {
            window.localStorage.setItem(key, JSON.stringify([]));
        }
        setGroups((prev) =>
            prev
                .map((g) =>
                    g.kajianId === kajianId
                        ? { ...g, seconds: g.seconds.filter((s) => s !== second) }
                        : g,
                )
                .filter((g) => g.seconds.length > 0),
        );
    };

    if (!groups.length) {
        return (
            <div className='text-center py-12 text-sm text-slate-500 dark:text-slate-400'>
                {t("kajian.no_bookmarks") || "Belum ada bookmark tersimpan."}
            </div>
        );
    }

    return (
        <div className='space-y-4'>
            {groups.map((g) => (
                <div
                    key={g.key}
                    className='rounded-xl border border-amber-200/60 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-900/10 p-4'
                >
                    <div className='flex items-center gap-2 mb-3'>
                        <BsBookmarkFill className='text-amber-600 dark:text-amber-400' />
                        <span className='text-sm font-semibold text-amber-800 dark:text-amber-200'>
                            Kajian #{g.kajianId}
                        </span>
                    </div>
                    <ul className='space-y-2'>
                        {[...g.seconds].sort((a, b) => a - b).map((s) => (
                            <li
                                key={s}
                                className='flex items-center justify-between gap-2 text-sm'
                            >
                                <a
                                    href={`/kajian?focus=${g.kajianId}&t=${Math.floor(s)}`}
                                    className='inline-flex items-center gap-2 text-emerald-700 dark:text-emerald-300 hover:underline'
                                >
                                    <BsPlay />
                                    {formatTime(s)}
                                </a>
                                <button
                                    type='button'
                                    onClick={() => removeBookmark(g.kajianId, s)}
                                    className='inline-flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 hover:underline'
                                >
                                    <BsTrash />
                                    {t("kajian.remove_bookmark") || "Hapus"}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
}
