'use client';

import Footer from '@/components/Footer';
import { NavbarTailwindCss } from '@/components/Navbar';
import Section from '@/components/Section';
import { SkeletonProfile } from '@/components/skeleton/Skeleton';
import { useLocale } from '@/context/Locale';
import { useLayoutMode } from '@/lib/useLayoutMode';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { hafalanApi, progressApi, streakApi, userApi } from '@/lib/api';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
    BsBell,
    BsBook,
    BsBookmark,
    BsCheckCircle,
    BsChevronDown,
    BsChevronUp,
    BsFire,
    BsJournalCheck,
    BsLock,
    BsPencil,
    BsPerson,
    BsStickyFill,
    BsTranslate,
} from 'react-icons/bs';
import { FaCalculator } from 'react-icons/fa';
import { GiCompass } from 'react-icons/gi';
import { MdAccessTime, MdFlag, MdFormatListBulleted, MdMosque, MdOutlinePlayLesson, MdRefresh, MdSelfImprovement } from 'react-icons/md';

const inputCls =
    'w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500';

const ProfilePage = () => {
    const { t } = useLocale();
    const { isWide } = useLayoutMode();
    const { user, isAuthenticated, isLoading: authLoading, logout, refetchUser } = useRequireAuth();
    const [streak, setStreak] = useState(null);
    const [quranProgress, setQuranProgress] = useState(null);
    const [hadithProgress, setHadithProgress] = useState(null);
    const [hafalanSummary, setHafalanSummary] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const [editOpen, setEditOpen] = useState(false);
    const [editName, setEditName] = useState('');
    const [editLoading, setEditLoading] = useState(false);
    const [editMsg, setEditMsg] = useState({ type: '', text: '' });

    const [pwdOpen, setPwdOpen] = useState(false);
    const [oldPwd, setOldPwd] = useState('');
    const [newPwd, setNewPwd] = useState('');
    const [confirmPwd, setConfirmPwd] = useState('');
    const [pwdLoading, setPwdLoading] = useState(false);
    const [pwdMsg, setPwdMsg] = useState({ type: '', text: '' });

    const [langOpen, setLangOpen] = useState(false);
    const [selectedLang, setSelectedLang] = useState('idn');
    const [langLoading, setLangLoading] = useState(false);
    const [langMsg, setLangMsg] = useState({ type: '', text: '' });
    const [sessions, setSessions] = useState([]);
    const [sessionsLoading, setSessionsLoading] = useState(false);
    const [sessionActionId, setSessionActionId] = useState(null);
    const [sessionMsg, setSessionMsg] = useState({ type: '', text: '' });
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteMsg, setDeleteMsg] = useState({ type: '', text: '' });

    useEffect(() => {
        if (authLoading || !isAuthenticated) return;
        Promise.allSettled([
            streakApi.get().then((r) => r.json()),
            progressApi.getQuran().then((r) => r.json()),
            progressApi.getHadith().then((r) => r.json()),
            hafalanApi.summary().then((r) => r.json()),
        ]).then(([s, q, h, haf]) => {
            if (s.status === 'fulfilled') setStreak(s.value);
            if (q.status === 'fulfilled') setQuranProgress(q.value);
            if (h.status === 'fulfilled') setHadithProgress(h.value);
            if (haf.status === 'fulfilled') setHafalanSummary(haf.value);
            setIsLoading(false);
        });
    }, [isAuthenticated, authLoading]);

    useEffect(() => {
        if (user?.name) setEditName(user.name);
        if (user?.preferred_lang) setSelectedLang(user.preferred_lang);
    }, [user]);

    useEffect(() => {
        if (!isAuthenticated) return;
        setSessionsLoading(true);
        userApi
            .sessions()
            .then((r) => r.json())
            .then((data) => setSessions(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []))
            .catch(() => setSessions([]))
            .finally(() => setSessionsLoading(false));
    }, [isAuthenticated]);

    const handleEditProfile = async (e) => {
        e.preventDefault();
        if (!editName.trim()) return;
        setEditLoading(true);
        setEditMsg({ type: '', text: '' });
        try {
            const res = await userApi.updateMe(user.id, { name: editName.trim() });
            if (!res.ok) throw new Error();
            refetchUser();
            setEditMsg({ type: 'success', text: t('profile.update_success') });
            setEditOpen(false);
        } catch {
            setEditMsg({ type: 'error', text: t('profile.update_error') });
        } finally {
            setEditLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (newPwd !== confirmPwd) {
            setPwdMsg({ type: 'error', text: t('profile.password_mismatch') });
            return;
        }
        if (newPwd.length < 8) {
            setPwdMsg({ type: 'error', text: t('profile.password_min') });
            return;
        }
        setPwdLoading(true);
        setPwdMsg({ type: '', text: '' });
        try {
            const res = await userApi.changePassword(oldPwd, newPwd);
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || t('profile.old_password_wrong'));
            }
            setPwdMsg({ type: 'success', text: t('profile.password_success') });
            setOldPwd('');
            setNewPwd('');
            setConfirmPwd('');
            setPwdOpen(false);
        } catch (err) {
            setPwdMsg({ type: 'error', text: err.message || t('profile.password_error') });
        } finally {
            setPwdLoading(false);
        }
    };

    const handleChangeLang = async (lang) => {
        setLangLoading(true);
        setLangMsg({ type: '', text: '' });
        try {
            const res = await userApi.updateMe(user.id, { preferred_lang: lang });
            if (!res.ok) throw new Error();
            setSelectedLang(lang);
            refetchUser();
            setLangMsg({ type: 'success', text: t('profile.lang_success') });
        } catch {
            setLangMsg({ type: 'error', text: t('profile.lang_error') });
        } finally {
            setLangLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        setDeleteMsg({ type: '', text: '' });
        const confirmed = window.confirm('Hapus akun ini? Aksi ini akan mengakhiri sesi kamu dan tidak dapat dibatalkan dari aplikasi.');
        if (!confirmed) return;
        setDeleteLoading(true);
        try {
            const res = await userApi.deleteMe();
            if (!res.ok) throw new Error();
            await logout();
        } catch {
            setDeleteMsg({ type: 'error', text: 'Akun belum bisa dihapus. Coba lagi nanti.' });
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleRevokeSession = async (sessionItem) => {
        if (!sessionItem?.id || sessionItem.current || sessionActionId) return;
        setSessionActionId(sessionItem.id);
        setSessionMsg({ type: '', text: '' });
        try {
            const res = await userApi.revokeSession(sessionItem.id);
            if (!res.ok) throw new Error();
            setSessions((items) => items.filter((item) => item.id !== sessionItem.id));
            setSessionMsg({ type: 'success', text: 'Sesi login lain berhasil dikeluarkan.' });
        } catch {
            setSessionMsg({ type: 'error', text: 'Sesi login belum bisa dikeluarkan.' });
        } finally {
            setSessionActionId(null);
        }
    };

    if (authLoading || isLoading) return <SkeletonProfile />;

    return (
        <main className='min-h-screen flex flex-col'>
            <NavbarTailwindCss />
            <Section>
                <div className={isWide ? 'w-full px-4' : 'container mx-auto px-4 max-w-2xl'}>
                    {/* Header */}
                    <div className='flex items-center justify-between mb-6'>
                        <div className='flex items-center gap-3'>
                            <div className='w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center'>
                                <BsPerson className='text-2xl text-emerald-700 dark:text-emerald-400' />
                            </div>
                            <div>
                                <h1 className='text-lg font-bold text-emerald-900 dark:text-white'>
                                    {user?.name ?? t('common.user')}
                                </h1>
                                <p className='text-sm text-gray-500 dark:text-gray-400'>
                                    {user?.email}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={logout}
                            className='text-sm text-red-500 dark:text-red-400 hover:underline'
                        >
                            {t('nav.logout')}
                        </button>
                    </div>

                    {/* Streak */}
                    {streak && (
                        <div className='bg-gradient-to-r from-emerald-700 to-emerald-600 rounded-2xl p-5 mb-4 text-white'>
                            <div className='flex items-center gap-2 mb-3'>
                                <BsFire className='text-orange-300 text-xl' />
                                <span className='font-semibold'>{t('profile.reading_streak')}</span>
                            </div>
                            <div className='flex gap-6'>
                                <div>
                                    <p className='text-3xl font-extrabold'>{streak.current ?? 0}</p>
                                    <p className='text-xs text-emerald-200 mt-1'>{t('profile.consecutive_days')}</p>
                                </div>
                                <div>
                                    <p className='text-3xl font-extrabold'>{streak.longest ?? 0}</p>
                                    <p className='text-xs text-emerald-200 mt-1'>{t('profile.longest')}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Reading progress */}
                    <div className='grid grid-cols-2 gap-3 mb-4'>
                        {quranProgress && (
                            <Link
                                href={
                                    quranProgress.surah_latin
                                        ? `/dashboard/quran/${quranProgress.surah_latin}#${quranProgress.ayah_number}`
                                        : '/dashboard/quran'
                                }
                                className='p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors'
                            >
                                <div className='flex items-center gap-2 mb-2'>
                                    <BsBook className='text-emerald-600 dark:text-emerald-400' />
                                    <span className='text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase'>
                                        {t('profile.last_quran')}
                                    </span>
                                </div>
                                <p className='text-sm font-bold text-emerald-900 dark:text-white'>
                                    {quranProgress.surah_latin ?? t('profile.not_started')}
                                </p>
                                {quranProgress.ayah_number && (
                                    <p className='text-xs text-gray-500 dark:text-gray-400'>
                                        {t('profile.ayah')} {quranProgress.ayah_number}
                                    </p>
                                )}
                            </Link>
                        )}
                        {hadithProgress && (
                            <Link
                                href={
                                    hadithProgress.book_slug
                                        ? `/dashboard/hadith/${hadithProgress.book_slug}#${hadithProgress.hadith_id}`
                                        : '/dashboard/hadith'
                                }
                                className='p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors'
                            >
                                <div className='flex items-center gap-2 mb-2'>
                                    <BsBook className='text-emerald-600 dark:text-emerald-400' />
                                    <span className='text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase'>
                                        {t('profile.last_hadith')}
                                    </span>
                                </div>
                                <p className='text-sm font-bold text-emerald-900 dark:text-white'>
                                    {hadithProgress.book_slug ?? t('profile.not_started')}
                                </p>
                                {hadithProgress.hadith_id && (
                                    <p className='text-xs text-gray-500 dark:text-gray-400'>
                                        Hadith #{hadithProgress.hadith_id}
                                    </p>
                                )}
                            </Link>
                        )}
                    </div>

                    {/* Quick links */}
                    <div className='grid grid-cols-2 gap-3 mb-6'>
                        <Link
                            href='/dashboard/bookmarks'
                            className='flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors'
                        >
                            <BsBookmark className='text-emerald-600 dark:text-emerald-400 text-xl' />
                            <span className='text-sm font-medium text-emerald-900 dark:text-white'>
                                {t('link.bookmarks')}
                            </span>
                        </Link>
                        <Link
                            href='/dashboard/hafalan'
                            className='flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors'
                        >
                            <BsCheckCircle className='text-emerald-600 dark:text-emerald-400 text-xl' />
                            <div>
                                <span className='text-sm font-medium text-emerald-900 dark:text-white block'>
                                    {t('link.memorization')}
                                </span>
                                {hafalanSummary && (
                                    <span className='text-xs text-gray-500 dark:text-gray-400'>
                                        {hafalanSummary.memorized ?? 0} {t('hafalan.memorized').toLowerCase()}
                                    </span>
                                )}
                            </div>
                        </Link>
                        <Link
                            href='/dashboard/tilawah'
                            className='flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors'
                        >
                            <BsJournalCheck className='text-emerald-600 dark:text-emerald-400 text-xl' />
                            <span className='text-sm font-medium text-emerald-900 dark:text-white'>
                                {t('link.recitation')}
                            </span>
                        </Link>
                        <Link
                            href='/dashboard/amalan'
                            className='flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors'
                        >
                            <MdFormatListBulleted className='text-emerald-600 dark:text-emerald-400 text-xl' />
                            <span className='text-sm font-medium text-emerald-900 dark:text-white'>
                                {t('link.deeds')}
                            </span>
                        </Link>
                        <Link
                            href='/dashboard/muroja-ah'
                            className='flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors'
                        >
                            <MdRefresh className='text-emerald-600 dark:text-emerald-400 text-xl' />
                            <span className='text-sm font-medium text-emerald-900 dark:text-white'>
                                {t('link.review')}
                            </span>
                        </Link>
                        <Link
                            href='/dashboard/notes'
                            className='flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors'
                        >
                            <BsStickyFill className='text-emerald-600 dark:text-emerald-400 text-xl' />
                            <span className='text-sm font-medium text-emerald-900 dark:text-white'>
                                {t('link.notes')}
                            </span>
                        </Link>
                        <Link
                            href='/dashboard/jadwal-sholat'
                            className='flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors'
                        >
                            <MdAccessTime className='text-emerald-600 dark:text-emerald-400 text-xl' />
                            <span className='text-sm font-medium text-emerald-900 dark:text-white'>
                                {t('link.prayer_schedule')}
                            </span>
                        </Link>
                        <Link
                            href='/dashboard/zakat'
                            className='flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors'
                        >
                            <FaCalculator className='text-emerald-600 dark:text-emerald-400 text-xl' />
                            <span className='text-sm font-medium text-emerald-900 dark:text-white'>
                                {t('link.zakat')}
                            </span>
                        </Link>
                        <Link
                            href='/dashboard/kiblat'
                            className='flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors'
                        >
                            <GiCompass className='text-emerald-600 dark:text-emerald-400 text-xl' />
                            <span className='text-sm font-medium text-emerald-900 dark:text-white'>
                                {t('link.qibla')}
                            </span>
                        </Link>
                        <Link
                            href='/dashboard/kamus'
                            className='flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors'
                        >
                            <BsBook className='text-emerald-600 dark:text-emerald-400 text-xl' />
                            <span className='text-sm font-medium text-emerald-900 dark:text-white'>
                                {t('link.arabic_dict')}
                            </span>
                        </Link>
                        <Link
                            href='/dashboard/sholat-tracker'
                            className='flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors'
                        >
                            <MdMosque className='text-emerald-600 dark:text-emerald-400 text-xl' />
                            <span className='text-sm font-medium text-emerald-900 dark:text-white'>
                                {t('link.sholat_tracker')}
                            </span>
                        </Link>
                        <Link
                            href='/dashboard/muhasabah'
                            className='flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors'
                        >
                            <MdSelfImprovement className='text-emerald-600 dark:text-emerald-400 text-xl' />
                            <span className='text-sm font-medium text-emerald-900 dark:text-white'>
                                {t('link.muhasabah')}
                            </span>
                        </Link>
                        <Link
                            href='/dashboard/goals'
                            className='flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors'
                        >
                            <MdFlag className='text-emerald-600 dark:text-emerald-400 text-xl' />
                            <span className='text-sm font-medium text-emerald-900 dark:text-white'>
                                {t('link.goals')}
                            </span>
                        </Link>
                        <Link
                            href='/dashboard/kajian'
                            className='flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors'
                        >
                            <MdOutlinePlayLesson className='text-emerald-600 dark:text-emerald-400 text-xl' />
                            <span className='text-sm font-medium text-emerald-900 dark:text-white'>
                                {t('link.kajian')}
                            </span>
                        </Link>
                        <Link
                            href='/dashboard/notifications'
                            className='flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors'
                        >
                            <BsBell className='text-emerald-600 dark:text-emerald-400 text-xl' />
                            <span className='text-sm font-medium text-emerald-900 dark:text-white'>
                                {t('link.notifications')}
                            </span>
                        </Link>
                    </div>

                    {/* Edit profil */}
                    <div className='bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 mb-3 overflow-hidden'>
                        <button
                            onClick={() => {
                                setEditOpen((v) => !v);
                                setEditMsg({ type: '', text: '' });
                            }}
                            className='w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors'
                        >
                            <span className='flex items-center gap-2'>
                                <BsPencil className='text-emerald-600 dark:text-emerald-400' />
                                {t('profile.edit_profile')}
                            </span>
                            {editOpen ? <BsChevronUp /> : <BsChevronDown />}
                        </button>
                        {editOpen && (
                            <form
                                onSubmit={handleEditProfile}
                                className='px-5 pb-5 pt-1 border-t border-gray-100 dark:border-slate-700 space-y-4'
                            >
                                {editMsg.text && (
                                    <p
                                        className={`text-sm ${editMsg.type === 'error' ? 'text-red-500 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}
                                    >
                                        {editMsg.text}
                                    </p>
                                )}
                                <div>
                                    <label className='block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1'>
                                        {t('auth.name')}
                                    </label>
                                    <input
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        required
                                        className={inputCls}
                                    />
                                </div>
                                <div>
                                    <label className='block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1'>
                                        Email
                                    </label>
                                    <input
                                        value={user?.email ?? ''}
                                        disabled
                                        className={`${inputCls} opacity-60 cursor-not-allowed`}
                                    />
                                </div>
                                <button
                                    type='submit'
                                    disabled={editLoading}
                                    className='px-5 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors'
                                >
                                    {editLoading ? t('common.saving') : t('common.save')}
                                </button>
                            </form>
                        )}
                    </div>

                    {/* Preferensi bahasa */}
                    <div className='bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 mb-3 overflow-hidden'>
                        <button
                            onClick={() => {
                                setLangOpen((v) => !v);
                                setLangMsg({ type: '', text: '' });
                            }}
                            className='w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors'
                        >
                            <span className='flex items-center gap-2'>
                                <BsTranslate className='text-emerald-600 dark:text-emerald-400' />
                                {t('profile.translation_language')}
                            </span>
                            {langOpen ? <BsChevronUp /> : <BsChevronDown />}
                        </button>
                        {langOpen && (
                            <div className='px-5 pb-5 pt-1 border-t border-gray-100 dark:border-slate-700 space-y-3'>
                                {langMsg.text && (
                                    <p
                                        className={`text-sm ${langMsg.type === 'error' ? 'text-red-500 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}
                                    >
                                        {langMsg.text}
                                    </p>
                                )}
                                <p className='text-xs text-gray-500 dark:text-gray-400'>
                                    {t('profile.translation_language_desc')}
                                </p>
                                <div className='flex gap-2'>
                                    {[
                                        { value: 'idn', label: 'Indonesia' },
                                        { value: 'en', label: 'English' },
                                        { value: 'ar', label: 'العربية' },
                                    ].map((lang) => (
                                        <button
                                            key={lang.value}
                                            onClick={() => handleChangeLang(lang.value)}
                                            disabled={langLoading}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                                                selectedLang === lang.value
                                                    ? 'bg-emerald-700 text-white'
                                                    : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-emerald-100 dark:hover:bg-slate-600'
                                            }`}
                                        >
                                            {lang.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Ganti password */}
                    <div className='bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 mb-3 overflow-hidden'>
                        <button
                            onClick={() => {
                                setPwdOpen((v) => !v);
                                setPwdMsg({ type: '', text: '' });
                            }}
                            className='w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors'
                        >
                            <span className='flex items-center gap-2'>
                                <BsLock className='text-emerald-600 dark:text-emerald-400' />
                                {t('profile.change_password')}
                            </span>
                            {pwdOpen ? <BsChevronUp /> : <BsChevronDown />}
                        </button>
                        {pwdOpen && (
                            <form
                                onSubmit={handleChangePassword}
                                className='px-5 pb-5 pt-1 border-t border-gray-100 dark:border-slate-700 space-y-4'
                            >
                                {pwdMsg.text && (
                                    <p
                                        className={`text-sm ${pwdMsg.type === 'error' ? 'text-red-500 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}
                                    >
                                        {pwdMsg.text}
                                    </p>
                                )}
                                <div>
                                    <label className='block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1'>
                                        {t('profile.old_password')}
                                    </label>
                                    <input
                                        type='password'
                                        value={oldPwd}
                                        onChange={(e) => setOldPwd(e.target.value)}
                                        required
                                        className={inputCls}
                                        placeholder='••••••••'
                                    />
                                </div>
                                <div>
                                    <label className='block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1'>
                                        {t('profile.new_password')}
                                    </label>
                                    <input
                                        type='password'
                                        value={newPwd}
                                        onChange={(e) => setNewPwd(e.target.value)}
                                        required
                                        minLength={8}
                                        className={inputCls}
                                        placeholder={t('auth.min_chars')}
                                    />
                                </div>
                                <div>
                                    <label className='block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1'>
                                        {t('profile.confirm_new_password')}
                                    </label>
                                    <input
                                        type='password'
                                        value={confirmPwd}
                                        onChange={(e) => setConfirmPwd(e.target.value)}
                                        required
                                        className={inputCls}
                                        placeholder={t('profile.repeat_new_password')}
                                    />
                                </div>
                                <button
                                    type='submit'
                                    disabled={pwdLoading}
                                    className='px-5 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors'
                                >
                                    {pwdLoading ? t('common.saving') : t('profile.change_password_btn')}
                                </button>
                            </form>
                        )}
                    </div>

                    <div className='bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 mb-3 p-5'>
                        <div className='flex items-center justify-between gap-3'>
                            <div>
                                <p className='text-sm font-semibold text-gray-900 dark:text-white'>
                                    Sesi Aktif
                                </p>
                                <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
                                    Daftar sesi login yang masih aktif di akun ini.
                                </p>
                            </div>
                            {sessionsLoading ? (
                                <span className='text-xs font-semibold text-emerald-700 dark:text-emerald-300'>
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
                                            <p className='font-semibold text-gray-800 dark:text-gray-100'>
                                                {sessionItem.current ? 'Perangkat ini' : 'Sesi login'}
                                            </p>
                                            <p className='mt-0.5 text-gray-500 dark:text-gray-400'>
                                                Aktif sejak {new Date(sessionItem.created_at).toLocaleDateString('id-ID')}
                                            </p>
                                        </div>
                                        {sessionItem.current ? (
                                            <span className='rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'>
                                                Aktif
                                            </span>
                                        ) : (
                                            <button
                                                className='shrink-0 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[10px] font-bold text-red-600 hover:bg-red-100 disabled:opacity-60 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300'
                                                disabled={sessionActionId === sessionItem.id}
                                                onClick={() => handleRevokeSession(sessionItem)}
                                                type='button'
                                            >
                                                {sessionActionId === sessionItem.id ? 'Keluar...' : 'Keluar'}
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : !sessionsLoading ? (
                            <p className='mt-3 text-xs text-gray-500 dark:text-gray-400'>
                                Riwayat sesi aktif belum tersedia.
                            </p>
                        ) : null}
                        {sessionMsg.text ? (
                            <p
                                className={`mt-3 text-xs font-semibold ${
                                    sessionMsg.type === 'error'
                                        ? 'text-red-600 dark:text-red-300'
                                        : 'text-emerald-700 dark:text-emerald-300'
                                }`}
                            >
                                {sessionMsg.text}
                            </p>
                        ) : null}
                    </div>

                    <div className='bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-100 dark:border-red-900/50 p-5'>
                        <p className='text-sm font-semibold text-red-700 dark:text-red-300'>
                            Hapus Akun
                        </p>
                        <p className='mt-1 text-xs text-red-600/80 dark:text-red-200/80'>
                            Menghapus akun akan mengakhiri sesi aktif dan menonaktifkan akses personal.
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
                            className='mt-4 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-60 dark:border-red-900/60 dark:bg-slate-900 dark:text-red-300 dark:hover:bg-red-950/40'
                        >
                            {deleteLoading ? t('common.saving') : 'Hapus Akun'}
                        </button>
                    </div>
                </div>
            </Section>
            <Footer />
        </main>
    );
};

export default ProfilePage;
