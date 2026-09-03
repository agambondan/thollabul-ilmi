"use client";

import Section from "@/components/Section";
import { useLocale } from "@/context/Locale";
import { useLayoutMode } from "@/lib/useLayoutMode";
import { getLocalizedField } from "@/lib/translation";
import { useEffect, useState } from "react";
import { BsChevronDown, BsChevronUp } from "react-icons/bs";
import { GiOpenBook } from "react-icons/gi";

const WIRID_OCCASIONS = [
    {
        occasion: "jumat",
        label: "Hari Jumat",
        label_en: "Friday",
        emoji: "🕌",
        description: "Amalan sunnah dan bacaan khusus hari Jumat",
        description_en: "Sunnah deeds and special recitations for Friday",
    },
    {
        occasion: "arafah",
        label: "Hari Arafah (9 Dzulhijjah)",
        label_en: "Day of Arafah (9 Dhul Hijjah)",
        emoji: "🏔️",
        description:
            "Bacaan utama pada hari yang mulia — penghapus dosa 2 tahun",
        description_en:
            "Main recitations for the noble day that expiates two years of sins",
    },
    {
        occasion: "lailatul_qadar",
        label: "Lailatul Qadar",
        label_en: "Laylatul Qadr",
        emoji: "✨",
        description: "Malam lebih baik dari seribu bulan — perbanyak doa ini",
        description_en:
            "The night better than a thousand months. Increase this dua",
    },
    {
        occasion: "ramadan",
        label: "Ramadan",
        label_en: "Ramadan",
        emoji: "🌙",
        description: "Doa-doa khusus bulan Ramadan",
        description_en: "Special duas for Ramadan",
    },
    {
        occasion: "iedul_fitri",
        label: "Idul Fitri (1 Syawal)",
        label_en: "Eid al-Fitr (1 Shawwal)",
        emoji: "🎉",
        description: "Bacaan dan ucapan saat Idul Fitri",
        description_en: "Recitations and greetings for Eid al-Fitr",
    },
    {
        occasion: "iedul_adha",
        label: "Idul Adha (10 Dzulhijjah)",
        label_en: "Eid al-Adha (10 Dhul Hijjah)",
        emoji: "🐑",
        description: "Bacaan saat Idul Adha dan penyembelihan kurban",
        description_en: "Recitations for Eid al-Adha and sacrifice",
    },
];

const normalizeItem = (item) => ({
    ...item,
    arabic: item.translation?.ar ?? "",
    latin: item.translation?.latin_idn ?? "",
    count: item.count ?? "",
});

