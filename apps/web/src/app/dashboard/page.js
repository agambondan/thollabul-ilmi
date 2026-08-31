"use client";

import DailyReminderCarousel from "@/components/DailyReminderCarousel";
import AdzanQuickControl from "@/components/AdzanQuickControl";
import PrayerCountdownWidget from "@/components/PrayerCountdownWidget";
import { useAuth } from "@/context/Auth";
import { useLocale } from "@/context/Locale";
import { muhasabahApi, progressApi, sholatTrackerApi } from "@/lib/api";
import {
    normalizeMuhasabah,
    normalizePrayerLog,
    parseApiJson,
    pickItems,
    prayerKey,
    readLocalArray,
    readLocalPrayerLog,
    todayISO,
    writeLocalArray,
    writeLocalPrayerLog,
} from "@/lib/personalSync";
import { useRequireAuth } from "@/lib/useRequireAuth";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
    BsBarChart,
    BsBookmark,
    BsCheckCircleFill,
    BsCircle,
    BsJournalCheck,
    BsPencilSquare,
    BsPerson,
    BsStickyFill,
} from "react-icons/bs";
import { ImBook } from "react-icons/im";
import { FaQuran } from "react-icons/fa";
import {
    MdFlag,
    MdMosque,
    MdOutlineAutoStories,
    MdOutlinePlayLesson,
    MdRefresh,
    MdSelfImprovement,
} from "react-icons/md";

const PRAYERS = ["Shubuh", "Dzuhur", "Ashar", "Maghrib", "Isya"];

