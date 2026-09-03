"use client";

import Section from "@/components/Section";
import { SkeletonInline } from "@/components/skeleton/Skeleton";
import { useLocale } from "@/context/Locale";
import { manasikApi } from "@/lib/api";
import { getLocalizedField } from "@/lib/translation";
import { useLayoutMode } from "@/lib/useLayoutMode";
import { useEffect, useState } from "react";
import { BsChevronDown, BsChevronUp } from "react-icons/bs";
import { MdOutlineDirectionsWalk } from "react-icons/md";
import SourceBadges from "@/components/SourceBadges";

const ManasikPage = () => {
    const { t, lang } = useLocale();
    const { isWide } = useLayoutMode();
    const [activeTab, setActiveTab] = useState("umrah");
    const [openIdx, setOpenIdx] = useState(null);
    const [umrahSteps, setUmrahSteps] = useState([]);
    const [hajiSteps, setHajiSteps] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            manasikApi.byType("umrah").then((r) => r.json()),
            manasikApi.byType("haji").then((r) => r.json()),
        ])
            .then(([umrah, haji]) => {
                setUmrahSteps(Array.isArray(umrah) ? umrah : []);
                setHajiSteps(Array.isArray(haji) ? haji : []);
            })
            .catch(() => {
                setUmrahSteps([]);
                setHajiSteps([]);
            })
            .finally(() => setLoading(false));
    }, []);

    const steps = activeTab === "umrah" ? umrahSteps : hajiSteps;

    const toggle = (i) => setOpenIdx((prev) => (prev === i ? null : i));

    const stepArabicMeaning = (step) => {
        if (lang === "EN") {
            return (
                step.translation?.description_en ||
                step.translation?.description_idn ||
                ""
            );
        }
        return (
            step.translation?.description_idn ||
            step.translation?.description_en ||
            ""
        );
    };

    return (
        <main className='min-h-screen flex flex-col'>
            <Section>
                <div
                    className={
                        isWide
                            ? "w-full px-4"
                            : "container mx-auto px-4 max-w-2xl"
                    }
                >
                    {/* Header */}
                    <div className='flex items-center gap-3 mb-6'>
                        <div className='w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center'>
                            <MdOutlineDirectionsWalk className='text-xl text-emerald-700 dark:text-emerald-400' />
                        </div>
                        <div>
                            <h1 className='text-xl font-bold text-emerald-900 dark:text-white'>
                                {t("manasik.title")}
                            </h1>
                            <p className='text-xs text-gray-500 dark:text-gray-400'>
                                {t("manasik.step_subtitle")}
                            </p>
                        </div>
                    </div>

                    {/* Tab */}
                    <div className='flex gap-2 mb-6'>
                        {[
                            {
                                key: "umrah",
                                label: t("manasik.umrah"),
                                count: umrahSteps.length,
                            },
                            {
                                key: "haji",
                                label: t("manasik.haji"),
                                count: hajiSteps.length,
                            },
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => {
                                    setActiveTab(tab.key);
                                    setOpenIdx(null);
                                }}
                                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                                    activeTab === tab.key
                                        ? "bg-emerald-700 text-white"
                                        : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-slate-600"
                                }`}
                            >
                                {tab.label}
                                {!loading && tab.count > 0 && (
                                    <span className='ml-1.5 text-xs opacity-70'>
                                        ({tab.count} {t("manasik.steps_unit")})
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Legend */}
                    <div className='flex items-center gap-4 mb-5 text-xs text-gray-500 dark:text-gray-400'>
                        <span className='flex items-center gap-1.5'>
                            <span className='inline-block w-2 h-2 rounded-full bg-emerald-600' />
                            {t("manasik.required")}
                        </span>
                        <span className='flex items-center gap-1.5'>
                            <span className='inline-block w-2 h-2 rounded-full bg-gray-300 dark:bg-slate-600' />
                            {t("manasik.sunnah")}
                        </span>
                    </div>

                    {/* Steps */}
                    {loading ? (
                        <SkeletonInline rows={6} />
                    ) : (
                        <div className='space-y-3'>
                            {steps.map((step, i) => {
                                const isOpen = openIdx === i;
                                const title = getLocalizedField(
                                    step,
                                    "title",
                                    lang,
                                );
                                const arabic = step.translation?.ar || "";
                                const latin = step.translation?.latin_idn || "";
                                const arabicMeaning = stepArabicMeaning(step);
                                return (
                                    <div
                                        key={step.id ?? i}
                                        className='bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden'
                                    >
                                        <button
                                            onClick={() => toggle(i)}
                                            className='w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors text-left'
                                        >
                                            <div
                                                className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                                                    step.is_wajib
                                                        ? "bg-emerald-600 text-white"
                                                        : "bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400"
                                                }`}
                                            >
                                                {step.step_order}
                                            </div>
                                            <div className='flex-1 min-w-0'>
                                                <p className='text-sm font-semibold text-gray-900 dark:text-white'>
                                                    {title}
                                                </p>
                                                {!isOpen && arabic && (
                                                    <p
                                                        className='text-xs text-gray-400 truncate'
                                                        style={{
                                                            fontFamily:
                                                                "Amiri, serif",
                                                        }}
                                                    >
                                                        {arabic.slice(0, 40)}
                                                        {arabic.length > 40
                                                            ? "..."
                                                            : ""}
                                                    </p>
                                                )}
                                            </div>
                                            {isOpen ? (
                                                <BsChevronUp className='text-gray-400 flex-shrink-0' />
                                            ) : (
                                                <BsChevronDown className='text-gray-400 flex-shrink-0' />
                                            )}
                                        </button>

                                        {isOpen && (
                                            <div className='border-t border-gray-100 dark:border-slate-700 px-4 py-4 space-y-3'>
                                                {/* Arabic */}
                                                {arabic && (
                                                    <p
                                                        dir='rtl'
                                                        className='text-xl leading-loose text-gray-900 dark:text-white text-right'
                                                        style={{
                                                            fontFamily:
                                                                "Amiri, serif",
                                                        }}
                                                    >
                                                        {arabic}
                                                    </p>
                                                )}

                                                {/* Latin */}
                                                {latin && (
                                                    <p className='text-sm text-emerald-700 dark:text-emerald-400 italic'>
                                                        {latin}
                                                    </p>
                                                )}

                                                {/* Arabic meaning */}
                                                {arabicMeaning && (
                                                    <p className='text-sm text-gray-600 dark:text-gray-300 border-l-2 border-emerald-200 dark:border-emerald-800 pl-3'>
                                                        {arabicMeaning}
                                                    </p>
                                                )}

                                                {/* Step description */}
                                                {step.description && (
                                                    <div className='bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3'>
                                                        <p className='text-sm text-gray-700 dark:text-gray-300 leading-relaxed'>
                                                            {step.description}
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Notes */}
                                                {step.notes && (
                                                    <div className='bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2'>
                                                        <p className='text-xs text-amber-700 dark:text-amber-400'>
                                                            📝 {step.notes}
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Source */}
                                                {step.source && (
                                                    <SourceBadges
                                                        source={step.source}
                                                    />
                                                )}

                                                {/* Badge */}
                                                <div>
                                                    <span
                                                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                                                            step.is_wajib
                                                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                                                : "bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-400"
                                                        }`}
                                                    >
                                                        {step.is_wajib
                                                            ? t(
                                                                  "manasik.required",
                                                              )
                                                            : t(
                                                                  "manasik.sunnah",
                                                              )}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div className='mt-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/40 rounded-xl px-4 py-3'>
                        <p className='text-xs text-amber-700 dark:text-amber-400'>
                            {t("manasik.general_note")}
                        </p>
                    </div>
                </div>
            </Section>
        </main>
    );
};

export default ManasikPage;
