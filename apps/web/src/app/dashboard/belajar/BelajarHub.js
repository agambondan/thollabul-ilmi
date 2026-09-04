"use client";

import { lessonsApi } from "@/lib/api";
import { useLocale } from "@/context/Locale";
import { useLayoutMode } from "@/lib/useLayoutMode";
import { getRecentBelajar, pushRecentBelajar } from "@/lib/recent";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
    BsBook,
    BsCheckCircle,
    BsPlayFill,
    BsSearch,
    BsClock,
    BsBarChart,
} from "react-icons/bs";
import { FaBrain } from "react-icons/fa";
import {
    MdMenuBook,
    MdOutlinePlayLesson,
    MdTimeline,
    MdOutlineAutoStories,
} from "react-icons/md";

const PROGRESS_KEY = "tholabul_lesson_progress_v2";

const readProgress = () => {
    if (typeof window === "undefined") return {};
    try {
        return JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
    } catch {
        return {};
    }
};

const TRACKS = [
    {
        key: "dasar",
        titleKey: "belajar.track.dasar",
        descKey: "belajar.track.dasar_d",
        accent: "from-emerald-700 to-teal-700",
        ids: ["wudhu", "sholat", "adzan-iqomah", "puasa", "zakat", "rukun-iman"],
    },
    {
        key: "quran",
        titleKey: "belajar.track.quran",
        descKey: "belajar.track.quran_d",
        accent: "from-sky-700 to-indigo-700",
        ids: ["tajwid", "kamus", "kajian"],
    },
    {
        key: "sejarah",
        titleKey: "belajar.track.sejarah",
        descKey: "belajar.track.sejarah_d",
        accent: "from-rose-700 to-amber-700",
        ids: ["siroh", "sejarah"],
    },
    {
        key: "adab",
        titleKey: "belajar.track.adab",
        descKey: "belajar.track.adab_d",
        accent: "from-amber-600 to-emerald-700",
        ids: ["adab-talab-ilmu"],
    },
];

const TOOLS = [
    {
        key: "library",
        titleKey: "belajar.mod.library",
        descKey: "belajar.mod.library_d",
        href: (root) => `${root}/library`,
        icon: <BsBook className='text-xl text-emerald-500' />,
    },
    {
        key: "quiz",
        titleKey: "belajar.mod.quiz",
        descKey: "belajar.mod.quiz_d",
        href: (root) => `${root}/quiz`,
        icon: <FaBrain className='text-xl text-purple-500' />,
    },
    {
        key: "kamus",
        titleKey: "belajar.mod.kamus",
        descKey: "belajar.mod.kamus_d",
        href: (root) => `${root}/kamus`,
        icon: <BsBook className='text-xl text-teal-500' />,
    },
];

const ICON_BY_SLUG = {
    wudhu: <BsPlayFill className='text-xl text-emerald-600' />,
    sholat: <BsPlayFill className='text-xl text-emerald-600' />,
    "adzan-iqomah": <MdOutlinePlayLesson className='text-xl text-blue-500' />,
    puasa: <MdMenuBook className='text-xl text-amber-500' />,
    zakat: <MdMenuBook className='text-xl text-amber-500' />,
    tajwid: <BsBook className='text-xl text-sky-500' />,
    "rukun-iman": <MdMenuBook className='text-xl text-rose-500' />,
    "adab-talab-ilmu": <MdOutlineAutoStories className='text-xl text-amber-500' />,
};

const stepNumber = (step, index) => step?.step_order || index + 1;

