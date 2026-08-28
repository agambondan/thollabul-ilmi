"use client";

import ContentWidth from "@/components/layout/ContentWidth";
import SourceBadges from "@/components/SourceBadges";
import { useLocale } from "@/context/Locale";
import { getLocalizedField } from "@/lib/translation";
import { useEffect, useState } from "react";
import { BsChevronDown } from "react-icons/bs";
import { MdOutlineMenuBook } from "react-icons/md";

const PRAYERS = [
    {
        name: "Sholat Subuh",
        name_en: "Fajr Prayer",
        rakat: 2,
        arabic: "صَلَاةُ الْفَجْرِ",
        time: "Fajar shadiq → terbit matahari",
        time_en: "True dawn -> sunrise",
        color: "indigo",
        niat: {
            arabic: "أُصَلِّي فَرْضَ الصُّبْحِ رَكْعَتَيْنِ مُسْتَقْبِلَ الْقِبْلَةِ أَدَاءً لِلهِ تَعَالَى",
            latin: "Ushalli fardhas-shubhi rak'ataini mustaqbilal-qiblati adaa'an lillahi ta'ala",
            terjemah:
                "Aku niat sholat fardhu Subuh 2 rakaat menghadap kiblat karena Allah Ta'ala",
            terjemah_en:
                "I intend to pray the obligatory Fajr prayer, two rakaat, facing the qiblah, for Allah Most High.",
        },
    },
    {
        name: "Sholat Dzuhur",
        name_en: "Dhuhr Prayer",
        rakat: 4,
        arabic: "صَلَاةُ الظُّهْرِ",
        time: "Matahari tergelincir → bayangan sama panjang benda",
        time_en: "After the sun declines -> when shadow equals object length",
        color: "yellow",
        niat: {
            arabic: "أُصَلِّي فَرْضَ الظُّهْرِ أَرْبَعَ رَكَعَاتٍ مُسْتَقْبِلَ الْقِبْلَةِ أَدَاءً لِلهِ تَعَالَى",
            latin: "Ushalli fardhadh-dhuhri arba'a raka'aatin mustaqbilal-qiblati adaa'an lillahi ta'ala",
            terjemah:
                "Aku niat sholat fardhu Dzuhur 4 rakaat menghadap kiblat karena Allah Ta'ala",
            terjemah_en:
                "I intend to pray the obligatory Dhuhr prayer, four rakaat, facing the qiblah, for Allah Most High.",
        },
    },
    {
        name: "Sholat Ashar",
        name_en: "Asr Prayer",
        rakat: 4,
        arabic: "صَلَاةُ الْعَصْرِ",
        time: "Bayangan lebih panjang → terbenam matahari",
        time_en: "When shadows lengthen -> sunset",
        color: "orange",
        niat: {
            arabic: "أُصَلِّي فَرْضَ الْعَصْرِ أَرْبَعَ رَكَعَاتٍ مُسْتَقْبِلَ الْقِبْلَةِ أَدَاءً لِلهِ تَعَالَى",
            latin: "Ushalli fardhal-'ashri arba'a raka'aatin mustaqbilal-qiblati adaa'an lillahi ta'ala",
            terjemah:
                "Aku niat sholat fardhu Ashar 4 rakaat menghadap kiblat karena Allah Ta'ala",
            terjemah_en:
                "I intend to pray the obligatory Asr prayer, four rakaat, facing the qiblah, for Allah Most High.",
        },
    },
    {
        name: "Sholat Maghrib",
        name_en: "Maghrib Prayer",
        rakat: 3,
        arabic: "صَلَاةُ الْمَغْرِبِ",
        time: "Terbenam matahari → hilang mega merah",
        time_en: "Sunset -> disappearance of the red twilight",
        color: "red",
        niat: {
            arabic: "أُصَلِّي فَرْضَ الْمَغْرِبِ ثَلَاثَ رَكَعَاتٍ مُسْتَقْبِلَ الْقِبْلَةِ أَدَاءً لِلهِ تَعَالَى",
            latin: "Ushalli fardhal-maghribi tsalaatsa raka'aatin mustaqbilal-qiblati adaa'an lillahi ta'ala",
            terjemah:
                "Aku niat sholat fardhu Maghrib 3 rakaat menghadap kiblat karena Allah Ta'ala",
            terjemah_en:
                "I intend to pray the obligatory Maghrib prayer, three rakaat, facing the qiblah, for Allah Most High.",
        },
    },
    {
        name: "Sholat Isya",
        name_en: "Isha Prayer",
        rakat: 4,
        arabic: "صَلَاةُ الْعِشَاءِ",
        time: "Hilang mega merah → sebelum fajar",
        time_en: "After twilight disappears -> before dawn",
        color: "purple",
        niat: {
            arabic: "أُصَلِّي فَرْضَ الْعِشَاءِ أَرْبَعَ رَكَعَاتٍ مُسْتَقْبِلَ الْقِبْلَةِ أَدَاءً لِلهِ تَعَالَى",
            latin: "Ushalli fardhal-'isyaa'i arba'a raka'aatin mustaqbilal-qiblati adaa'an lillahi ta'ala",
            terjemah:
                "Aku niat sholat fardhu Isya 4 rakaat menghadap kiblat karena Allah Ta'ala",
            terjemah_en:
                "I intend to pray the obligatory Isha prayer, four rakaat, facing the qiblah, for Allah Most High.",
        },
    },
];

