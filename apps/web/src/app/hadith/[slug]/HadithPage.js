"use client";

import BookmarkButton from "@/components/BookmarkButton";
import GradeBadge, { HadithAuthenticity } from "@/components/GradeBadge";
import { PopUpIsCopied, ShareAyah } from "@/components/popup/ListImage";
import { useLocale } from "@/context/Locale";
import { listMasjidImage } from "@/lib/const";
import { CopyImageToClipboard, CopyToClipboard } from "@/lib/copy";
import { getLocalizedTranslation } from "@/lib/translation";
import { useActionPosition } from "@/lib/useActionPosition";
import { useQuranFont } from "@/lib/useQuranFont";
import classNames from "classnames";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
    BsFileEarmarkPlay,
    BsPauseFill,
    BsShare,
    BsThreeDotsVertical,
} from "react-icons/bs";
import { IoIosLink, IoMdCopy, IoMdImages, IoMdOpen } from "react-icons/io";
import PanelCloseButton from "@/components/PanelCloseButton";
import ContentReportModal from "@/components/ContentReportModal";
import { BsExclamationTriangleFill } from "react-icons/bs";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

const SUNNAH_MAP = {
    bukhari: "bukhari",
    muslim: "muslim",
    abudaud: "abudawud",
    abudawud: "abudawud",
    tirmidzi: "tirmidhi",
    ibnumajah: "ibnmajah",
    nasai: "nasai",
    ahmad: "ahmad",
    malik: "malik",
    darimi: "darimi",
};

const getSunnahUrl = (slug, number) => {
    const s = SUNNAH_MAP[slug?.toLowerCase()?.replace(/[^a-z]/g, "")];
    return s && number ? `https://sunnah.com/${s}:${number}` : null;
};

function SanadPanel({ hadithId }) {
    const { t } = useLocale();
    const [data, setData] = useState(null);
    const [failed, setFailed] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${API_URL}/api/v1/hadiths/${hadithId}/sanad`)
            .then((r) => r.json())
            .then((d) =>
                setData(Array.isArray(d?.items ?? d) ? (d?.items ?? d) : []),
            )
            .catch(() => setFailed(true))
            .finally(() => setLoading(false));
    }, [hadithId]);

    if (loading) return <p className='text-xs text-gray-400 py-2'>...</p>;
    // Distinguish "no sanad recorded" from "the request failed" — for hadith
    // provenance the difference matters.
    if (failed)
        return (
            <p className='text-xs text-red-500 py-2'>
                {t("common.load_error")}
            </p>
        );
    if (!data?.length)
        return (
            <p className='text-xs text-gray-400 py-2'>
                {t("hadith.sanad_empty")}
            </p>
        );

    return (
        <div className='space-y-3'>
            {data.map((sanad, i) => (
                <div key={sanad.id ?? i} className='text-sm'>
                    {sanad.keterangan && (
                        <p className='text-xs text-gray-500 dark:text-gray-300 dark:text-gray-400 mb-1.5 italic'>
                            {sanad.keterangan}
                        </p>
                    )}
                    <div className='flex flex-wrap items-start gap-1'>
                        {(sanad.mata_sanad ?? []).map((ms, idx, arr) => (
                            <span
                                key={ms.id ?? idx}
                                className='flex items-center gap-1'
                            >
                                <span className='inline-flex flex-col items-center gap-0.5'>
                                    <span className='px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded text-xs font-medium'>
                                        {ms.perawi?.nama_latin ??
                                            `Perawi ${idx + 1}`}
                                    </span>
                                    {ms.metode && (
                                        <span className='text-[10px] text-gray-400'>
                                            {ms.metode}
                                        </span>
                                    )}
                                </span>
                                {idx < arr.length - 1 && (
                                    <span className='text-gray-400 text-sm'>
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
    const [failed, setFailed] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${API_URL}/api/v1/hadiths/${hadithId}/takhrij`)
            .then((r) => r.json())
            .then((d) =>
                setData(Array.isArray(d?.items ?? d) ? (d?.items ?? d) : []),
            )
            .catch(() => setFailed(true))
            .finally(() => setLoading(false));
    }, [hadithId]);

    if (loading) return <p className='text-xs text-gray-400 py-2'>...</p>;
    if (!data?.length)
        return (
            <p className='text-xs text-gray-400 py-2'>
                {t("hadith.takhrij_empty")}
            </p>
        );

    return (
        <div className='flex flex-wrap gap-2'>
            {data.map((tk, i) => {
                const translations = tk.book?.translation ?? [];
                const bookName =
                    (Array.isArray(translations)
                        ? translations.find(
                              (tr) =>
                                  tr.lang?.toUpperCase() ===
                                  lang?.toUpperCase(),
                          )?.name
                        : null) ||
                    tk.book?.slug ||
                    "Kitab";
                return (
                    <span
                        key={tk.id ?? i}
                        className='inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 rounded-lg text-xs font-medium'
                    >
                        {bookName}
                        {tk.nomor_hadis_kitab && (
                            <span className='bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-300 dark:text-amber-200 px-1.5 py-0.5 rounded text-[10px]'>
                                #{tk.nomor_hadis_kitab}
                            </span>
                        )}
                    </span>
                );
            })}
        </div>
    );
}

