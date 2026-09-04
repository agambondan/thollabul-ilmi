"use client";

import ChangePasswordCard from "@/components/account/ChangePasswordCard";
import EditProfileCard from "@/components/account/EditProfileCard";
import { SkeletonProfile } from "@/components/skeleton/Skeleton";
import { useLocale } from "@/context/Locale";
import {
    hafalanApi,
    muhasabahApi,
    streakApi,
    userApi,
    progressApi,
} from "@/lib/api";
import {
    calcLocalPrayerStreak,
    isHafalanMemorized,
    normalizeHafalan,
    normalizeMuhasabah,
    parseApiJson,
    pickItems,
    readLocalArray,
    writeLocalArray,
} from "@/lib/personalSync";
import { useRequireAuth } from "@/lib/useRequireAuth";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
    BsBell,
    BsBook,
    BsBookmark,
    BsCheckCircle,
    BsChevronDown,
    BsChevronUp,
    BsJournalCheck,
    BsStickyFill,
    BsTranslate,
} from "react-icons/bs";
import { FaCalculator } from "react-icons/fa";
import { GiCompass } from "react-icons/gi";
import {
    MdAccessTime,
    MdFlag,
    MdFormatListBulleted,
    MdMosque,
    MdOutlinePlayLesson,
    MdRefresh,
    MdSelfImprovement,
} from "react-icons/md";
import InlineError from "@/components/InlineError";

const inputCls =
    "w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500";

/**
 * Every section of the profile screen.
 *
 * /profile and /dashboard/profile are the same screen wearing different chrome
 * — a public navbar+footer versus the dashboard shell. They used to be two
 * separate implementations that drifted apart: only /profile could change a
 * password, only /dashboard/profile showed the role badge and the muhasabah
 * count. The sections live here now; the pages supply nothing but the shell.
 */