const COLOR_BADGE = {
    indigo: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300",
    yellow: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
    orange: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
    red: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
    purple: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
};

const normalizeStep = (s) => ({
    ...s,
    step: s.title ?? s.step ?? "",
    arabic: s.arabic ?? "",
    latin: s.transliteration ?? "",
    terjemah: s.translation ?? "",
    note: s.notes ?? s.description ?? "",
    source: s.source ?? "",
});

export function PanduanSholatContent() {
    const { t, lang } = useLocale();
    const [openPrayer, setOpenPrayer] = useState(0);
    const [openStep, setOpenStep] = useState(null);
    const [apiSteps, setApiSteps] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/panduan-sholat`)
            .then((r) => r.json())
            .then((data) => {
                const items = (data?.items ?? data ?? [])
                    .filter((s) => s.step !== 1)
                    .map(normalizeStep);
                setApiSteps(items);
            })
            .catch((e) => console.error(e))
            .finally(() => setIsLoading(false));
    }, []);

    return (
        <ContentWidth compact='max-w-2xl' className='flex-1 px-4 pt-6 pb-8'>
            {/* Header */}
            <div className='mb-8 text-center'>
                <div className='inline-flex items-center justify-center w-16 h-16 bg-emerald-100 dark:bg-emerald-900/40 rounded-2xl mb-4'>
                    <MdOutlineMenuBook className='text-3xl text-emerald-600 dark:text-emerald-400' />
                </div>
                <h1 className='text-3xl font-extrabold text-emerald-900 dark:text-emerald-100 mb-2'>
                    {t("link.prayer_guide")}
                </h1>
                <p className='text-sm text-gray-500 dark:text-gray-400'>
                    {t("prayer_guide.subtitle")}
                </p>
            </div>

            {/* Prayer selector */}
            <div className='flex gap-2 overflow-x-auto pb-2 mb-6 no-scrollbar'>
                {PRAYERS.map((p, i) => (
                    <button
                        key={p.name}
                        onClick={() => {
                            setOpenPrayer(i);
                            setOpenStep(null);
                        }}
                        className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                            openPrayer === i
                                ? "bg-emerald-600 text-white border-emerald-600 shadow"
                                : "bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-600 hover:border-emerald-400"
                        }`}
                    >
                        {getLocalizedField(p, "name", lang)}
                    </button>
                ))}
            </div>

            {/* Prayer info card + steps */}
            {(() => {
                const p = PRAYERS[openPrayer];
                const niatStep = {
                    step: t("prayer_guide.intention"),
                    arabic: p.niat.arabic,
                    latin: p.niat.latin,
                    terjemah: getLocalizedField(p.niat, "terjemah", lang),
                    note: "",
                    source: "",
                };
                const steps = [niatStep, ...apiSteps];

                return (
                    <div className='space-y-3'>
                        <div className='bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-slate-700 mb-4'>
                            <div className='flex items-start justify-between gap-4'>
                                <div>
                                    <h2 className='text-xl font-extrabold text-gray-900 dark:text-white mb-1'>
                                        {getLocalizedField(p, "name", lang)}
                                    </h2>
                                    <p
                                        className='text-lg text-gray-600 dark:text-gray-400 mb-2'
                                        style={{ fontFamily: "Amiri, serif" }}
                                    >
                                        {p.arabic}
                                    </p>
                                    <p className='text-sm text-gray-500 dark:text-gray-400'>
                                        {getLocalizedField(p, "time", lang)}
                                    </p>
                                </div>
                                <span
                                    className={`text-sm font-bold px-3 py-1 rounded-full whitespace-nowrap ${COLOR_BADGE[p.color]}`}
                                >
                                    {p.rakat} {t("prayer_guide.rakat")}
                                </span>
                            </div>
                        </div>

                        {isLoading ? (
                            <div className='space-y-2'>
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className='bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 px-5 py-4 animate-pulse'
                                    >
                                        <div className='h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/3' />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            steps.map((s, si) => (
                                <div
                                    key={si}
                                    className='bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden shadow-sm'
                                >
                                    <button
                                        onClick={() =>
                                            setOpenStep(
                                                openStep === si ? null : si,
                                            )
                                        }
                                        className='w-full flex items-center justify-between px-5 py-4 text-left'
                                    >
                                        <div className='flex items-center gap-3'>
                                            <span className='w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-extrabold flex items-center justify-center flex-shrink-0'>
                                                {si + 1}
                                            </span>
                                            <span className='font-semibold text-gray-800 dark:text-gray-100 text-sm'>
                                                {getLocalizedField(
                                                    s,
                                                    "title",
                                                    lang,
                                                    ["step"],
                                                ) || s.step}
                                            </span>
                                        </div>
                                        <BsChevronDown
                                            className={`text-gray-400 transition-transform flex-shrink-0 ${openStep === si ? "rotate-180" : ""}`}
                                        />
                                    </button>
                                    {openStep === si && (
                                        <div className='px-5 pb-5 space-y-3 border-t border-gray-50 dark:border-slate-700'>
                                            {s.arabic && (
                                                <p
                                                    className='text-right text-xl leading-loose text-gray-900 dark:text-white pt-3'
                                                    style={{
                                                        fontFamily:
                                                            "Amiri, serif",
                                                        direction: "rtl",
                                                    }}
                                                >
                                                    {s.arabic}
                                                </p>
                                            )}
                                            {s.latin && (
                                                <p className='text-sm text-emerald-700 dark:text-emerald-400 italic'>
                                                    {s.latin}
                                                </p>
                                            )}
                                            {(getLocalizedField(
                                                s,
                                                "translation",
                                                lang,
                                                ["terjemah"],
                                            ) ||
                                                s.terjemah) && (
                                                <p className='text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-slate-700/50 rounded-xl p-3'>
                                                    &ldquo;
                                                    {getLocalizedField(
                                                        s,
                                                        "translation",
                                                        lang,
                                                        ["terjemah"],
                                                    ) || s.terjemah}
                                                    &rdquo;
                                                </p>
                                            )}
                                            {(getLocalizedField(
                                                s,
                                                "note",
                                                lang,
                                                ["description", "notes"],
                                            ) ||
                                                s.note) && (
                                                <p className='text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 flex items-start gap-2'>
                                                    <span className='text-amber-500 flex-shrink-0'>
                                                        ℹ
                                                    </span>
                                                    {getLocalizedField(
                                                        s,
                                                        "note",
                                                        lang,
                                                        [
                                                            "description",
                                                            "notes",
                                                        ],
                                                    ) || s.note}
                                                </p>
                                            )}
                                            <SourceBadges source={s.source} />
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                );
            })()}
        </ContentWidth>
    );
}