const HadithPage = ({
    params,
    hadith,
    book,
    newLimit,
    isLast,
    basePath = "/hadith",
}) => {
    const { t, lang } = useLocale();
    const { isHidden: actionsHidden, isMenu: actionsMenu } =
        useActionPosition();
    const { fontCls, arabicFontSize, translationFontSize } = useQuranFont();
    const cardRef = useRef();
    const audioRef = useRef(null);
    const [isCopied, SetIsCopied] = useState(false);
    const [settingPopUp, SetSettingPopUp] = useState(false);
    const [clipboardPopUp, SetClipboardPopUp] = useState(false);
    const [shareImagePopUp, SetShareImagePopUp] = useState(false);
    const [reportOpen, setReportOpen] = useState(false);
    const [isPlayingAudio, setIsPlayingAudio] = useState(false);
    const [audioLoading, setAudioLoading] = useState(false);
    const [statusMsg, SetStatusMsg] = useState("");
    const [showSanad, setShowSanad] = useState(false);
    const [showTakhrij, setShowTakhrij] = useState(false);

    const audioSources = (hadith?.media ?? [])
        .map((entry) => entry?.multimedia?.url)
        .filter(Boolean);
    const firstAudioSource = audioSources[0] ?? "";
    const hadithTranslation = getLocalizedTranslation(hadith.translation, lang);
    const detailPath = hadith?.number
        ? `${basePath}/${params.slug}/${hadith.number}`
        : "";
    const detailUrl = () => {
        if (!detailPath || typeof window === "undefined") return "";
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
        setTimeout(() => SetStatusMsg(""), 2200);
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
            showStatus(t("hadith.audio_unavailable"));
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
            showStatus(t("hadith.audio_play_error"));
        }
    };

    const handleAudio = async () => {
        if (!firstAudioSource) {
            showStatus(t("hadith.audio_unavailable"));
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
        "flex w-full items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-emerald-50 dark:hover:bg-slate-700 transition-colors text-left";

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
                    {t("hadith.copy_success")}
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
                            `${t("hadith.citation", { slug: params.slug, number: hadith.number })}\n`.concat(
                                `${t("hadith.via")} ${detailUrl() || window.location.href}`,
                            ),
                        )}
                />
            ) : (
                ""
            )}
            <ul
                id={`${params.slug}-${hadith.number}`}
                className={classNames({
                    "flex flex-col md:flex-row md:justify-between px-3 py-3 md:p-4 border-b border-emerald-100 dark:border-slate-700": true,
                    "bg-parchment-50 dark:bg-slate-800":
                        hadith.number % 2 === 1,
                    "bg-white dark:bg-slate-900": hadith.number % 2 === 0,
                    "text-emerald-900 dark:text-white": true,
                })}
                ref={cardRef}
            >
                {!actionsHidden && (
                    <ul
                        className='flex flex-row flex-wrap items-center w-full gap-0.5 pb-1 md:flex-col md:flex-nowrap md:w-auto md:gap-1 md:p-2 md:pb-2'
                        style={{ direction: "ltr" }}
                    >
                        <li
                            className={classNames(
                                "flex justify-center text-sm font-medium text-gray-500 dark:text-gray-400 md:mr-0 md:pb-1",
                                // Di mobile rail ini jadi header horizontal: nomor duduk di kiri,
                                // ikon aksi di kanan. Yang mendorong jarak itu elemen terakhir
                                // sebelum ikon -- badge grade kalau ada, kalau tidak ya nomor ini.
                                hadith.grade ? "mr-1.5" : "mr-auto",
                            )}
                        >
                            {book.slug}:{hadith.number}
                        </li>
                        {hadith.grade && (
                            <li className='flex justify-center mr-auto md:mr-0'>
                                <GradeBadge grade={hadith.grade} />
                            </li>
                        )}
                        {detailPath && (
                            <li
                                className={
                                    actionsMenu
                                        ? "hidden"
                                        : "flex justify-center"
                                }
                            >
                                <Link
                                    href={detailPath}
                                    title={t("hadith.open_detail")}
                                    className='p-2 rounded-lg text-lg hover:bg-emerald-100 dark:hover:bg-slate-700 transition-colors'
                                >
                                    <IoIosLink />
                                </Link>
                            </li>
                        )}
                        <li
                            className={
                                actionsMenu ? "hidden" : "flex justify-center"
                            }
                        >
                            <button
                                title={
                                    firstAudioSource
                                        ? isPlayingAudio
                                            ? t("hadith.audio_pause")
                                            : t("hadith.audio_play")
                                        : t("hadith.audio_unavailable_short")
                                }
                                onClick={handleAudio}
                                disabled={audioLoading}
                                className={classNames(
                                    "p-2 rounded-lg text-lg transition-colors disabled:opacity-50",
                                    firstAudioSource
                                        ? isPlayingAudio
                                            ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
                                            : "text-gray-400 hover:bg-emerald-100 dark:hover:bg-slate-700"
                                        : "text-gray-300 dark:text-gray-600 hover:bg-emerald-50 dark:hover:bg-slate-800",
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
                        <li
                            className={
                                actionsMenu ? "hidden" : "flex justify-center"
                            }
                        >
                            <BookmarkButton
                                refType='hadith'
                                refId={hadith.id}
                            />
                        </li>
                        <li
                            className={
                                actionsMenu ? "hidden" : "flex justify-center"
                            }
                        >
                            <button
                                title={t("common.share")}
                                onClick={toggleShareImagePopUp}
                                className='p-2 rounded-lg text-lg hover:bg-emerald-100 dark:hover:bg-slate-700 transition-colors'
                            >
                                <BsShare />
                            </button>
                        </li>
                        <li className='flex justify-center relative'>
                            <button
                                title={t("common.more")}
                                onClick={toggleSettingPopUp}
                                className='p-2 rounded-lg text-lg hover:bg-emerald-100 dark:hover:bg-slate-700 transition-colors'
                            >
                                <BsThreeDotsVertical />
                            </button>
                            {settingPopUp ? (
                                <div className='absolute right-0 top-9 z-20 md:right-auto md:left-9 md:top-0'>
                                    <div className='flex flex-col bg-white dark:bg-slate-800 border border-emerald-100 dark:border-slate-700 rounded-xl w-56 p-1 shadow-lg text-emerald-900 dark:text-emerald-300 dark:text-white'>
                                        {actionsMenu && (
                                            <div className='border-b border-emerald-50 dark:border-slate-700 pb-1 mb-1'>
                                                {detailPath && (
                                                    <Link
                                                        href={detailPath}
                                                        className={
                                                            actionMenuButtonClass
                                                        }
                                                        onClick={() =>
                                                            SetSettingPopUp(
                                                                false,
                                                            )
                                                        }
                                                    >
                                                        <IoIosLink />
                                                        {t(
                                                            "hadith.open_detail_menu",
                                                        )}
                                                    </Link>
                                                )}
                                                <button
                                                    className={
                                                        actionMenuButtonClass
                                                    }
                                                    onClick={() => {
                                                        handleAudio();
                                                        SetSettingPopUp(false);
                                                    }}
                                                    disabled={audioLoading}
                                                >
                                                    {isPlayingAudio ? (
                                                        <BsPauseFill />
                                                    ) : (
                                                        <BsFileEarmarkPlay />
                                                    )}
                                                    {audioLoading
                                                        ? t(
                                                              "hadith.audio_loading",
                                                          )
                                                        : isPlayingAudio
                                                          ? t(
                                                                "hadith.audio_pause",
                                                            )
                                                          : t(
                                                                "hadith.audio_play",
                                                            )}
                                                </button>
                                                {/* Ikon di KIRI lalu label, sama seperti item lain di menu ini.
                                                    Sebelumnya barisnya memakai justify-between dengan label dulu,
                                                    jadi ikonnya terdorong ke tepi kanan sendirian.
                                                    BookmarkButton membawa p-2 dan text-lg sendiri, jadi keduanya
                                                    dinetralkan agar sebaris rapi dengan ikon saudaranya. */}
                                                <div className='flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-emerald-50 dark:hover:bg-slate-700 transition-colors'>
                                                    <BookmarkButton
                                                        refType='hadith'
                                                        refId={hadith.id}
                                                        className="!p-0 !text-base relative before:absolute before:-inset-2 before:content-['']"
                                                    />
                                                    <span>
                                                        {t(
                                                            "hadith.bookmark_label",
                                                        )}
                                                    </span>
                                                </div>
                                                <button
                                                    className={
                                                        actionMenuButtonClass
                                                    }
                                                    onClick={() => {
                                                        toggleShareImagePopUp();
                                                        SetSettingPopUp(false);
                                                    }}
                                                >
                                                    <BsShare />
                                                    {t("common.share")}
                                                </button>
                                            </div>
                                        )}
                                        <button
                                            className={actionMenuButtonClass}
                                            onClick={() => {
                                                copyText(
                                                    detailUrl() ||
                                                        `${window.location.href}#${params.slug}-${hadith.number}`,
                                                );
                                            }}
                                        >
                                            <IoIosLink />
                                            {t("hadith.copy_link")}
                                        </button>
                                        {(() => {
                                            const sunnahUrl = getSunnahUrl(
                                                hadith?.book?.slug ||
                                                    params.slug,
                                                hadith?.number,
                                            );
                                            return sunnahUrl ? (
                                                <a
                                                    href={sunnahUrl}
                                                    target='_blank'
                                                    rel='noopener noreferrer'
                                                    className={actionMenuButtonClass}
                                                >
                                                    <IoMdOpen />
                                                    sunnah.com
                                                </a>
                                            ) : null;
                                        })()}
                                        <button
                                            className={actionMenuButtonClass}
                                            onClick={() => {
                                                SetSettingPopUp(false);
                                                setTimeout(async () => {
                                                    const {
                                                        default: html2canvas,
                                                    } =
                                                        await import("html2canvas");
                                                    html2canvas(
                                                        document.getElementById(
                                                            `${params.slug}-${hadith.number}`,
                                                        ),
                                                    ).then((canvas) => {
                                                        CopyImageToClipboard(
                                                            canvas,
                                                        );
                                                        SetIsCopied(true);
                                                        setTimeout(() => {
                                                            SetIsCopied(false);
                                                        }, 1000);
                                                    });
                                                }, 1000);
                                            }}
                                        >
                                            <IoMdImages />
                                            {t("hadith.copy_image")}
                                        </button>
                                        <button
                                            className={actionMenuButtonClass}
                                            onClick={() => {
                                                setReportOpen(true);
                                                SetSettingPopUp(false);
                                            }}
                                        >
                                            <BsExclamationTriangleFill className="text-amber-500" />
                                            {t("report.correction_btn") ?? "Laporkan Kesalahan"}
                                        </button>
                                        <button
                                            className={actionMenuButtonClass}
                                            onClick={() => {
                                                copyText(
                                                    `${hadith.translation.ar}\n`
                                                        .concat(
                                                            `${hadithTranslation}\n`,
                                                        )
                                                        .concat(
                                                            `${t("hadith.citation", { slug: params.slug, number: hadith.number })}\n`.concat(
                                                                `${t("hadith.via")} ${detailUrl() || window.location.href}`,
                                                            ),
                                                        ),
                                                );
                                            }}
                                        >
                                            <IoMdCopy />
                                            {t("hadith.copy_text")}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                ""
                            )}
                        </li>
                    </ul>
                )}
                <ul
                    className='flex flex-col w-full justify-center'
                    style={{ direction: "rtl" }}
                >
                    <li
                        className={`${fontCls} leading-[2.25]`}
                        style={{ fontSize: `${arabicFontSize}px` }}
                    >
                        {hadith.translation.ar}
                    </li>
                    <li
                        className='text-left py-2 md:p-2'
                        style={{
                            direction: "ltr",
                            fontSize: `${translationFontSize}px`,
                        }}
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
            <p className='px-4 pt-2 text-[11px] text-gray-400 text-center'>
                {t("hadith.audio_tafsir_note")}
            </p>
            <div className='px-4 pt-2 pb-1 flex gap-2 flex-wrap'>
                <button
                    type='button'
                    onClick={() => setShowSanad((v) => !v)}
                    className={classNames(
                        "text-xs px-3 py-1 rounded-full border transition-colors",
                        showSanad
                            ? "bg-emerald-600 dark:bg-emerald-700 text-white border-emerald-600 dark:border-emerald-700"
                            : "text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20",
                    )}
                >
                    {t("hadith.sanad")}
                </button>
                <button
                    type='button'
                    onClick={() => setShowTakhrij((v) => !v)}
                    className={classNames(
                        "text-xs px-3 py-1 rounded-full border transition-colors",
                        showTakhrij
                            ? "bg-amber-500 dark:bg-amber-600 text-white border-amber-500 dark:border-amber-600"
                            : "text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-900/20",
                    )}
                >
                    {t("hadith.takhrij")}
                </button>
            </div>
            {showSanad && (
                <div className='px-4 pb-3'>
                    <div className='flex items-start justify-between gap-3 mb-2'>
                        <p className='text-[10px] font-semibold text-gray-400 uppercase tracking-widest'>
                            {t("hadith.sanad")}
                        </p>
                        <PanelCloseButton onClose={() => setShowSanad(false)} />
                    </div>
                    <SanadPanel hadithId={hadith.id} />
                </div>
            )}
            {showTakhrij && (
                <div className='px-4 pb-3'>
                    <div className='flex items-start justify-between gap-3 mb-2'>
                        <p className='text-[10px] font-semibold text-gray-400 uppercase tracking-widest'>
                            {t("hadith.takhrij")}
                        </p>
                        <PanelCloseButton
                            onClose={() => setShowTakhrij(false)}
                        />
                    </div>
                    <TakhrijPanel hadithId={hadith.id} />
                </div>
            )}
            {isCopied ? <PopUpIsCopied /> : <></>}
            {reportOpen && (
                <ContentReportModal
                    isOpen={reportOpen}
                    onClose={() => setReportOpen(false)}
                    targetType="hadith"
                    targetId={`${hadith?.book?.slug || params.slug}-${hadith?.number}`}
                    targetTitle={`HR. ${hadith?.book?.translation?.latin_en || hadith?.book?.slug} No. ${hadith?.number}`}
                    snippet={
                        (hadith?.translation?.idn || hadith?.translation?.en || "")
                            .replace(/<[^>]+>/g, "")
                            .slice(0, 200)
                    }
                />
            )}
        </>
    );
};

export default HadithPage;