export const WiridContent = () => {
    const { t, lang } = useLocale();
    const { isWide } = useLayoutMode();
    const [activeOccasion, setActiveOccasion] = useState(
        WIRID_OCCASIONS[0].occasion,
    );
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);
    const [open, setOpen] = useState(new Set());
    const [showLatin, setShowLatin] = useState(true);
    const [showMeaning, setShowMeaning] = useState(true);

    const current =
        WIRID_OCCASIONS.find((w) => w.occasion === activeOccasion) ??
        WIRID_OCCASIONS[0];

    useEffect(() => {
        let isActive = true;
        setIsLoading(true);
        setIsError(false);

        fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/v1/wirid/occasion/${activeOccasion}`,
        )
            .then((res) => res.json())
            .then((data) => {
                if (!isActive) return;
                const raw = data?.items ?? data ?? [];
                setItems(raw.map(normalizeItem));
            })
            .catch(() => {
                if (isActive) setIsError(true);
            })
            .finally(() => {
                if (isActive) setIsLoading(false);
            });

        return () => {
            isActive = false;
        };
    }, [activeOccasion]);

    const toggle = (idx) => {
        setOpen((prev) => {
            const next = new Set(prev);
            next.has(idx) ? next.delete(idx) : next.add(idx);
            return next;
        });
    };

    const handleOccasion = (occ) => {
        setActiveOccasion(occ);
        setOpen(new Set());
    };

    return (
        <div
            className={
                isWide ? "w-full px-4" : "container mx-auto px-4 max-w-2xl"
            }
        >
            {/* Header */}
            <div className='flex items-center gap-3 mb-6'>
                <div className='w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center'>
                    <GiOpenBook className='text-xl text-emerald-700 dark:text-emerald-400' />
                </div>
                <div>
                    <h1 className='text-xl font-bold text-emerald-900 dark:text-white'>
                        {t("wirid.title")}
                    </h1>
                    <p className='text-xs text-gray-500 dark:text-gray-400'>
                        {t("wirid.subtitle")}
                    </p>
                </div>
            </div>

            {/* Display controls */}
            <div className='flex gap-2 mb-4'>
                <button
                    onClick={() => setShowLatin((v) => !v)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${showLatin ? "bg-emerald-700 text-white" : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300"}`}
                >
                    Latin
                </button>
                <button
                    onClick={() => setShowMeaning((v) => !v)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${showMeaning ? "bg-emerald-700 text-white" : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300"}`}
                >
                    {t("common.translation")}
                </button>
            </div>

            {/* Occasion tabs */}
            <div className='flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide'>
                {WIRID_OCCASIONS.map((w) => (
                    <button
                        key={w.occasion}
                        onClick={() => handleOccasion(w.occasion)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                            activeOccasion === w.occasion
                                ? "bg-emerald-700 text-white"
                                : "bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:border-emerald-300"
                        }`}
                    >
                        {w.emoji} {getLocalizedField(w, "label", lang)}
                    </button>
                ))}
            </div>

            {/* Description */}
            <div className='bg-emerald-50 dark:bg-emerald-900/20 rounded-xl px-4 py-3 mb-5'>
                <p className='text-sm font-semibold text-emerald-800 dark:text-emerald-300'>
                    {current.emoji} {getLocalizedField(current, "label", lang)}
                </p>
                <p className='text-xs text-emerald-600 dark:text-emerald-500 mt-0.5'>
                    {getLocalizedField(current, "description", lang)}
                </p>
            </div>

            {/* Items */}
            {isLoading ? (
                <div className='space-y-2'>
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className='bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 px-4 py-3 animate-pulse'
                        >
                            <div className='h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4' />
                        </div>
                    ))}
                </div>
            ) : isError ? (
                <div className='flex flex-col items-center justify-center min-h-[30vh] text-center'>
                    <p className='text-3xl mb-2'>⚠️</p>
                    <p className='text-sm font-semibold text-emerald-900 dark:text-white'>
                        {t("wirid.load_error")}
                    </p>
                    <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                        {t("wirid.backend_hint")}
                    </p>
                </div>
            ) : items.length === 0 ? (
                <div className='flex flex-col items-center justify-center min-h-[30vh] text-center bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-8'>
                    <p className='text-4xl mb-3'>📿</p>
                    <p className='text-sm font-semibold text-gray-700 dark:text-gray-300'>
                        {t("wirid.empty") ?? "Belum ada bacaan wirid untuk kategori ini."}
                    </p>
                </div>
            ) : (
                <div className='space-y-2'>
                    {items.map((item, idx) => (
                        <div
                            key={idx}
                            className='bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden'
                        >
                            <button
                                onClick={() => toggle(idx)}
                                className='w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors text-left'
                            >
                                <span className='w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center justify-center flex-shrink-0'>
                                    {idx + 1}
                                </span>
                                <div className='flex-1'>
                                    <p className='text-sm font-semibold text-gray-900 dark:text-white'>
                                        {getLocalizedField(
                                            item,
                                            "title",
                                            lang,
                                            ["name"],
                                        )}
                                    </p>
                                    <p className='text-xs text-gray-400'>
                                        {item.count}
                                    </p>
                                </div>
                                {open.has(idx) ? (
                                    <BsChevronUp className='text-gray-400 flex-shrink-0' />
                                ) : (
                                    <BsChevronDown className='text-gray-400 flex-shrink-0' />
                                )}
                            </button>

                            {open.has(idx) && (
                                <div className='border-t border-gray-100 dark:border-slate-700 px-4 py-4 space-y-3'>
                                    <p
                                        dir='rtl'
                                        className='text-xl leading-loose font-arabic text-gray-900 dark:text-white text-right'
                                    >
                                        {item.arabic}
                                    </p>
                                    {showLatin && item.latin && (
                                        <p className='text-sm text-emerald-700 dark:text-emerald-400 italic'>
                                            {item.latin}
                                        </p>
                                    )}
                                    {showMeaning &&
                                        getLocalizedField(
                                            item,
                                            "description",
                                            lang,
                                            ["meaning"],
                                        ) && (
                                            <p className='text-sm text-gray-600 dark:text-gray-300'>
                                                {getLocalizedField(
                                                    item,
                                                    "description",
                                                    lang,
                                                    ["meaning"],
                                                )}
                                            </p>
                                        )}
                                    {getLocalizedField(item, "fadhilah", lang, [
                                        "source",
                                    ]) && (
                                        <div className='bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2'>
                                            <p className='text-xs text-amber-700 dark:text-amber-400'>
                                                📖{" "}
                                                {getLocalizedField(
                                                    item,
                                                    "fadhilah",
                                                    lang,
                                                    ["source"],
                                                )}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const WiridPage = () => (
    <main className='min-h-screen flex flex-col'>
        <Section>
            <WiridContent />
        </Section>
    </main>
);

export default WiridPage;
