'use client';

import BookmarkButton from '@/components/BookmarkButton';
import GradeBadge, { HadithAuthenticity } from '@/components/GradeBadge';
import { PopUpIsCopied, ShareAyah } from '@/components/popup/ListImage';
import { useLocale } from '@/context/Locale';
import { listMasjidImage } from '@/lib/const';
import { CopyImageToClipboard, CopyToClipboard } from '@/lib/copy';
import { getLocalizedTranslation } from '@/lib/translation';
import { useActionPosition } from '@/lib/useActionPosition';
import classNames from 'classnames';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
    BsFileEarmarkPlay,
    BsPauseFill,
    BsShare,
    BsThreeDotsVertical,
} from 'react-icons/bs';
import { IoIosLink, IoMdCopy, IoMdImages } from 'react-icons/io';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

function SanadPanel({ hadithId }) {
    const { t } = useLocale();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${API_URL}/api/v1/hadiths/${hadithId}/sanad`)
            .then((r) => r.json())
            .then((d) => setData(Array.isArray(d?.items ?? d) ? (d?.items ?? d) : []))
            .catch(() => setData([]))
            .finally(() => setLoading(false));
    }, [hadithId]);

    if (loading)
        return <p className='text-xs text-gray-400 dark:text-gray-500 py-2'>...</p>;
    if (!data?.length)
        return (
            <p className='text-xs text-gray-400 dark:text-gray-500 py-2'>
                {t('hadith.sanad_empty')}
            </p>
        );

    return (
        <div className='space-y-3'>
            {data.map((sanad, i) => (
                <div key={sanad.id ?? i} className='text-sm'>
                    {sanad.keterangan && (
                        <p className='text-xs text-gray-500 dark:text-gray-400 mb-1.5 italic'>
                            {sanad.keterangan}
                        </p>
                    )}
                    <div className='flex flex-wrap items-start gap-1'>
                        {(sanad.mata_sanad ?? []).map((ms, idx, arr) => (
                            <span key={ms.id ?? idx} className='flex items-center gap-1'>
                                <span className='inline-flex flex-col items-center gap-0.5'>
                                    <span className='px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded text-xs font-medium'>
                                        {ms.perawi?.nama_latin ?? `Perawi ${idx + 1}`}
                                    </span>
                                    {ms.metode && (
                                        <span className='text-[10px] text-gray-400 dark:text-gray-500'>
                                            {ms.metode}
                                        </span>
                                    )}
                                </span>
                                {idx < arr.length - 1 && (
                                    <span className='text-gray-400 dark:text-gray-500 text-sm'>
                                        ←
                                    </span>
                                )}
                            </span>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

function TakhrijPanel({ hadithId }) {
    const { t, lang } = useLocale();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${API_URL}/api/v1/hadiths/${hadithId}/takhrij`)
            .then((r) => r.json())
            .then((d) => setData(Array.isArray(d?.items ?? d) ? (d?.items ?? d) : []))
            .catch(() => setData([]))
            .finally(() => setLoading(false));
    }, [hadithId]);

    if (loading)
        return <p className='text-xs text-gray-400 dark:text-gray-500 py-2'>...</p>;
    if (!data?.length)
        return (
            <p className='text-xs text-gray-400 dark:text-gray-500 py-2'>
                {t('hadith.takhrij_empty')}
            </p>
        );

    return (
        <div className='flex flex-wrap gap-2'>
            {data.map((tk, i) => {
                const translations = tk.book?.translation ?? [];
                const bookName =
                    (Array.isArray(translations)
                        ? translations.find((tr) => tr.lang?.toUpperCase() === lang?.toUpperCase())?.name
                        : null) ||
                    tk.book?.slug ||
                    'Kitab';
                return (
                    <span
                        key={tk.id ?? i}
                        className='inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 rounded-lg text-xs font-medium'
                    >
                        {bookName}
                        {tk.nomor_hadis_kitab && (
                            <span className='bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-200 px-1.5 py-0.5 rounded text-[10px]'>
                                #{tk.nomor_hadis_kitab}
                            </span>
                        )}
                    </span>
                );
            })}
        </div>
    );
}

