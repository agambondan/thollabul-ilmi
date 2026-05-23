'use client';

import BookmarkButton from '@/components/BookmarkButton';
import NoteButton from '@/components/NoteButton';
import { PopUpIsCopied, ShareAyah } from '@/components/popup/ListImage';
import { audioApi, mufrodatApi, munasabahApi, tafsirApi } from '@/lib/api';
import { useLocale } from '@/context/Locale';
import { listMasjidImage } from '@/lib/const';
import { NumberToArabic } from '@/lib/converter';
import { CopyImageToClipboard, CopyToClipboard } from '@/lib/copy';
import { getLocalizedTranslation } from '@/lib/translation';
import { useActionPosition } from '@/lib/useActionPosition';
import { useQuranFont } from '@/lib/useQuranFont';
import classNames from 'classnames';
import { useEffect, useRef, useState } from 'react';
import {
    BsBook,
    BsFileEarmarkPlay,
    BsLink45Deg,
    BsPauseFill,
    BsPlayFill,
    BsShare,
    BsThreeDotsVertical,
    BsTranslate,
} from 'react-icons/bs';
import { IoIosLink, IoMdCopy, IoMdImages } from 'react-icons/io';

const AyahPage = ({ surah, ayah, newLimit, isLast, hafalanMode = 'off', selectedQari, onQariChange }) => {
    const { t, lang } = useLocale();
    const { fontCls } = useQuranFont();
    const { isMenu: actionsMenu } = useActionPosition();
    const cardRef = useRef();
    const audioRef = useRef(null);
    const [isCopied, SetIsCopied] = useState(false);
    const [settingPopUp, SetSettingPopUp] = useState(false);
    const [clipboardPopUp, SetClipboardPopUp] = useState(false);
    const [shareImagePopUp, SetShareImagePopUp] = useState(false);

    const [tafsirOpen, setTafsirOpen] = useState(false);
    const [tafsir, setTafsir] = useState(null);
    const [tafsirLoading, setTafsirLoading] = useState(false);

    const [mufrodatOpen, setMufrodatOpen] = useState(false);
    const [mufrodat, setMufrodat] = useState(null);
    const [mufrodatLoading, setMufrodatLoading] = useState(false);

    const [munasabahOpen, setMunasabahOpen] = useState(false);
    const [munasabah, setMunasabah] = useState(null);
    const [munasabahLoading, setMunasabahLoading] = useState(false);

    const [audioUrls, setAudioUrls] = useState([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioLoading, setAudioLoading] = useState(false);
    const [showQariMenu, setShowQariMenu] = useState(false);
    const [revealed, setRevealed] = useState(false);
    const ayahTranslation = getLocalizedTranslation(ayah.translation, lang);

    const hideArabic = hafalanMode === 'hide_arabic' && !revealed;
    const hideTranslation = hafalanMode === 'hide_translation' && !revealed;
    const hideAll = hafalanMode === 'hide_all' && !revealed;

    const copyText = (value) => {
        CopyToClipboard(value);
        SetClipboardPopUp(true);
        setTimeout(() => SetClipboardPopUp(false), 2000);
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
            if (audioRef.current) {
                audioRef.current.pause();
            }
        };
    }, []);

    const toggleTafsir = () => {
        if (!tafsirOpen && !tafsir) {
            setTafsirLoading(true);
            tafsirApi
                .byAyah(ayah.id)
                .then((r) => r.json())
                .then((data) => setTafsir(data?.items ?? data ?? []))
                .catch(() => setTafsir([]))
                .finally(() => setTafsirLoading(false));
        }
        setTafsirOpen((v) => !v);
    };

    const toggleMufrodat = () => {
        if (!mufrodatOpen && !mufrodat) {
            setMufrodatLoading(true);
            mufrodatApi
                .byAyah(ayah.id)
                .then((r) => r.json())
                .then((data) => setMufrodat(data?.items ?? data ?? []))
                .catch(() => setMufrodat([]))
                .finally(() => setMufrodatLoading(false));
        }
        setMufrodatOpen((v) => !v);
    };

    const toggleMunasabah = () => {
        if (!munasabahOpen && !munasabah) {
            setMunasabahLoading(true);
            munasabahApi
                .byAyah(ayah.id)
                .then((r) => r.json())
                .then((data) => setMunasabah(data?.items ?? []))
                .catch(() => setMunasabah([]))
                .finally(() => setMunasabahLoading(false));
        }
        setMunasabahOpen((v) => !v);
    };

    const pickQariUrl = (urls) => {
        if (!Array.isArray(urls) || urls.length === 0) return null;
        if (selectedQari) {
            const match = urls.find((u) => u.qari_slug === selectedQari);
            if (match) return match;
        }
        return urls[0];
    };

    const handleAudio = async () => {
        if (isPlaying) {
            audioRef.current?.pause();
            setIsPlaying(false);
            return;
        }

        if (audioUrls.length === 0) {
            setAudioLoading(true);
            try {
                const res = await audioApi.byAyah(ayah.id);
                const data = await res.json();
                const urls = data?.items ?? data ?? [];
                setAudioUrls(urls);
                const chosen = pickQariUrl(urls);
                if (chosen) playAudio(chosen.audio_url);
            } catch {
            } finally {
                setAudioLoading(false);
            }
        } else {
            const chosen = pickQariUrl(audioUrls);
            if (chosen) playAudio(chosen.audio_url);
        }
    };

    const switchQari = (slug) => {
        if (onQariChange) onQariChange(slug);
        setShowQariMenu(false);
        if (audioRef.current && isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        }
    };

    const playAudio = (url) => {
        if (!url) return;
        if (!audioRef.current) {
            audioRef.current = new Audio(url);
            audioRef.current.onended = () => setIsPlaying(false);
        } else {
            audioRef.current.src = url;
        }
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    };

    return (
        <div ref={cardRef} id={`ayah-${ayah.number}`}>
            {clipboardPopUp && (
                <div className='fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-full shadow-lg'>
                    {t('ayah.copied_to_clipboard')}
                </div>
            )}
            {shareImagePopUp && (
                <ShareAyah
                    images={listMasjidImage}
                    isCopiedCallback={() => SetShareImagePopUp(false)}
                    text={`Allah Subhanahu Wa Ta'ala berfirman:\n`
                        .concat(`${ayah.translation.ar} `)
                        .concat(`۝${NumberToArabic(ayah.number)}\n`)
                        .concat(`${ayah.translation.latin_idn}\n`)
                        .concat(`${ayahTranslation}\n`)
                        .concat(
                            `(QS. ${surah.translation.latin_en} ${surah.number}: ${t('common.verse')} ${ayah.number})\n`.concat(
                                `Via Thullaabul 'Ilmi ${window.location.href.split('#')[0]}#ayah-${ayah.number}`
                            )
                        )}
                />
            )}

            <ul
                className={classNames({
                    'flex flex-row justify-between p-4 border-b border-gray-100 dark:border-slate-800': true,
                    'bg-gray-50/60 dark:bg-slate-800/35': ayah.number % 2 === 1,
                    'bg-white dark:bg-slate-900': ayah.number % 2 === 0,
                    'text-gray-900 dark:text-white': true,
                })}
            >
                <ul
                    className='flex flex-col p-2 space-y-1'
                    style={{ direction: 'ltr' }}
                >
                    <li className='flex justify-center text-sm font-medium text-gray-500 dark:text-gray-400 pb-1'>
                        {surah.number}:{ayah.number}
                    </li>
                    <li className={actionsMenu ? 'hidden' : 'flex justify-center'}>
                        <button
                            title={isPlaying ? 'Pause' : 'Putar Audio'}
                            onClick={handleAudio}
                            disabled={audioLoading}
                            className={`p-2 rounded-lg text-lg transition-colors disabled:opacity-50 ${
                                isPlaying
                                    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
                                    : 'text-gray-400 dark:text-gray-500 hover:bg-emerald-100 dark:hover:bg-slate-700'
                            }`}
                        >
                            {audioLoading ? (
                                <span className='text-xs'>...</span>
                            ) : isPlaying ? (
                                <BsPauseFill />
                            ) : (
                                <BsFileEarmarkPlay />
                            )}
                        </button>
                    </li>
                    <li className={actionsMenu ? 'hidden' : 'flex justify-center'}>
                        <button
                            title={t('tafsir.title')}
                            onClick={toggleTafsir}
                            className={`p-2 rounded-lg text-lg transition-colors ${
                                tafsirOpen
                                    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
                                    : 'text-gray-400 dark:text-gray-500 hover:bg-emerald-100 dark:hover:bg-slate-700'
                            }`}
                        >
                            <BsBook />
                        </button>
                    </li>
                    <li className={actionsMenu ? 'hidden' : 'flex justify-center'}>
                        <button
                            title={t('ayah.mufrodat_title')}
                            onClick={toggleMufrodat}
                            className={`p-2 rounded-lg text-lg transition-colors ${
                                mufrodatOpen
                                    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
                                    : 'text-gray-400 dark:text-gray-500 hover:bg-emerald-100 dark:hover:bg-slate-700'
                            }`}
                        >
                            <BsTranslate />
                        </button>
                    </li>
                    <li className={actionsMenu ? 'hidden' : 'flex justify-center'}>
                        <button
                            title={t('munasabah.title') ?? 'Ayat Terkait'}
                            onClick={toggleMunasabah}
                            className={`p-2 rounded-lg text-lg transition-colors ${
                                munasabahOpen
                                    ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20'
                                    : 'text-gray-400 dark:text-gray-500 hover:bg-purple-100 dark:hover:bg-slate-700'
                            }`}
                        >
                            <BsLink45Deg />
                        </button>
                    </li>
                    <li className={actionsMenu ? 'hidden' : 'flex justify-center'}>
                        <BookmarkButton refType='ayah' refId={ayah.id} />
                    </li>
                    <li className={actionsMenu ? 'hidden' : 'flex justify-center'}>
                        <NoteButton refType='ayah' refId={ayah.id} />
                    </li>
                    <li className={actionsMenu ? 'hidden' : 'flex justify-center'}>
                        <button
                            title={t('common.share')}
                            onClick={() => SetShareImagePopUp(true)}
                            className='p-2 rounded-lg text-lg hover:bg-emerald-100 dark:hover:bg-slate-700 transition-colors'
                        >
                            <BsShare />
                        </button>
                    </li>
                    <li className='flex justify-center relative'>
                        <button
                            title={t('common.more')}
                            onClick={() => SetSettingPopUp(!settingPopUp)}
                            className='p-2 rounded-lg text-lg hover:bg-emerald-100 dark:hover:bg-slate-700 transition-colors'
                        >
                            <BsThreeDotsVertical />
                        </button>
                        {settingPopUp && (
                            <div className='absolute left-9 top-0 z-10'>
                                <div className='flex flex-col bg-white dark:bg-slate-800 border border-emerald-100 dark:border-slate-700 rounded-xl w-56 p-1 shadow-lg text-emerald-900 dark:text-white'>
                                    {actionsMenu && (
                                        <div className='border-b border-emerald-50 dark:border-slate-700 pb-1 mb-1'>
                                            <button
                                                className={actionMenuButtonClass}
                                                onClick={() => {
                                                    handleAudio();
                                                    SetSettingPopUp(false);
                                                }}
                                                disabled={audioLoading}
                                            >
                                                {isPlaying ? <BsPauseFill /> : <BsFileEarmarkPlay />}
                                                {audioLoading ? 'Memuat audio...' : isPlaying ? 'Pause Audio' : 'Putar Audio'}
                                            </button>
                                            <button
                                                className={actionMenuButtonClass}
                                                onClick={() => {
                                                    toggleTafsir();
                                                    SetSettingPopUp(false);
                                                }}
                                            >
                                                <BsBook />
                                                {t('tafsir.title')}
                                            </button>
                                            <button
                                                className={actionMenuButtonClass}
                                                onClick={() => {
                                                    toggleMufrodat();
                                                    SetSettingPopUp(false);
                                                }}
                                            >
                                                <BsTranslate />
                                                {t('ayah.mufrodat_title')}
                                            </button>
                                            <button
                                                className={actionMenuButtonClass}
                                                onClick={() => {
                                                    toggleMunasabah();
                                                    SetSettingPopUp(false);
                                                }}
                                            >
                                                <BsLink45Deg />
                                                {t('munasabah.title') ?? 'Ayat Terkait'}
                                            </button>
                                            <div className='flex items-center justify-between gap-3 px-3 py-2 text-sm rounded-lg hover:bg-emerald-50 dark:hover:bg-slate-700 transition-colors'>
                                                <span>Bookmark</span>
                                                <BookmarkButton refType='ayah' refId={ayah.id} />
                                            </div>
                                            <div className='flex items-center justify-between gap-3 px-3 py-2 text-sm rounded-lg hover:bg-emerald-50 dark:hover:bg-slate-700 transition-colors'>
                                                <span>Catatan</span>
                                                <NoteButton refType='ayah' refId={ayah.id} />
                                            </div>
                                            <button
                                                className={actionMenuButtonClass}
                                                onClick={() => {
                                                    SetShareImagePopUp(true);
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
                                        onClick={() =>
                                            copyText(`${window.location.href.split('#')[0]}#ayah-${ayah.number}`)
                                        }
                                    >
                                        <IoIosLink />
                                        Copy Link
                                    </button>
                                    <button
                                        className={actionMenuButtonClass}
                                        onClick={() => {
                                            SetSettingPopUp(false);
                                            setTimeout(() => {
                                                import('html2canvas')
                                                    .then(({ default: html2canvas }) =>
                                                        html2canvas(
                                                            document.getElementById(
                                                                `${surah.translation.latin_en}-${ayah.number}`
                                                            )
                                                        )
                                                    )
                                                    .then((canvas) => {
                                                        CopyImageToClipboard(canvas);
                                                        SetIsCopied(true);
                                                        setTimeout(() => SetIsCopied(false), 1000);
                                                    });
                                            }, 1000);
                                        }}
                                    >
                                        <IoMdImages />
                                        Copy Image
                                    </button>
                                    <button
                                        className={actionMenuButtonClass}
                                        onClick={() =>
                                            copyText(
                                                `Allah Subhanahu Wa Ta'ala berfirman:\n\n`
                                                    .concat(`${ayah.translation.ar}\n\n`)
                                                    .concat(`${ayah.translation.latin_idn}\n\n`)
                                                    .concat(`${ayahTranslation}\n\n`)
                                                    .concat(
                                                        `(QS. ${surah.translation.latin_en} ${surah.number}: ${t('common.verse')} ${ayah.number})\n`.concat(
                                                            `Via Thullaabul 'Ilmi ${window.location.href.split('#')[0]}#ayah-${ayah.number}`
                                                        )
                                                    )
                                            )
                                        }
                                    >
                                        <IoMdCopy />
                                        Copy Ayah
                                    </button>
                                </div>
                            </div>
                        )}
                    </li>
                </ul>

                <ul className={`flex flex-col w-full justify-center ${fontCls}`} style={{ direction: 'rtl' }}>
                    <li
                        style={{ fontSize: '200%', lineHeight: '2.10' }}
                        className={hideArabic || hideAll ? 'blur-sm select-none' : ''}
                        dangerouslySetInnerHTML={{
                            __html: (
                                ayah.translation.ar_html ?? ayah.translation.ar
                            ).concat(`&nbsp;<span class="font-kitab">&#x06DD;${NumberToArabic(ayah.number)}</span>`),
                        }}
                    />
                    {ayah.translation.latin_idn && (
                        <li
                            className={`text-left p-2 text-sm text-gray-500 dark:text-gray-400 italic ${hideTranslation || hideAll ? 'blur-sm select-none' : ''}`}
                            style={{ direction: 'ltr' }}
                        >
                            {ayah.translation.latin_idn}
                        </li>
                    )}
                    <li
                        className={`text-left p-2 ${hideTranslation || hideAll ? 'blur-sm select-none' : ''}`}
                        style={{ direction: 'ltr' }}
                    >
                        {ayahTranslation}
                    </li>
                    {hafalanMode !== 'off' && (
                        <li className='px-2 pb-2' style={{ direction: 'ltr' }}>
                            <button
                                type='button'
                                onClick={() => setRevealed((v) => !v)}
                                className='text-xs px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors'
                            >
                                {revealed
                                    ? t('hafalan.hide_again') ?? 'Sembunyikan lagi'
                                    : t('hafalan.reveal') ?? 'Tampilkan'}
                            </button>
                        </li>
                    )}
                </ul>
            </ul>

            {audioUrls.length > 1 && (
                <div className='border-b border-gray-100 dark:border-slate-800 px-4 py-2 flex items-center gap-2 flex-wrap text-xs'>
                    <span className='text-gray-500 dark:text-gray-400'>
                        {t('ayah.qari') ?? 'Qari'}:
                    </span>
                    {audioUrls.map((u) => (
                        <button
                            key={u.qari_slug}
                            type='button'
                            onClick={() => switchQari(u.qari_slug)}
                            className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
                                (selectedQari ?? audioUrls[0].qari_slug) === u.qari_slug
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                            }`}
                        >
                            {u.qari_name}
                        </button>
                    ))}
                </div>
            )}

            {tafsirOpen && (
                <div className='bg-amber-50 dark:bg-amber-900/10 border-b border-amber-100 dark:border-amber-900/30 px-4 py-4'>
                    <p className='text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-3'>
                        {t('ayah.tafsir_label')} {surah.number}:{ayah.number}
                    </p>
                    {tafsirLoading && (
                        <p className='text-sm text-gray-400 dark:text-gray-500'>{t('ayah.loading_tafsir')}</p>
                    )}
                    {!tafsirLoading && Array.isArray(tafsir) && tafsir.length === 0 && (
                        <p className='text-sm text-gray-500 dark:text-gray-400 italic'>
                            {t('ayah.tafsir_empty')}
                        </p>
                    )}
                    {!tafsirLoading &&
                        Array.isArray(tafsir) &&
                        tafsir.map((entry, i) => (
                            <div key={i} className='mb-4 last:mb-0'>
                                {entry.source && (
                                    <p className='text-xs font-medium text-amber-600 dark:text-amber-400 mb-1'>
                                        {entry.source}
                                    </p>
                                )}
                                <p className='text-sm text-gray-700 dark:text-gray-300 leading-relaxed'>
                                    {entry.text ?? entry.content}
                                </p>
                            </div>
                        ))}
                </div>
            )}

            {mufrodatOpen && (
                <div className='bg-sky-50 dark:bg-sky-900/10 border-b border-sky-100 dark:border-sky-900/30 px-4 py-4'>
                    <p className='text-xs font-semibold text-sky-700 dark:text-sky-400 uppercase tracking-wide mb-3'>
                        {t('ayah.mufrodat_label')} {surah.number}:{ayah.number}
                    </p>
                    {mufrodatLoading && (
                        <p className='text-sm text-gray-400 dark:text-gray-500'>{t('ayah.loading_mufrodat')}</p>
                    )}
                    {!mufrodatLoading && Array.isArray(mufrodat) && mufrodat.length === 0 && (
                        <p className='text-sm text-gray-500 dark:text-gray-400 italic'>
                            {t('ayah.mufrodat_empty')}
                        </p>
                    )}
                    {!mufrodatLoading && Array.isArray(mufrodat) && (
                        <div className='flex flex-wrap gap-2' style={{ direction: 'rtl' }}>
                            {mufrodat.map((word, i) => (
                                <div
                                    key={i}
                                    className='text-center bg-white dark:bg-slate-800 rounded-lg border border-sky-100 dark:border-slate-700 px-3 py-2 min-w-[60px]'
                                >
                                    <p
                                        className='text-lg font-bold text-emerald-900 dark:text-white mb-0.5'
                                        style={{ fontFamily: 'Amiri, serif' }}
                                    >
                                        {word.arabic}
                                    </p>
                                    {word.transliteration && (
                                        <p className='text-xs italic text-gray-400 dark:text-gray-500 mb-0.5'>
                                            {word.transliteration}
                                        </p>
                                    )}
                                    <p className='text-xs text-gray-600 dark:text-gray-300'>
                                        {word.indonesian ?? word.meaning}
                                    </p>
                                    {word.root_word && (
                                        <p className='text-xs text-sky-500 dark:text-sky-400 mt-0.5'>
                                            {word.root_word}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {munasabahOpen && (
                <div className='bg-purple-50 dark:bg-purple-900/10 border-b border-purple-100 dark:border-purple-900/30 px-4 py-4'>
                    <p className='text-xs font-semibold text-purple-700 dark:text-purple-400 uppercase tracking-wide mb-3'>
                        {t('munasabah.title') ?? 'Ayat Terkait'} {surah.number}:{ayah.number}
                    </p>
                    {munasabahLoading && (
                        <p className='text-sm text-gray-400 dark:text-gray-500'>{t('ayah.loading_tafsir') ?? 'Memuat...'}</p>
                    )}
                    {!munasabahLoading && Array.isArray(munasabah) && munasabah.length === 0 && (
                        <p className='text-sm text-gray-500 dark:text-gray-400 italic'>
                            {t('munasabah.empty') ?? 'Belum ada ayat terkait.'}
                        </p>
                    )}
                    {!munasabahLoading && Array.isArray(munasabah) && munasabah.map((m, i) => (
                        <div key={i} className='mb-3 last:mb-0 bg-white dark:bg-slate-800 rounded-lg p-3'>
                            <p className='text-xs text-purple-600 dark:text-purple-400 font-medium mb-1'>
                                {m.ayah_from?.surah?.translation?.latin_en ?? `QS ${m.ayah_from?.surah?.number}:${m.ayah_from?.number}`} ↔ {m.ayah_to?.surah?.translation?.latin_en ?? `QS ${m.ayah_to?.surah?.number}:${m.ayah_to?.number}`}
                            </p>
                            <p className='text-sm text-gray-700 dark:text-gray-300'>{m.description}</p>
                        </div>
                    ))}
                </div>
            )}

            {isCopied && <PopUpIsCopied />}
        </div>
    );
};

export default AyahPage;