const ProfileContent = () => {
    const { t } = useLocale();
    const {
        user,
        isAuthenticated,
        isLoading: authLoading,
        logout,
        refetchUser,
    } = useRequireAuth();
    const [quranProgress, setQuranProgress] = useState(null);
    const [hafalanSummary, setHafalanSummary] = useState(null);
    const [hadithProgress, setHadithProgress] = useState(null);
    const [langOpen, setLangOpen] = useState(false);
    const [selectedLang, setSelectedLang] = useState("idn");
    const [langLoading, setLangLoading] = useState(false);
    const [langMsg, setLangMsg] = useState({ type: "", text: "" });

    const [streak, setStreak] = useState(0);
    const [muhasabahCount, setMuhasabahCount] = useState(0);
    const [hafalCount, setHafalCount] = useState(0);
    const [syncError, setSyncError] = useState("");
    const [sessions, setSessions] = useState([]);
    const [sessionsLoading, setSessionsLoading] = useState(false);
    const [sessionsFailed, setSessionsFailed] = useState(false);
    const [sessionActionId, setSessionActionId] = useState(null);
    const [sessionMsg, setSessionMsg] = useState({ type: "", text: "" });
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteMsg, setDeleteMsg] = useState({ type: "", text: "" });

    useEffect(() => {
        const localMuhasabah =
            readLocalArray("tholabul_muhasabah").map(normalizeMuhasabah);
        const localHafalan =
            readLocalArray("tholabul_hafalan").map(normalizeHafalan);
        setMuhasabahCount(localMuhasabah.length);
        setHafalCount(localHafalan.filter(isHafalanMemorized).length);

        const loadPersonalCounts = async () => {
            if (!isAuthenticated) return;
            try {
                const [muhasabahPayload, hafalanPayload] = await Promise.all([
                    muhasabahApi.list().then(parseApiJson),
                    hafalanApi.list().then(parseApiJson),
                ]);
                const muhasabah =
                    pickItems(muhasabahPayload).map(normalizeMuhasabah);
                const hafalan = pickItems(hafalanPayload).map(normalizeHafalan);
                setMuhasabahCount(muhasabah.length);
                setHafalCount(hafalan.filter(isHafalanMemorized).length);
                writeLocalArray("tholabul_muhasabah", muhasabah);
                writeLocalArray("tholabul_hafalan", hafalan);
                setSyncError("");
            } catch {
                setSyncError(
                    "Stat profil memakai salinan lokal karena sinkron server belum tersedia.",
                );
            }
        };
        loadPersonalCounts();

        if (isAuthenticated) {
            streakApi
                .get()
                .then((r) => r.json())
                .then((d) => setStreak(d?.current ?? d?.streak ?? 0))
                .catch(() => setStreak(calcLocalPrayerStreak()));
        } else {
            setStreak(calcLocalPrayerStreak());
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (!isAuthenticated) return;
        setSessionsLoading(true);
        userApi
            .sessions()
            .then((r) => r.json())
            .then((data) =>
                setSessions(
                    Array.isArray(data?.data)
                        ? data.data
                        : Array.isArray(data)
                          ? data
                          : [],
                ),
            )
            .catch(() => setSessionsFailed(true))
            .finally(() => setSessionsLoading(false));
    }, [isAuthenticated]);

    // Progres baca dipakai section Progres Baca (asalnya hanya ada di /profile).
    useEffect(() => {
        if (authLoading || !isAuthenticated) return;
        Promise.allSettled([
            progressApi.getQuran().then((r) => r.json()),
            progressApi.getHadith().then((r) => r.json()),
            hafalanApi.summary().then((r) => r.json()),
        ]).then(([q, h, haf]) => {
            if (q.status === "fulfilled") setQuranProgress(q.value);
            if (h.status === "fulfilled") setHadithProgress(h.value);
            if (haf.status === "fulfilled") setHafalanSummary(haf.value);
        });
    }, [isAuthenticated, authLoading]);

    useEffect(() => {
        if (user?.preferred_lang) setSelectedLang(user.preferred_lang);
    }, [user]);

    const handleChangeLang = async (lang) => {
        setLangLoading(true);
        setLangMsg({ type: "", text: "" });
        try {
            const res = await userApi.updateMe(user.id, {
                preferred_lang: lang,
            });
            if (!res.ok) throw new Error();
            setSelectedLang(lang);
            refetchUser();
            setLangMsg({ type: "success", text: t("profile.lang_success") });
        } catch {
            setLangMsg({ type: "error", text: t("profile.lang_error") });
        } finally {
            setLangLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        setDeleteMsg({ type: "", text: "" });
        const confirmed = window.confirm(
            "Hapus akun ini? Aksi ini akan mengakhiri sesi kamu dan tidak dapat dibatalkan dari aplikasi.",
        );
        if (!confirmed) return;
        setDeleteLoading(true);
        try {
            const res = await userApi.deleteMe();
            if (!res.ok) throw new Error();
            await logout();
        } catch {
            setDeleteMsg({
                type: "error",
                text: "Akun belum bisa dihapus. Coba lagi nanti.",
            });
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleRevokeSession = async (sessionItem) => {
        if (!sessionItem?.id || sessionItem.current || sessionActionId) return;
        setSessionActionId(sessionItem.id);
        setSessionMsg({ type: "", text: "" });
        try {
            const res = await userApi.revokeSession(sessionItem.id);
            if (!res.ok) throw new Error();
            setSessions((items) =>
                items.filter((item) => item.id !== sessionItem.id),
            );
            setSessionMsg({
                type: "success",
                text: "Sesi login lain berhasil dikeluarkan.",
            });
        } catch {
            setSessionMsg({
                type: "error",
                text: "Sesi login belum bisa dikeluarkan.",
            });
        } finally {
            setSessionActionId(null);
        }
    };

    const initials = user?.name
        ? user.name
              .split(" ")
              .slice(0, 2)
              .map((w) => w[0])
              .join("")
              .toUpperCase()
        : "?";

    const roleBadge =
        user?.role === "admin"
            ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
            : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400";

    if (authLoading) return <SkeletonProfile />;

    return (
        <>
            {syncError ? (
                <div className='mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 dark:text-amber-400 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300'>
                    {syncError}
                </div>
            ) : null}

            {/* Avatar & info */}
            <div className='bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6 flex flex-col items-center text-center mb-5'>
                <div className='w-20 h-20 rounded-full bg-emerald-700 flex items-center justify-center mb-4'>
                    <span className='text-white text-2xl font-bold'>
                        {initials}
                    </span>
                </div>
                <p className='text-lg font-bold text-gray-900 dark:text-gray-100 dark:text-white'>
                    {user?.name ?? t("common.anonymous")}
                </p>
                <p className='text-sm text-gray-400 mt-0.5'>
                    {user?.email ?? ""}
                </p>
                {user?.role && (
                    <span
                        className={`mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleBadge}`}
                    >
                        {user.role}
                    </span>
                )}
            </div>

            {/* Quick stats */}
            <div className='grid grid-cols-3 gap-3'>
                <Link
                    href='/dashboard/stats'
                    className='bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4 text-center transition-colors hover:border-orange-200 dark:hover:border-orange-700'
                >
                    <p className='text-2xl font-bold text-orange-600 dark:text-orange-400'>
                        {streak}
                    </p>
                    <p className='text-xs text-gray-500 dark:text-gray-300 dark:text-gray-400 mt-0.5'>
                        {t("profile.streak_label")}
                    </p>
                </Link>
                <Link
                    href='/dashboard/muhasabah'
                    className='bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4 text-center transition-colors hover:border-purple-200 dark:hover:border-purple-700'
                >
                    <p className='text-2xl font-bold text-purple-600 dark:text-purple-400'>
                        {muhasabahCount}
                    </p>
                    <p className='text-xs text-gray-500 dark:text-gray-300 dark:text-gray-400 mt-0.5'>
                        {t("muhasabah.title")}
                    </p>
                </Link>
                <Link
                    href='/dashboard/hafalan'
                    className='bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4 text-center transition-colors hover:border-emerald-200 dark:hover:border-emerald-700'
                >
                    <p className='text-2xl font-bold text-emerald-700 dark:text-emerald-400'>
                        {hafalCount}
                    </p>
                    <p className='text-xs text-gray-500 dark:text-gray-300 dark:text-gray-400 mt-0.5'>
                        {t("profile.hafal_label")}
                    </p>
                </Link>
            </div>

            <div className='mt-5'>
                {/* Reading progress */}
                <div className='grid grid-cols-2 gap-3 mb-4'>
                    {quranProgress && (
                        <Link
                            href={
                                quranProgress.surah_latin
                                    ? `/dashboard/quran/${quranProgress.surah_latin}#${quranProgress.ayah_number}`
                                    : "/dashboard/quran"
                            }
                            className='p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors'
                        >
                            <div className='flex items-center gap-2 mb-2'>
                                <BsBook className='text-emerald-600 dark:text-emerald-400' />
                                <span className='text-xs font-semibold text-gray-500 dark:text-gray-300 dark:text-gray-400 uppercase'>
                                    {t("profile.last_quran")}
                                </span>
                            </div>
                            <p className='text-sm font-bold text-emerald-900 dark:text-emerald-300 dark:text-white'>
                                {quranProgress.surah_latin ??
                                    t("profile.not_started")}
                            </p>
                            {quranProgress.ayah_number && (
                                <p className='text-xs text-gray-500 dark:text-gray-300 dark:text-gray-400'>
                                    {t("profile.ayah")}{" "}
                                    {quranProgress.ayah_number}
                                </p>
                            )}
                        </Link>
                    )}
                    {hadithProgress && (
                        <Link
                            href={
                                hadithProgress.book_slug
                                    ? `/dashboard/hadith/${hadithProgress.book_slug}#${hadithProgress.hadith_id}`
                                    : "/dashboard/hadith"
                            }
                            className='p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors'
                        >
                            <div className='flex items-center gap-2 mb-2'>
                                <BsBook className='text-emerald-600 dark:text-emerald-400' />
                                <span className='text-xs font-semibold text-gray-500 dark:text-gray-300 dark:text-gray-400 uppercase'>
                                    {t("profile.last_hadith")}
                                </span>
                            </div>
                            <p className='text-sm font-bold text-emerald-900 dark:text-emerald-300 dark:text-white'>
                                {hadithProgress.book_slug ??
                                    t("profile.not_started")}
                            </p>
                            {hadithProgress.hadith_id && (
                                <p className='text-xs text-gray-500 dark:text-gray-300 dark:text-gray-400'>
                                    Hadith #{hadithProgress.hadith_id}
                                </p>
                            )}
                        </Link>
                    )}
                </div>
            </div>

            {/* Quick links */}
            <div className='grid grid-cols-2 gap-3 mb-6'>
                <Link
                    href='/dashboard/bookmarks'
                    className='flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors'
                >
                    <BsBookmark className='text-emerald-600 dark:text-emerald-400 text-xl' />
                    <span className='text-sm font-medium text-emerald-900 dark:text-emerald-300 dark:text-white'>
                        {t("link.bookmarks")}
                    </span>
                </Link>
                <Link
                    href='/dashboard/hafalan'
                    className='flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors'
                >
                    <BsCheckCircle className='text-emerald-600 dark:text-emerald-400 text-xl' />
                    <div>
                        <span className='text-sm font-medium text-emerald-900 dark:text-emerald-300 dark:text-white block'>
                            {t("link.memorization")}
                        </span>
                        {hafalanSummary && (
                            <span className='text-xs text-gray-500 dark:text-gray-300 dark:text-gray-400'>
                                {hafalanSummary.memorized ?? 0}{" "}
                                {t("hafalan.memorized").toLowerCase()}
                            </span>
                        )}
                    </div>
                </Link>
                <Link
                    href='/dashboard/tilawah'
                    className='flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors'
                >
                    <BsJournalCheck className='text-emerald-600 dark:text-emerald-400 text-xl' />
                    <span className='text-sm font-medium text-emerald-900 dark:text-emerald-300 dark:text-white'>
                        {t("link.recitation")}
                    </span>
                </Link>
                <Link
                    href='/dashboard/amalan'
                    className='flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors'
                >
                    <MdFormatListBulleted className='text-emerald-600 dark:text-emerald-400 text-xl' />
                    <span className='text-sm font-medium text-emerald-900 dark:text-emerald-300 dark:text-white'>
                        {t("link.deeds")}
                    </span>
                </Link>
                <Link
                    href='/dashboard/muroja-ah'
                    className='flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors'
                >
                    <MdRefresh className='text-emerald-600 dark:text-emerald-400 text-xl' />
                    <span className='text-sm font-medium text-emerald-900 dark:text-emerald-300 dark:text-white'>
                        {t("link.review")}
                    </span>
                </Link>
                <Link
                    href='/dashboard/notes'
                    className='flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors'
                >
                    <BsStickyFill className='text-emerald-600 dark:text-emerald-400 text-xl' />
                    <span className='text-sm font-medium text-emerald-900 dark:text-emerald-300 dark:text-white'>
                        {t("link.notes")}
                    </span>
                </Link>
                <Link
                    href='/dashboard/jadwal-sholat'
                    className='flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors'
                >
                    <MdAccessTime className='text-emerald-600 dark:text-emerald-400 text-xl' />
                    <span className='text-sm font-medium text-emerald-900 dark:text-emerald-300 dark:text-white'>
                        {t("link.prayer_schedule")}
                    </span>
                </Link>
                <Link
                    href='/dashboard/zakat'
                    className='flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors'
                >
                    <FaCalculator className='text-emerald-600 dark:text-emerald-400 text-xl' />
                    <span className='text-sm font-medium text-emerald-900 dark:text-emerald-300 dark:text-white'>
                        {t("link.zakat")}
                    </span>
                </Link>
                <Link
                    href='/dashboard/kiblat'
                    className='flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors'
                >
                    <GiCompass className='text-emerald-600 dark:text-emerald-400 text-xl' />
                    <span className='text-sm font-medium text-emerald-900 dark:text-emerald-300 dark:text-white'>
                        {t("link.qibla")}
                    </span>
                </Link>
                <Link
                    href='/dashboard/kamus'
                    className='flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors'
                >
                    <BsBook className='text-emerald-600 dark:text-emerald-400 text-xl' />
                    <span className='text-sm font-medium text-emerald-900 dark:text-emerald-300 dark:text-white'>
                        {t("link.arabic_dict")}
                    </span>
                </Link>
                <Link
                    href='/dashboard/sholat-tracker'
                    className='flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors'
                >
                    <MdMosque className='text-emerald-600 dark:text-emerald-400 text-xl' />
                    <span className='text-sm font-medium text-emerald-900 dark:text-emerald-300 dark:text-white'>
                        {t("link.sholat_tracker")}
                    </span>
                </Link>
                <Link
                    href='/dashboard/muhasabah'
                    className='flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors'
                >
                    <MdSelfImprovement className='text-emerald-600 dark:text-emerald-400 text-xl' />
                    <span className='text-sm font-medium text-emerald-900 dark:text-emerald-300 dark:text-white'>
                        {t("link.muhasabah")}
                    </span>
                </Link>
                <Link
                    href='/dashboard/goals'
                    className='flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors'
                >
                    <MdFlag className='text-emerald-600 dark:text-emerald-400 text-xl' />
                    <span className='text-sm font-medium text-emerald-900 dark:text-emerald-300 dark:text-white'>
                        {t("link.goals")}
                    </span>
                </Link>
                <Link
                    href='/dashboard/kajian'
                    className='flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors'
                >
                    <MdOutlinePlayLesson className='text-emerald-600 dark:text-emerald-400 text-xl' />
                    <span className='text-sm font-medium text-emerald-900 dark:text-emerald-300 dark:text-white'>
                        {t("link.kajian")}
                    </span>
                </Link>
                <Link
                    href='/dashboard/notifications'
                    className='flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors'
                >
                    <BsBell className='text-emerald-600 dark:text-emerald-400 text-xl' />
                    <span className='text-sm font-medium text-emerald-900 dark:text-emerald-300 dark:text-white'>
                        {t("link.notifications")}
                    </span>
                </Link>
            </div>

            <EditProfileCard
                user={user}
                refetchUser={refetchUser}
                className='mb-3'
            />

            {/* Preferensi bahasa */}
            <div className='bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 mb-3 overflow-hidden'>
                <button
                    onClick={() => {
                        setLangOpen((v) => !v);
                        setLangMsg({ type: "", text: "" });
                    }}
                    className='w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-gray-900 dark:text-gray-100 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors'
                >
                    <span className='flex items-center gap-2'>
                        <BsTranslate className='text-emerald-600 dark:text-emerald-400' />
                        {t("profile.translation_language")}
                    </span>
                    {langOpen ? <BsChevronUp /> : <BsChevronDown />}
                </button>
                {langOpen && (
                    <div className='px-5 pb-5 pt-1 border-t border-gray-100 dark:border-slate-700 space-y-3'>
                        {langMsg.text && (
                            <p
                                className={`text-sm ${langMsg.type === "error" ? "text-red-500 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}
                            >
                                {langMsg.text}
                            </p>
                        )}
                        <p className='text-xs text-gray-500 dark:text-gray-300 dark:text-gray-400'>
                            {t("profile.translation_language_desc")}
                        </p>
                        <div className='flex gap-2'>
                            {[
                                { value: "idn", label: "Indonesia" },
                                { value: "en", label: "English" },
                                { value: "ar", label: "العربية" },
                            ].map((lang) => (
                                <button
                                    key={lang.value}
                                    onClick={() => handleChangeLang(lang.value)}
                                    disabled={langLoading}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                                        selectedLang === lang.value
                                            ? "bg-emerald-700 text-white"
                                            : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-emerald-100 dark:hover:bg-slate-600"
                                    }`}
                                >
                                    {lang.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <ChangePasswordCard className='mb-3' />

            <div className='bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 mb-3 p-5'>
                <div className='flex items-center justify-between gap-3'>
                    <div>
                        <p className='text-sm font-semibold text-gray-900 dark:text-gray-100 dark:text-white'>
                            Sesi Aktif
                        </p>
                        <p className='mt-1 text-xs text-gray-500 dark:text-gray-300 dark:text-gray-400'>
                            Daftar sesi login yang masih aktif di akun ini.
                        </p>
                    </div>
                    {sessionsFailed && !sessionsLoading ? (
                        <InlineError />
                    ) : null}
                    {sessionsLoading ? (
                        <span className='text-xs font-semibold text-emerald-700 dark:text-emerald-400 dark:text-emerald-300'>
                            Memuat...
                        </span>
                    ) : null}
                </div>
                {sessions.length ? (
                    <div className='mt-4 space-y-2'>
                        {sessions.slice(0, 3).map((sessionItem) => (
                            <div
                                key={sessionItem.id}
                                className='flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900/40'
                            >
                                <div className='min-w-0'>
                                    <p className='font-semibold text-gray-800 dark:text-gray-200 dark:text-gray-100'>
                                        {sessionItem.current
                                            ? "Perangkat ini"
                                            : "Sesi login"}
                                    </p>
                                    <p className='mt-0.5 text-gray-500 dark:text-gray-300 dark:text-gray-400'>
                                        Aktif sejak{" "}
                                        {new Date(
                                            sessionItem.created_at,
                                        ).toLocaleDateString("id-ID")}
                                    </p>
                                </div>
                                {sessionItem.current ? (
                                    <span className='rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 dark:bg-emerald-900/40 dark:text-emerald-300'>
                                        Aktif
                                    </span>
                                ) : (
                                    <button
                                        className='shrink-0 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[10px] font-bold text-red-600 hover:bg-red-100 disabled:opacity-60 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300'
                                        disabled={
                                            sessionActionId === sessionItem.id
                                        }
                                        onClick={() =>
                                            handleRevokeSession(sessionItem)
                                        }
                                        type='button'
                                    >
                                        {sessionActionId === sessionItem.id
                                            ? "Keluar..."
                                            : "Keluar"}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                ) : !sessionsLoading ? (
                    <p className='mt-3 text-xs text-gray-500 dark:text-gray-300 dark:text-gray-400'>
                        Riwayat sesi aktif belum tersedia.
                    </p>
                ) : null}
                {sessionMsg.text ? (
                    <p
                        className={`mt-3 text-xs font-semibold ${
                            sessionMsg.type === "error"
                                ? "text-red-600 dark:text-red-300"
                                : "text-emerald-700 dark:text-emerald-300"
                        }`}
                    >
                        {sessionMsg.text}
                    </p>
                ) : null}
            </div>

            <div className='bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-100 dark:border-red-900/50 p-5'>
                <p className='text-sm font-semibold text-red-700 dark:text-red-400 dark:text-red-300'>
                    Hapus Akun
                </p>
                <p className='mt-1 text-xs text-red-600/80 dark:text-red-200/80'>
                    Menghapus akun akan mengakhiri sesi aktif dan menonaktifkan
                    akses personal.
                </p>
                {deleteMsg.text ? (
                    <p className='mt-3 text-xs font-semibold text-red-600 dark:text-red-300'>
                        {deleteMsg.text}
                    </p>
                ) : null}
                <button
                    type='button'
                    disabled={deleteLoading}
                    onClick={handleDeleteAccount}
                    className='mt-4 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 dark:text-red-400 transition-colors hover:bg-red-100 disabled:opacity-60 dark:border-red-900/60 dark:bg-slate-900 dark:text-red-300 dark:hover:bg-red-950/40'
                >
                    {deleteLoading ? t("common.saving") : "Hapus Akun"}
                </button>
            </div>
        </>
    );
};

export default ProfileContent;