const HadithPage = ({ params, hadith, book, newLimit, isLast, basePath = '/hadith' }) => {
    const { t, lang } = useLocale();
    const { isHidden: actionsHidden, isMenu: actionsMenu } = useActionPosition();
    const cardRef = useRef();
    const audioRef = useRef(null);
    const [isCopied, SetIsCopied] = useState(false);
    const [settingPopUp, SetSettingPopUp] = useState(false);
    const [clipboardPopUp, SetClipboardPopUp] = useState(false);
    const [shareImagePopUp, SetShareImagePopUp] = useState(false);
    const [isPlayingAudio, setIsPlayingAudio] = useState(false);
    const [audioLoading, setAudioLoading] = useState(false);
    const [statusMsg, SetStatusMsg] = useState('');
    const [showSanad, setShowSanad] = useState(false);
    const [showTakhrij, setShowTakhrij] = useState(false);

    const audioSources = (hadith?.media ?? [])
        .map((entry) => entry?.multimedia?.url)
        .filter(Boolean);
    const firstAudioSource = audioSources[0] ?? '';
    const hadithTranslation = getLocalizedTranslation(hadith.translation, lang);
    const detailPath = hadith?.number ? `${basePath}/${params.slug}/${hadith.number}` : '';
    const detailUrl = () => {
        if (!detailPath || typeof window === 'undefined') return '';
        return `${window.location.origin}${detailPath}`;
    };

    const toggleSettingPopUp = () => {
        SetSettingPopUp(!settingPopUp);
    };

    const toggleShareImagePopUp = () => {
        SetShareImagePopUp(!shareImagePopUp);
    };

    const showStatus = (message) => {
        SetStatusMsg(message);
        setTimeout(() => SetStatusMsg(''), 2200);
    };

    const stopAudio = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        setIsPlayingAudio(false);
    };

    const playAudio = async (url) => {
        if (!url) {
            showStatus(t('hadith.audio_unavailable'));
            return;
        }

        if (!audioRef.current) {
            audioRef.current = new Audio(url);
            audioRef.current.onended = () => setIsPlayingAudio(false);
        } else {
            audioRef.current.src = url;
        }

        try {
            await audioRef.current.play();
            setIsPlayingAudio(true);
        } catch {
            setIsPlayingAudio(false);
            showStatus(t('hadith.audio_play_error'));
        }
    };

    const handleAudio = async () => {
        if (!firstAudioSource) {
            showStatus(t('hadith.audio_unavailable'));
            return;
        }

        if (isPlayingAudio) {
            stopAudio();
            return;
        }

        setAudioLoading(true);
        try {
            await playAudio(firstAudioSource);
        } finally {
            setAudioLoading(false);
        }
    };

    const copyText = (value) => {
        CopyToClipboard(value);
        SetClipboardPopUp(true);
        setTimeout(() => {
            SetClipboardPopUp(false);
        }, 2000);
    };

    const actionMenuButtonClass =
        'flex w-full items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-emerald-50 dark:hover:bg-slate-700 transition-colors text-left';

    useEffect(() => {
        if (!cardRef?.current) return;

        const observer = new IntersectionObserver(([entry]) => {
            if (isLast && entry.isIntersecting) {
                newLimit();
                observer.unobserve(entry.target);
            }
        });

        observer.observe(cardRef.current);
    }, [isLast, newLimit]);

    useEffect(() => {
        return () => {
            stopAudio();
        };
    }, []);

    return (
        <>
            {clipboardPopUp && (
                <div className='fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-full shadow-lg'>
                    Tersalin ke clipboard!
                </div>
            )}
            {statusMsg && (
                <div className='fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-700 text-white text-sm font-medium px-4 py-2 rounded-full shadow-lg'>
                    {statusMsg}
                </div>
            )}
            {shareImagePopUp ? (
                <ShareAyah
                    images={listMasjidImage}
                    isCopiedCallback={toggleShareImagePopUp}
                    text={`${hadith.translation.ar}\n`
                        .concat(`${hadithTranslation}\n`)
                        .concat(
	                            `(HR. ${params.slug}: ${hadith.number})\n`.concat(
	                                `Via Thullaabul 'Ilmi ${detailUrl() || window.location.href}`
	                            )
	                        )}
                />
            ) : (
                ''
            )}
            <ul
                id={`${params.slug}-${hadith.number}`}
                className={classNames({
                    'flex flex-row justify-between font-kitab p-4 border-b border-emerald-100 dark:border-slate-700': true,
                    'bg-parchment-50 dark:bg-slate-800': hadith.number % 2 === 1,
                    'bg-white dark:bg-slate-900': hadith.number % 2 === 0,
                    'text-emerald-900 dark:text-white': true,
                })}
                ref={cardRef}
            >
                {!actionsHidden && (
                <ul className='flex flex-col p-2 space-y-1' style={{ direction: 'ltr' }}>
                    <li className='flex justify-center text-sm font-medium text-gray-500 dark:text-gray-400 pb-1'>
                        {book.slug}:{hadith.number}
                    </li>
	                    {hadith.grade && (
	                        <li className='flex justify-center'>
	                            <GradeBadge grade={hadith.grade} />
	                        </li>
	                    )}
	                    {detailPath && (
	                        <li className={actionsMenu ? 'hidden' : 'flex justify-center'}>
	                            <Link
	                                href={detailPath}
	                                title='Buka halaman detail'
	                                className='p-2 rounded-lg text-lg hover:bg-emerald-100 dark:hover:bg-slate-700 transition-colors'
	                            >
	                                <IoIosLink />
	                            </Link>
	                        </li>
	                    )}
	                    <li className={actionsMenu ? 'hidden' : 'flex justify-center'}>
	                        <button
                            title={
                                firstAudioSource
                                    ? isPlayingAudio
                                        ? 'Pause Audio'
                                        : 'Putar Audio'
                                    : 'Audio belum tersedia'
                            }
                            onClick={handleAudio}
                            disabled={audioLoading}
                            className={classNames(
                                'p-2 rounded-lg text-lg transition-colors disabled:opacity-50',
                                firstAudioSource
                                    ? isPlayingAudio
                                        ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
                                        : 'text-gray-400 dark:text-gray-500 hover:bg-emerald-100 dark:hover:bg-slate-700'
                                    : 'text-gray-300 dark:text-gray-600 hover:bg-emerald-50 dark:hover:bg-slate-800'
                            )}
                        >
                            {audioLoading ? (
                                <span className='text-[10px]'>...</span>
                            ) : isPlayingAudio ? (
                                <BsPauseFill />
                            ) : (
                                <BsFileEarmarkPlay />
                            )}
                        </button>
                    </li>
                    <li className={actionsMenu ? 'hidden' : 'flex justify-center'}>
                        <BookmarkButton refType='hadith' refId={hadith.id} />
                    </li>
                    <li className={actionsMenu ? 'hidden' : 'flex justify-center'}>
                        <button
                            title={t('common.share')}
                            onClick={toggleShareImagePopUp}
                            className='p-2 rounded-lg text-lg hover:bg-emerald-100 dark:hover:bg-slate-700 transition-colors'
                        >
                            <BsShare />
                        </button>
                    </li>
                    <li className='flex justify-center relative'>
                        <button
                            title={t('common.more')}
                            onClick={toggleSettingPopUp}
                            className='p-2 rounded-lg text-lg hover:bg-emerald-100 dark:hover:bg-slate-700 transition-colors'
                        >
                            <BsThreeDotsVertical />
                        </button>
                        {settingPopUp ? (
                            <div className='absolute left-9 top-0 z-10'>
                                <div className='flex flex-col bg-white dark:bg-slate-800 border border-emerald-100 dark:border-slate-700 rounded-xl w-56 p-1 shadow-lg text-emerald-900 dark:text-white'>
                                    {actionsMenu && (
                                        <div className='border-b border-emerald-50 dark:border-slate-700 pb-1 mb-1'>
                                            {detailPath && (
                                                <Link
                                                    href={detailPath}
                                                    className={actionMenuButtonClass}
                                                    onClick={() => SetSettingPopUp(false)}
                                                >
                                                    <IoIosLink />
                                                    Buka Detail
                                                </Link>
                                            )}
                                            <button
                                                className={actionMenuButtonClass}
                                                onClick={() => {
                                                    handleAudio();
                                                    SetSettingPopUp(false);
                                                }}
                                                disabled={audioLoading}
                                            >
                                                {isPlayingAudio ? <BsPauseFill /> : <BsFileEarmarkPlay />}
                                                {audioLoading
                                                    ? 'Memuat audio...'
                                                    : isPlayingAudio
                                                        ? 'Pause Audio'
                                                        : 'Putar Audio'}
                                            </button>
                                            <div className='flex items-center justify-between gap-3 px-3 py-2 text-sm rounded-lg hover:bg-emerald-50 dark:hover:bg-slate-700 transition-colors'>
                                                <span>Bookmark</span>
                                                <BookmarkButton refType='hadith' refId={hadith.id} />
                                            </div>
                                            <button
                                                className={actionMenuButtonClass}
                                                onClick={() => {
                                                    toggleShareImagePopUp();
                                                    SetSettingPopUp(false);
                                                }}
                                            >
                                                <BsShare />
                                                {t('common.share')}
                                            </button>
                                        </div>
                                    )}
                                    <button
                                        className={actionMenuButtonClass}
	                                        onClick={() => {
	                                            copyText(detailUrl() || `${window.location.href}#${params.slug}-${hadith.number}`);
	                                        }}
                                    >
                                        <IoIosLink />
                                        Copy Link
                                    </button>
                                    <button
                                        className={actionMenuButtonClass}
                                        onClick={() => {
                                            SetSettingPopUp(false);
                                            setTimeout(async () => {
                                                const { default: html2canvas } = await import('html2canvas');
                                                html2canvas(
                                                    document.getElementById(
                                                        `${params.slug}-${hadith.number}`
                                                    )
                                                ).then((canvas) => {
                                                    CopyImageToClipboard(canvas);
                                                    SetIsCopied(true);
                                                    setTimeout(() => {
                                                        SetIsCopied(false);
                                                    }, 1000);
                                                });
                                            }, 1000);
                                        }}
                                    >
                                        <IoMdImages />
                                        Copy Image
                                    </button>
                                    <button
                                        className={actionMenuButtonClass}
                                        onClick={() => {
                                            copyText(
                                                `${hadith.translation.ar}\n`
                                                    .concat(
                                                        `${hadithTranslation}\n`
                                                    )
                                                    .concat(
	                                                        `(HR. ${params.slug}: ${hadith.number})\n`.concat(
	                                                            `Via Thullaabul 'Ilmi ${detailUrl() || window.location.href}`
	                                                        )
                                                    )
                                            );
                                        }}
                                    >
                                        <IoMdCopy />
                                        Copy Text
                                    </button>
                                </div>
                            </div>
                        ) : (
                            ''
                        )}
                    </li>
                </ul>
                )}
                <ul
                    className='flex flex-col w-full justify-center'
                    style={{ direction: 'rtl' }}
                >
                    <li className='text-[200%] leading-[2.25]'>{hadith.translation.ar}</li>
                    <li
                        className='text-left p-2 text-base'
                        style={{ direction: 'ltr' }}
                    >
                        {hadithTranslation}
                    </li>
                </ul>
            </ul>
            {(hadith.grade ||
                hadith.shahih_by ||
                hadith.dhaif_by ||
                hadith.grade_notes ||
                hadith.sanad) && (
                <div className='px-4 pt-3 pb-1'>
                    <HadithAuthenticity hadith={hadith} />
                </div>
            )}
            <p className='px-4 pt-2 text-[11px] text-gray-400 dark:text-gray-500 text-center'>
                Audio diputar bila media hadith tersedia. Tafsir hadith masih dalam tahap persiapan.
            </p>
            <div className='px-4 pt-2 pb-1 flex gap-2 flex-wrap'>
                <button
                    type='button'
                    onClick={() => setShowSanad((v) => !v)}
                    className={classNames(
                        'text-xs px-3 py-1 rounded-full border transition-colors',
                        showSanad
                            ? 'bg-emerald-600 dark:bg-emerald-700 text-white border-emerald-600 dark:border-emerald-700'
                            : 'text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                    )}
                >
                    {t('hadith.sanad')}
                </button>
                <button
                    type='button'
                    onClick={() => setShowTakhrij((v) => !v)}
                    className={classNames(
                        'text-xs px-3 py-1 rounded-full border transition-colors',
                        showTakhrij
                            ? 'bg-amber-500 dark:bg-amber-600 text-white border-amber-500 dark:border-amber-600'
                            : 'text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                    )}
                >
                    {t('hadith.takhrij')}
                </button>
            </div>
            {showSanad && (
                <div className='px-4 pb-3'>
                    <p className='text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2'>
                        {t('hadith.sanad')}
                    </p>
                    <SanadPanel hadithId={hadith.id} />
                </div>
            )}
            {showTakhrij && (
                <div className='px-4 pb-3'>
                    <p className='text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2'>
                        {t('hadith.takhrij')}
                    </p>
                    <TakhrijPanel hadithId={hadith.id} />
                </div>
            )}
            {isCopied ? <PopUpIsCopied /> : <></>}
        </>
    );
};

export default HadithPage;
