"use client";

import { lessonsApi } from "@/lib/api";
import { useLocale } from "@/context/Locale";
import { pushRecentBelajar } from "@/lib/recent";
import { useLayoutMode } from "@/lib/useLayoutMode";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
    BsBook,
    BsCheckCircle,
    BsChevronLeft,
    BsChevronRight,
    BsClock,
    BsPlayFill,
} from "react-icons/bs";

const STORAGE_KEY = "tholabul_lesson_progress_v2";

const getStorage = () => {
    if (typeof window === "undefined") return {};
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch {
        return {};
    }
};

const setStorage = (data) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

const stepNumber = (step, index) => step?.step_order || index + 1;
const stepKey = (slug, number) => `${slug}_${number}`;

const kindClass = (kind) => {
    if (kind === "rukun") return "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300";
    if (kind === "sunnah") return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
    if (kind === "praktik") return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
};

export default function LessonsContent({ basePath = "/dashboard" }) {
    const { t } = useLocale();
    const { isWide } = useLayoutMode();
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [activeModuleId, setActiveModuleId] = useState(null);
    const [activeStepIdx, setActiveStepIdx] = useState(0);
    const [completed, setCompleted] = useState({});
    const [finishedSlug, setFinishedSlug] = useState(null);

    const root = basePath === "/dashboard" ? "/dashboard" : "";
    const backHref = `${root}/belajar`;
    const lessonsHref = `${root}/belajar/lessons`;

    useEffect(() => {
        let cancelled = false;
        setCompleted(getStorage());
        lessonsApi
            .list()
            .then((res) => (res.ok ? res.json() : Promise.reject(res)))
            .then((data) => {
                if (cancelled) return;
                const items = data?.data?.items || data?.items || [];
                setModules(Array.isArray(items) ? items : []);
                setActiveModuleId(items?.[0]?.slug || null);
            })
            .catch(() => {
                if (!cancelled) setError(true);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (modules.length === 0 || typeof window === "undefined") return;
        if (!localStorage.getItem("auth_token")) return;
        lessonsApi
            .myProgress()
            .then((res) => (res.ok ? res.json() : Promise.reject(res)))
            .then((data) => {
                const items = data?.data?.items || data?.items || [];
                const remote = {};
                items.forEach((p) => {
                    const m = modules.find((mod) => mod.id === p.module_id);
                    if (m && p.done) remote[stepKey(m.slug, p.step)] = true;
                });
                setCompleted((prev) => {
                    const next = { ...prev, ...remote };
                    setStorage(next);
                    return next;
                });
            })
            .catch(() => {});
    }, [modules]);

    const activeModule = modules.find((m) => m.slug === activeModuleId);
    const steps = useMemo(() => activeModule?.steps || [], [activeModule]);
    const step = steps[activeStepIdx];
    const totalSteps = steps.length;

    const moduleDone = useMemo(
        () =>
            steps.filter((item, index) =>
                completed[stepKey(activeModuleId, stepNumber(item, index))],
            ).length,
        [activeModuleId, completed, steps],
    );

    const moduleProgress = totalSteps
        ? Math.round((moduleDone / totalSteps) * 100)
        : 0;

    const markStep = async (done = true) => {
        if (!activeModule || !step) return;
        const number = stepNumber(step, activeStepIdx);
        const key = stepKey(activeModule.slug, number);
        const next = { ...completed, [key]: done };
        setCompleted(next);
        setStorage(next);
        if (done) {
            pushRecentBelajar({
                href: lessonsHref,
                title: activeModule.title,
                meta: `${number}/${totalSteps} langkah`,
            });
        }
        if (typeof window === "undefined" || !localStorage.getItem("auth_token")) return;
        await lessonsApi.saveProgress(activeModule.id, number, done).catch(() => {});
    };

    const goNext = async () => {
        await markStep(true);
        if (activeStepIdx < totalSteps - 1) {
            setActiveStepIdx(activeStepIdx + 1);
            return;
        }
        setFinishedSlug(activeModule.slug);
        pushRecentBelajar({ href: lessonsHref, title: activeModule.title, meta: "Selesai" });
    };

    if (loading) {
        return <div className='p-8 text-center text-gray-500'>{t("belajar.loading_modules")}</div>;
    }

    if (error || !activeModule || !step) {
        return <div className='p-8 text-center text-gray-500'>{t("belajar.lessons_empty")}</div>;
    }

    const currentDone = completed[stepKey(activeModule.slug, stepNumber(step, activeStepIdx))];

    return (
        <div className={isWide ? "px-4 py-6" : "px-4 py-6 max-w-md mx-auto"}>
            <Link href={backHref} className='inline-flex items-center text-sm text-gray-500 hover:text-emerald-600 mb-4'>
                <BsChevronLeft />
                <span className='ml-1'>{t("belajar.back_to_learn")}</span>
            </Link>

            <div className='rounded-3xl bg-gradient-to-br from-emerald-700 to-teal-700 text-white p-5 mb-5 shadow-sm'>
                <p className='text-xs font-bold uppercase tracking-[0.2em] text-emerald-100'>{t("belajar.lessons")}</p>
                <h1 className='text-2xl font-extrabold mt-2'>{activeModule.title}</h1>
                <p className='text-sm text-emerald-50 mt-2'>{activeModule.description}</p>
                <div className='flex flex-wrap gap-2 mt-4 text-xs font-semibold'>
                    {activeModule.category && <span className='rounded-full bg-white/15 px-3 py-1'>{activeModule.category}</span>}
                    {activeModule.level && <span className='rounded-full bg-white/15 px-3 py-1'>{activeModule.level}</span>}
                    {!!activeModule.estimated_minutes && (
                        <span className='inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1'>
                            <BsClock /> {activeModule.estimated_minutes} menit
                        </span>
                    )}
                </div>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-[18rem_1fr] gap-4'>
                <div className='space-y-3'>
                    <div className='bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl p-4'>
                        <div className='flex items-center justify-between mb-2'>
                            <span className='text-xs font-bold text-gray-500 uppercase'>Progress</span>
                            <span className='text-xs font-bold text-emerald-600'>{moduleProgress}%</span>
                        </div>
                        <div className='h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden'>
                            <div className='h-full bg-emerald-600 rounded-full transition-all' style={{ width: `${moduleProgress}%` }} />
                        </div>
                        <p className='mt-2 text-xs text-gray-500'>{moduleDone}/{totalSteps} langkah selesai</p>
                    </div>

                    <div className='space-y-2'>
                        {modules.map((m) => {
                            const done = (m.steps || []).filter((item, index) => completed[stepKey(m.slug, stepNumber(item, index))]).length;
                            const percent = m.steps?.length ? Math.round((done / m.steps.length) * 100) : 0;
                            return (
                                <button
                                    key={m.slug}
                                    onClick={() => {
                                        setActiveModuleId(m.slug);
                                        setActiveStepIdx(0);
                                        setFinishedSlug(null);
                                    }}
                                    className={`w-full text-left p-3 rounded-xl border transition-colors ${
                                        activeModuleId === m.slug
                                            ? "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700"
                                            : "bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 hover:border-emerald-200"
                                    }`}
                                >
                                    <p className='text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2'>
                                        {activeModuleId === m.slug ? <BsPlayFill className='text-emerald-500' /> : <BsBook className='text-gray-400' />}
                                        {m.title}
                                    </p>
                                    <p className='text-xs text-gray-500 mt-1'>{m.level || "Pemula"} · {m.steps?.length || 0} langkah · {percent}%</p>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div>
                    <div className='flex gap-2 overflow-x-auto pb-3 mb-2 scrollbar-none'>
                        {steps.map((item, index) => {
                            const number = stepNumber(item, index);
                            const done = completed[stepKey(activeModule.slug, number)];
                            return (
                                <button
                                    key={number}
                                    onClick={() => setActiveStepIdx(index)}
                                    className={`shrink-0 h-9 w-9 rounded-full text-xs font-bold border ${
                                        activeStepIdx === index
                                            ? "bg-emerald-700 text-white border-emerald-700"
                                            : done
                                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-700"
                                              : "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-500"
                                    }`}
                                >
                                    {done ? "✓" : number}
                                </button>
                            );
                        })}
                    </div>

                    <article className='bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 p-5 shadow-sm space-y-5'>
                        <div className='flex flex-wrap items-start justify-between gap-3'>
                            <div>
                                <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${kindClass(step.kind)}`}>
                                    {step.kind || "teori"}
                                </span>
                                <h2 className='text-xl font-extrabold text-gray-900 dark:text-white mt-3'>{step.title}</h2>
                            </div>
                            {currentDone && <BsCheckCircle className='text-2xl text-emerald-500' />}
                        </div>

                        <p className='text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line'>{step.body}</p>

                        {step.arabic && (
                            <div className='rounded-2xl bg-parchment-50 dark:bg-slate-900 border border-emerald-100 dark:border-slate-700 p-4 text-right'>
                                <p className='text-3xl leading-loose text-gray-950 dark:text-white' dir='rtl' style={{ fontFamily: "Kitab, Amiri, serif" }}>
                                    {step.arabic}
                                </p>
                            </div>
                        )}

                        {step.latin && (
                            <div>
                                <p className='text-xs font-bold text-gray-400 uppercase mb-1'>Latin</p>
                                <p className='text-sm italic text-emerald-700 dark:text-emerald-300 leading-relaxed'>{step.latin}</p>
                            </div>
                        )}

                        {step.translation && (
                            <div>
                                <p className='text-xs font-bold text-gray-400 uppercase mb-1'>Arti</p>
                                <p className='text-sm text-gray-700 dark:text-gray-300 leading-relaxed'>{step.translation}</p>
                            </div>
                        )}

                        {step.dalil && (
                            <div className='rounded-2xl border-l-4 border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3'>
                                <p className='text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase mb-1'>Dalil</p>
                                <p className='text-sm text-gray-700 dark:text-gray-300 leading-relaxed'>{step.dalil}</p>
                            </div>
                        )}

                        {step.tip && (
                            <div className='rounded-2xl bg-amber-50 dark:bg-amber-900/20 px-4 py-3'>
                                <p className='text-xs font-bold text-amber-700 dark:text-amber-300 uppercase mb-1'>Catatan praktik</p>
                                <p className='text-sm text-gray-700 dark:text-gray-300 leading-relaxed'>{step.tip}</p>
                            </div>
                        )}
                    </article>

                    {finishedSlug === activeModule.slug && (
                        <div className='mt-4 rounded-3xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800 p-5'>
                            <p className='text-lg font-extrabold text-emerald-900 dark:text-emerald-100'>Modul selesai</p>
                            <p className='text-sm text-emerald-700 dark:text-emerald-300 mt-1'>Ulangi ringkasan, lalu lanjut ke modul berikutnya agar ilmu makin kuat.</p>
                        </div>
                    )}

                    <div className='flex items-center justify-between mt-4'>
                        <button
                            onClick={() => setActiveStepIdx(Math.max(0, activeStepIdx - 1))}
                            disabled={activeStepIdx === 0}
                            className='px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-700 disabled:opacity-30 flex items-center gap-1'
                        >
                            <BsChevronLeft /> Kembali
                        </button>
                        <button
                            onClick={goNext}
                            className='px-5 py-2.5 bg-emerald-700 text-white text-sm font-medium rounded-lg hover:bg-emerald-800 flex items-center gap-2'
                        >
                            {currentDone && <BsCheckCircle className='text-emerald-200' />}
                            {activeStepIdx === totalSteps - 1 ? "Selesai" : "Tandai & lanjut"}
                            <BsChevronRight />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