const DashboardPage = () => {
    const { isAuthenticated, isLoading: authLoading } = useRequireAuth();
    const { user } = useAuth();
    const { t } = useLocale();

    const QUICK_LINKS = [
        {
            labelKey: "link.quran",
            href: "/dashboard/quran",
            icon: <FaQuran />,
            bg: "bg-emerald-50 dark:bg-emerald-900/20",
            text: "text-emerald-700 dark:text-emerald-400",
        },
        {
            labelKey: "link.sholat_tracker",
            href: "/dashboard/sholat-tracker",
            icon: <MdMosque />,
            bg: "bg-blue-50 dark:bg-blue-900/20",
            text: "text-blue-700 dark:text-blue-400",
        },
        {
            labelKey: "link.muhasabah",
            href: "/dashboard/muhasabah",
            icon: <MdSelfImprovement />,
            bg: "bg-purple-50 dark:bg-purple-900/20",
            text: "text-purple-700 dark:text-purple-400",
        },
        {
            labelKey: "link.goals",
            href: "/dashboard/goals",
            icon: <MdFlag />,
            bg: "bg-orange-50 dark:bg-orange-900/20",
            text: "text-orange-700 dark:text-orange-400",
        },
        {
            labelKey: "link.recitation",
            href: "/dashboard/tilawah",
            icon: <BsJournalCheck />,
            bg: "bg-teal-50 dark:bg-teal-900/20",
            text: "text-teal-700 dark:text-teal-400",
        },
        {
            labelKey: "link.review",
            href: "/dashboard/muroja-ah",
            icon: <MdRefresh />,
            bg: "bg-cyan-50 dark:bg-cyan-900/20",
            text: "text-cyan-700 dark:text-cyan-400",
        },
        {
            labelKey: "link.tafsir",
            href: "/dashboard/tafsir",
            icon: <MdOutlineAutoStories />,
            bg: "bg-amber-50 dark:bg-amber-900/20",
            text: "text-amber-700 dark:text-amber-400",
        },
        {
            labelKey: "link.kajian",
            href: "/dashboard/kajian",
            icon: <MdOutlinePlayLesson />,
            bg: "bg-rose-50 dark:bg-rose-900/20",
            text: "text-rose-700 dark:text-rose-400",
        },
    ];

    const [prayerLog, setPrayerLog] = useState({});
    const [muhasabahList, setMuhasabahList] = useState([]);
    const [quranProgress, setQuranProgress] = useState(null);
    const [hadithProgress, setHadithProgress] = useState(null);
    const [syncError, setSyncError] = useState("");

    useEffect(() => {
        if (authLoading || !isAuthenticated) return;

        const loadPersonalSummary = async () => {
            const today = todayISO();
            const localPrayer = readLocalPrayerLog(today);
            setPrayerLog(localPrayer);
            setMuhasabahList(
                readLocalArray("tholabul_muhasabah").map(normalizeMuhasabah),
            );

            try {
                const [prayerPayload, muhasabahPayload] = await Promise.all([
                    sholatTrackerApi.today().then(parseApiJson),
                    muhasabahApi.list().then(parseApiJson),
                ]);
                const serverPrayer = normalizePrayerLog(prayerPayload);
                const mergedPrayer = { ...localPrayer, ...serverPrayer };
                const serverMuhasabah =
                    pickItems(muhasabahPayload).map(normalizeMuhasabah);
                setPrayerLog(mergedPrayer);
                setMuhasabahList(serverMuhasabah);
                writeLocalPrayerLog(today, mergedPrayer);
                writeLocalArray("tholabul_muhasabah", serverMuhasabah);
                setSyncError("");
            } catch {
                setSyncError(
                    "Ringkasan personal memakai salinan lokal karena sinkron server belum tersedia.",
                );
            }
        };

        loadPersonalSummary();

        progressApi
            .getQuran()
            .then((r) => r.json())
            .then((d) => setQuranProgress(d ?? null))
            .catch((e) => console.error(e));

        progressApi
            .getHadith()
            .then((r) => r.json())
            .then((d) => setHadithProgress(d ?? null))
            .catch((e) => console.error(e));
    }, [isAuthenticated, authLoading]);

    const lastMuhasabah = muhasabahList[0] ?? null;

    if (authLoading) return null;

    return (
        <div className='px-4 py-6'>
            {/* Welcome */}
            <div className='mb-6'>
                <h1 className='text-xl font-bold text-emerald-900 dark:text-white'>
                    Assalamu&apos;alaikum
                    {user?.name ? `, ${user.name.split(" ")[0]}` : ""} 👋
                </h1>
                <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                    {new Date().toLocaleDateString("id-ID", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                    })}
                </p>
            </div>
            {syncError ? (
                <div className='mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300'>
                    {syncError}
                </div>
            ) : null}
            {/* Prayer schedule */}
            <div className='mb-6'>
                <PrayerCountdownWidget basePath='/dashboard/jadwal-sholat' />
            </div>
            <div className='mb-5'>
                <DailyReminderCarousel
                    ayahBasePath='/dashboard/quran'
                    hadithBasePath='/dashboard/hadith'
                />
            </div>
            {/* Continue Reading */}
            {(quranProgress?.surah_latin || hadithProgress?.book_slug) && (
                <div className='bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4 mb-5'>
                    <p className='text-sm font-semibold text-gray-800 dark:text-white mb-3'>
                        {t("khatam.continue_reading")}
                    </p>
                    <div className='space-y-2.5'>
                        {quranProgress?.surah_latin && (
                            <Link
                                href={`/dashboard/quran/${quranProgress.surah_latin}`}
                                className='flex items-center justify-between group'
                            >
                                <div className='flex items-center gap-3'>
                                    <div className='w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center'>
                                        <FaQuran className='text-emerald-700 dark:text-emerald-400 text-sm' />
                                    </div>
                                    <div>
                                        <p className='text-xs font-medium text-gray-700 dark:text-gray-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors'>
                                            Al-Quran
                                        </p>
                                        <p className='text-[11px] text-gray-400 capitalize'>
                                            {quranProgress.surah_latin.replace(
                                                /-/g,
                                                " ",
                                            )}
                                            {quranProgress.ayah_number
                                                ? ` · ${t("profile.ayah")} ${quranProgress.ayah_number}`
                                                : ""}
                                        </p>
                                    </div>
                                </div>
                                <span className='text-emerald-500 text-sm'>
                                    →
                                </span>
                            </Link>
                        )}
                        {hadithProgress?.book_slug && (
                            <Link
                                href={`/dashboard/hadith/${hadithProgress.book_slug}`}
                                className='flex items-center justify-between group'
                            >
                                <div className='flex items-center gap-3'>
                                    <div className='w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center'>
                                        <ImBook className='text-amber-700 dark:text-amber-400 text-sm' />
                                    </div>
                                    <div>
                                        <p className='text-xs font-medium text-gray-700 dark:text-gray-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors capitalize'>
                                            {hadithProgress.book_slug.replace(
                                                /-/g,
                                                " ",
                                            )}
                                        </p>
                                        {hadithProgress.hadith_id && (
                                            <p className='text-[11px] text-gray-400'>
                                                Hadith #
                                                {hadithProgress.hadith_id}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <span className='text-emerald-500 text-sm'>
                                    →
                                </span>
                            </Link>
                        )}
                    </div>
                </div>
            )}
            {/* Sholat ringkas */}
            <div className='bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4 mb-5'>
                <div className='flex items-center justify-between mb-3'>
                    <p className='text-sm font-semibold text-gray-800 dark:text-white'>
                        {t("dash.today_prayers")}
                    </p>
                    <Link
                        href='/dashboard/sholat-tracker'
                        className='text-xs text-emerald-600 dark:text-emerald-400 hover:underline'
                    >
                        {t("dash.log_prayers")}
                    </Link>
                </div>
                <div className='flex gap-2'>
                    {PRAYERS.map((p) => {
                        const done = !!prayerLog[prayerKey(p)];
                        return (
                            <div
                                key={p}
                                className='flex-1 flex flex-col items-center gap-1'
                            >
                                {done ? (
                                    <BsCheckCircleFill className='text-emerald-500 text-base' />
                                ) : (
                                    <BsCircle className='text-gray-300 dark:text-slate-600 text-base' />
                                )}
                                <span className='text-[10px] text-gray-500 dark:text-gray-400'>
                                    {p}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
            <div className='mb-5'>
                {/* Last muhasabah */}
                <div className='bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4'>
                    <div className='flex items-center justify-between mb-3'>
                        <p className='text-sm font-semibold text-gray-800 dark:text-white'>
                            {t("dash.last_muhasabah")}
                        </p>
                        <Link
                            href='/dashboard/muhasabah'
                            className='text-xs text-emerald-600 dark:text-emerald-400 hover:underline'
                        >
                            {t("common.see_all")}
                        </Link>
                    </div>
                    {lastMuhasabah !== null ? (
                        <div>
                            <p className='text-[11px] text-gray-400 mb-1'>
                                {lastMuhasabah.date
                                    ? new Date(
                                          lastMuhasabah.date + "T00:00:00",
                                      ).toLocaleDateString("id-ID", {
                                          weekday: "short",
                                          day: "numeric",
                                          month: "short",
                                      })
                                    : ""}
                            </p>
                            <p className='text-sm text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-3'>
                                {lastMuhasabah.content}
                            </p>
                        </div>
                    ) : (
                        <div className='text-center py-4'>
                            <p className='text-xs text-gray-400'>
                                {t("dash.no_muhasabah")}
                            </p>
                            <Link
                                href='/dashboard/muhasabah'
                                className='text-xs text-emerald-600 dark:text-emerald-400 hover:underline mt-1 inline-block'
                            >
                                {t("dash.write_now")}
                            </Link>
                        </div>
                    )}
                </div>
            </div>
            {/* Adzan quick control */}
            <div className='mb-6'>
                <AdzanQuickControl />
            </div>
            {/* Quick access */}
            <h2 className='text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3'>
                {t("dash.quick_access")}
            </h2>
            <div className='grid grid-cols-4 gap-3 mb-6'>
                {QUICK_LINKS.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className='bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-700 hover:shadow-sm transition-all p-3 flex flex-col items-center gap-2 text-center group'
                    >
                        <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${item.bg} ${item.text}`}
                        >
                            {item.icon}
                        </div>
                        <span className='text-[11px] font-medium text-gray-600 dark:text-gray-300 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors leading-tight'>
                            {t(item.labelKey)}
                        </span>
                    </Link>
                ))}
            </div>
            {/* Write muhasabah CTA */}
            <div className='mt-6 bg-emerald-700 dark:bg-emerald-800 rounded-xl p-5 flex items-center justify-between gap-4'>
                <div>
                    <p className='text-sm font-semibold text-white'>
                        {t("dash.muhasabah_cta")}
                    </p>
                    <p className='text-xs text-emerald-200 mt-0.5'>
                        {t("dash.muhasabah_cta_desc")}
                    </p>
                </div>
                <Link
                    href='/dashboard/muhasabah'
                    className='flex-shrink-0 flex items-center gap-1.5 px-4 py-2 bg-white text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-50 transition-colors'
                >
                    <BsPencilSquare />
                    {t("common.write")}
                </Link>
            </div>
        </div>
    );
};

export default DashboardPage;