export default function BelajarHub({ basePath = "/dashboard" }) {
    const { t } = useLocale();
    const { isWide } = useLayoutMode();
    const [recent, setRecent] = useState([]);
    const [search, setSearch] = useState("");
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState({});
    const [activeTrack, setActiveTrack] = useState("semua");

    const root = basePath === "/dashboard" ? "/dashboard" : "";
    const lessonsHref = `${root}/belajar/lessons`;

    useEffect(() => {
        setRecent(getRecentBelajar());
        setProgress(readProgress());
        let cancelled = false;
        lessonsApi
            .list()
            .then((res) => (res.ok ? res.json() : Promise.reject(res)))
            .then((data) => {
                if (cancelled) return;
                const items = data?.data?.items || data?.items || [];
                setModules(Array.isArray(items) ? items : []);
            })
            .catch(() => {
                if (!cancelled) setModules([]);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (typeof window === "undefined" || !localStorage.getItem("auth_token")) return;
        lessonsApi
            .myProgress()
            .then((res) => (res.ok ? res.json() : Promise.reject(res)))
            .then((data) => {
                const items = data?.data?.items || data?.items || [];
                const remote = {};
                items.forEach((p) => {
                    const m = modules.find((mod) => mod.id === p.module_id);
                    if (m && p.done) remote[`${m.slug}_${p.step}`] = true;
                });
                if (!Object.keys(remote).length) return;
                setProgress((prev) => ({ ...prev, ...remote }));
            })
            .catch(() => {});
    }, [modules]);

    const moduleDoneCount = (mod) =>
        (mod?.steps || []).filter((item, index) => progress[`${mod.slug}_${stepNumber(item, index)}`]).length;

    const totalStepsAll = modules.reduce((acc, mod) => acc + (mod?.steps?.length || 0), 0);
    const totalDoneAll = modules.reduce((acc, mod) => acc + moduleDoneCount(mod), 0);
    const overallProgress = totalStepsAll ? Math.round((totalDoneAll / totalStepsAll) * 100) : 0;

    const moduleById = useMemo(() => {
        const map = new Map();
        modules.forEach((mod) => map.set(mod.slug, mod));
        return map;
    }, [modules]);

    const trackHas = (track) => track.ids.map((slug) => moduleById.get(slug)).filter(Boolean);
    const trackProgress = (track) => {
        const mods = trackHas(track);
        if (!mods.length) return 0;
        const total = mods.reduce((acc, mod) => acc + (mod.steps?.length || 0), 0);
        const done = mods.reduce((acc, mod) => acc + moduleDoneCount(mod), 0);
        return total ? Math.round((done / total) * 100) : 0;
    };

    const handleStartModule = (mod) => {
        if (!mod) return;
        pushRecentBelajar({
            href: lessonsHref,
            title: mod.title,
            meta: `Level ${mod.level || t("belajar.level.pemula")}`,
        });
    };

    const filteredTracks = activeTrack === "semua" ? TRACKS : TRACKS.filter((tr) => tr.key === activeTrack);
    const lowerSearch = search.trim().toLowerCase();

    return (
        <div className={isWide ? "px-4 py-6" : "px-4 py-6 max-w-md mx-auto"}>
            <section className={`rounded-3xl p-6 text-white shadow-sm bg-gradient-to-br ${isWide ? "from-emerald-700 via-teal-700 to-sky-700" : "from-emerald-700 to-teal-700"}`}>
                <p className='text-xs font-bold uppercase tracking-[0.25em] text-emerald-100'>{t("belajar.subtitle")}</p>
                <h1 className='text-2xl md:text-3xl font-extrabold mt-2'>{t("belajar.title")}</h1>
                <p className='text-sm text-emerald-50 mt-2 max-w-xl'>{t("belajar.desc")}</p>

                <div className='mt-5 grid grid-cols-3 gap-3 text-center'>
                    <div className='rounded-2xl bg-white/15 px-3 py-3'>
                        <p className='text-2xl font-extrabold'>{modules.length}</p>
                        <p className='text-[10px] uppercase tracking-wider text-emerald-100'>{t("belajar.stat.modules")}</p>
                    </div>
                    <div className='rounded-2xl bg-white/15 px-3 py-3'>
                        <p className='text-2xl font-extrabold'>{totalStepsAll}</p>
                        <p className='text-[10px] uppercase tracking-wider text-emerald-100'>{t("belajar.stat.steps")}</p>
                    </div>
                    <div className='rounded-2xl bg-white/15 px-3 py-3'>
                        <p className='text-2xl font-extrabold'>{overallProgress}%</p>
                        <p className='text-[10px] uppercase tracking-wider text-emerald-100'>{t("belajar.stat.progress")}</p>
                    </div>
                </div>

                <div className='mt-5 flex flex-wrap gap-2'>
                    <Link href={lessonsHref} className='inline-flex items-center gap-2 rounded-full bg-white text-emerald-800 dark:text-emerald-300 text-sm font-bold px-4 py-2 shadow hover:bg-emerald-50'>
                        <BsPlayFill /> {t("belajar.lessons_start")}
                    </Link>
                    <Link href={`${root}/quiz`} className='inline-flex items-center gap-2 rounded-full bg-white/15 text-white text-sm font-semibold px-4 py-2 hover:bg-white/25'>
                        <FaBrain /> {t("belajar.mod.quiz")}
                    </Link>
                </div>
            </section>

            <div className='relative mt-5 mb-4'>
                <BsSearch className='absolute left-3 top-3 text-gray-400' />
                <input
                    type='text'
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t("belajar.search_placeholder")}
                    className='w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500'
                />
            </div>

            <div className='flex gap-2 overflow-x-auto pb-2 scrollbar-none'>
                <FilterChip label={t("belajar.filter.all")} active={activeTrack === "semua"} onClick={() => setActiveTrack("semua")} />
                {TRACKS.map((tr) => (
                    <FilterChip
                        key={tr.key}
                        label={t(tr.titleKey)}
                        active={activeTrack === tr.key}
                        onClick={() => setActiveTrack(tr.key)}
                    />
                ))}
            </div>

            {recent.length > 0 && !search && (
                <div className='mt-5'>
                    <h2 className='text-xs font-bold text-gray-500 dark:text-gray-300 dark:text-gray-400 uppercase tracking-wider mb-3'>{t("belajar.recent")}</h2>
                    <div className='flex gap-3 overflow-x-auto pb-2 scrollbar-none'>
                        {recent.map((item, idx) => (
                            <Link
                                key={idx}
                                href={item.href}
                                className='shrink-0 w-52 p-3 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl hover:shadow-sm'
                            >
                                <p className='text-xs font-bold text-gray-900 dark:text-gray-100 dark:text-white truncate'>{item.title}</p>
                                <p className='text-[10px] text-gray-400 mt-1 truncate'>{item.meta || t("belajar.continue")}</p>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {!loading && modules.length > 0 && (
                <div className='mt-6 space-y-5'>
                    {filteredTracks.map((track) => {
                        const trackMods = trackHas(track);
                        if (!trackMods.length) return null;
                        const percent = trackProgress(track);
                        return (
                            <section key={track.key}>
                                <div className='flex items-end justify-between mb-3'>
                                    <div>
                                        <p className='text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600'>{t("belajar.track.label", { name: track.key })}</p>
                                        <h3 className='text-lg font-extrabold text-gray-900 dark:text-gray-100 dark:text-white'>{t(track.titleKey)}</h3>
                                        <p className='text-xs text-gray-500 dark:text-gray-300 dark:text-gray-400 mt-1'>{t(track.descKey)}</p>
                                    </div>
                                    <div className='text-right'>
                                        <p className='text-xs font-bold text-emerald-700 dark:text-emerald-400 dark:text-emerald-300'>{percent}%</p>
                                        <p className='text-[10px] text-gray-400'>{t("belajar.track.done", { count: trackMods.filter((m) => moduleDoneCount(m) === (m.steps?.length || 0)).length, total: trackMods.length })}</p>
                                    </div>
                                </div>
                                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                                    {trackMods
                                        .filter((mod) => {
                                            if (!lowerSearch) return true;
                                            return (
                                                mod.title.toLowerCase().includes(lowerSearch) ||
                                                (mod.description || "").toLowerCase().includes(lowerSearch) ||
                                                (mod.category || "").toLowerCase().includes(lowerSearch)
                                            );
                                        })
                                        .map((mod) => {
                                            const done = moduleDoneCount(mod);
                                            const total = mod.steps?.length || 0;
                                            const percent = total ? Math.round((done / total) * 100) : 0;
                                            return (
                                                <Link
                                                    key={mod.slug}
                                                    href={lessonsHref}
                                                    onClick={() => handleStartModule(mod)}
                                                    className='p-4 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl flex items-start gap-3 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors group'
                                                >
                                                    <div className='p-2.5 bg-gray-50 dark:bg-slate-700/50 rounded-xl shrink-0 group-hover:scale-105 transition-transform'>
                                                        {ICON_BY_SLUG[mod.slug] || <BsBook className='text-xl text-emerald-500' />}
                                                    </div>
                                                    <div className='flex-1 min-w-0'>
                                                        <p className='text-sm font-bold text-gray-900 dark:text-gray-100 dark:text-white group-hover:text-emerald-600 transition-colors'>{mod.title}</p>
                                                        <p className='text-xs text-gray-500 dark:text-gray-300 dark:text-gray-400 mt-1 line-clamp-2'>{mod.description}</p>
                                                        <div className='flex flex-wrap items-center gap-2 mt-2 text-[10px] font-semibold text-gray-500 dark:text-gray-300'>
                                                            {mod.level && <span className='rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 dark:text-emerald-300 px-2 py-0.5'>{mod.level}</span>}
                                                            {!!mod.estimated_minutes && (
                                                                <span className='inline-flex items-center gap-1'>
                                                                    <BsClock /> {mod.estimated_minutes} mnt
                                                                </span>
                                                            )}
                                                            <span className='inline-flex items-center gap-1'>
                                                                <BsBarChart /> {done}/{total} langkah
                                                            </span>
                                                        </div>
                                                        <div className='mt-2 h-1.5 rounded-full bg-gray-100 dark:bg-slate-700 overflow-hidden'>
                                                            <div className='h-full bg-emerald-600 rounded-full' style={{ width: `${percent}%` }} />
                                                        </div>
                                                    </div>
                                                    {percent === 100 && <BsCheckCircle className='text-emerald-500 text-lg shrink-0' />}
                                                </Link>
                                            );
                                        })}
                                </div>
                            </section>
                        );
                    })}
                </div>
            )}

            {loading && (
                <div className='mt-6 text-center text-sm text-gray-400'>{t("belajar.loading_modules")}</div>
            )}

            <section className='mt-8'>
                <h3 className='text-xs font-bold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-300 dark:text-gray-400 mb-3'>{t("belajar.references")}</h3>
                <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
                    {TOOLS.map((tool) => (
                        <Link
                            key={tool.key}
                            href={tool.href(root)}
                            className='p-4 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl flex items-start gap-3 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors group'
                        >
                            <div className='p-2.5 bg-gray-50 dark:bg-slate-700/50 rounded-xl shrink-0 group-hover:scale-105 transition-transform'>{tool.icon}</div>
                            <div>
                                <p className='text-sm font-bold text-gray-900 dark:text-gray-100 dark:text-white group-hover:text-emerald-600 transition-colors'>{t(tool.titleKey)}</p>
                                <p className='text-xs text-gray-500 dark:text-gray-300 dark:text-gray-400 mt-1 line-clamp-2'>{t(tool.descKey)}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>
        </div>
    );
}

function FilterChip({ label, active, onClick }) {
    return (
        <button
            type='button'
            onClick={onClick}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                active
                    ? "bg-emerald-700 text-white shadow"
                    : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-emerald-100 dark:hover:bg-slate-600"
            }`}
        >
            {label}
        </button>
    );
}


