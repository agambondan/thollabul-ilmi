"use client";

import ContentWidth from "@/components/layout/ContentWidth";
import dynamic from "next/dynamic";
import BookmarkButton from "@/components/BookmarkButton";
import GradeBadge, { HadithAuthenticity } from "@/components/GradeBadge";
import { useLocale } from "@/context/Locale";
import { listMasjidImage } from "@/lib/const";
import { CopyImageToClipboard, CopyToClipboard } from "@/lib/copy";
import { getLocalizedTranslation } from "@/lib/translation";
import { useActionPosition } from "@/lib/useActionPosition";
import { useQuranFont } from "@/lib/useQuranFont";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, use } from "react";
import { useRouter } from "next/navigation";
import PanelCloseButton from "@/components/PanelCloseButton";

const PopUpIsCopied = dynamic(
    () => import("@/components/popup/ListImage").then((m) => m.PopUpIsCopied),
    { ssr: false },
);
const ShareAyah = dynamic(
    () => import("@/components/popup/ListImage").then((m) => m.ShareAyah),
    { ssr: false },
);
const SanadPanel = dynamic(() => import("@/components/hadith/SanadPanel"), {
    ssr: false,
});
const TakhrijPanel = dynamic(() => import("@/components/hadith/TakhrijPanel"), {
    ssr: false,
});

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

const BOOK_NAMES = {
    bukhari: "Shahih Bukhari",
    muslim: "Shahih Muslim",
    abudaud: "Sunan Abu Daud",
    tirmidzi: "Jami At-Tirmidzi",
    nasai: "Sunan An-Nasa'i",
    ibnumajah: "Sunan Ibnu Majah",
    malik: "Muwatha' Malik",
    ahmad: "Musnad Ahmad",
    darimi: "Sunan Darimi",
};

const toStr = (v) => {
    if (!v) return "";
    if (typeof v === "string") return v;
    return v.name ?? v.title ?? v.label ?? v.value ?? "";
};

const themeId = (t) => t?.theme?.id ?? t?.id;
const themeName = (t, lang) =>
    getLocalizedTranslation(t?.theme?.translation, lang) ||
    toStr(t?.name ?? t?.title) ||
    "Belum dikategorikan";

const chapterName = (c, lang) =>
    getLocalizedTranslation(c?.translation, lang) ||
    toStr(c?.name ?? c?.title) ||
    "Belum dikategorikan";

// ─── Hadith Card ─────────────────────────────────────────────────────────────

function HadithCard({ h, idx, lang, t, slug, basePath }) {
    const { isHidden: actionsHidden, isMenu: actionsMenu } =
        useActionPosition();
    const { fontCls, arabicFontSize, translationFontSize } = useQuranFont();
    const [showSanad, setShowSanad] = useState(false);
    const [showTakhrij, setShowTakhrij] = useState(false);
    const [clipboardPopUp, setClipboardPopUp] = useState(false);
    const [shareImagePopUp, setShareImagePopUp] = useState(false);
    const [settingPopUp, setSettingPopUp] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [isPlayingAudio, setIsPlayingAudio] = useState(false);
    const [audioLoading, setAudioLoading] = useState(false);
    const audioRef = useRef(null);
    const cardRef = useRef(null);

    const audioSources = (h?.media ?? [])
        .map((e) => e?.multimedia?.url)
        .filter(Boolean);
    const firstAudioSource = audioSources[0] ?? "";
    const arabicText = h.translation?.ar ?? h.arab ?? "";
    const hadithText =
        getLocalizedTranslation(h.translation, lang) || h.indonesia || "";
    const cardId = `${slug}-${h.number ?? h.id ?? idx}`;
    const detailPath = h.number ? `${basePath}/${slug}/${h.number}` : null;

    const getCardUrl = () => {
        if (typeof window === "undefined") return "";
        return detailPath
            ? `${window.location.origin}${detailPath}`
            : `${window.location.origin}${window.location.pathname}${window.location.search}#${cardId}`;
    };

    const copyText = (value) => {
        CopyToClipboard(value);
        setClipboardPopUp(true);
        setTimeout(() => setClipboardPopUp(false), 2000);
    };

    const actionMenuButtonClass =
        "flex w-full items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-left text-gray-700 dark:text-gray-300";

    const stopAudio = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        setIsPlayingAudio(false);
    };

    const handleAudio = async () => {
        if (!firstAudioSource) {
            return;
        }
        if (isPlayingAudio) {
            stopAudio();
            return;
        }
        setAudioLoading(true);
        try {
            if (!audioRef.current) {
                audioRef.current = new Audio(firstAudioSource);
                audioRef.current.onended = () => setIsPlayingAudio(false);
            }
            await audioRef.current.play();
            setIsPlayingAudio(true);
        } catch {
            setIsPlayingAudio(false);
        } finally {
            setAudioLoading(false);
        }
    };

    useEffect(() => () => stopAudio(), []);

    return (
        <div
            ref={cardRef}
            id={cardId}
            className='relative bg-amber-50/70 dark:bg-slate-800 rounded-md border border-amber-200/80 dark:border-amber-900/40 px-5 sm:px-7 py-6 shadow-[0_1px_0_0_rgba(180,140,80,0.15)] font-serif'
        >
            {clipboardPopUp && (
                <div className='fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-full shadow-lg'>
                    {t("hadith.copy_success")}
                </div>
            )}
            {shareImagePopUp && (
                <ShareAyah
                    images={listMasjidImage}
                    isCopiedCallback={() => setShareImagePopUp(false)}
                    text={`${arabicText}\n`.concat(`${hadithText}\n`).concat(
                        `${t("hadith.citation", {
                            slug,
                            number: h.number,
                        })}\n${t("hadith.via")} ${getCardUrl()}`,
                    )}
                />
            )}

            {/* Header: number + grade + actions */}
            <div className='flex items-center justify-between mb-4 pb-3 border-b border-amber-200/70 dark:border-amber-900/40'>
                <div className='flex items-center gap-3'>
                    <span
                        className='font-serif italic text-amber-800 dark:text-amber-400 text-lg leading-none shrink-0'
                        title={t("hadith.hadith_number_title")}
                    >
                        №
                    </span>
                    <span className='font-serif text-2xl font-semibold text-amber-900 dark:text-amber-300 leading-none shrink-0'>
                        {h.number ?? idx + 1}
                    </span>
                    <span className='w-px h-5 bg-amber-300/70 dark:bg-amber-700/60' />
                    <GradeBadge grade={h.grade} />
                </div>

                {/* Action toolbar */}
                {!actionsHidden && (
                    <div className='flex items-center gap-1'>
                        {detailPath && (
                            <Link
                                href={detailPath}
                                title={t("hadith.open_detail")}
                                className={`${actionsMenu ? "hidden" : ""} p-2 rounded-lg text-base text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors`}
                            >
                                <span aria-hidden='true'>🔗</span>
                            </Link>
                        )}
                        {h.id && (
                            <button
                                type='button'
                                title={
                                    isPlayingAudio
                                        ? t("hadith.audio_pause")
                                        : firstAudioSource
                                          ? t("hadith.audio_play")
                                          : t("hadith.audio_unavailable_short")
                                }
                                onClick={handleAudio}
                                disabled={audioLoading || !firstAudioSource}
                                className={`${actionsMenu ? "hidden" : ""} p-2 rounded-lg text-base transition-colors disabled:opacity-40 ${
                                    isPlayingAudio
                                        ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
                                        : "text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700"
                                }`}
                            >
                                {audioLoading ? (
                                    <span className='text-[10px]'>...</span>
                                ) : isPlayingAudio ? (
                                    <svg
                                        width='1em'
                                        height='1em'
                                        viewBox='0 0 16 16'
                                        fill='currentColor'
                                        aria-hidden='true'
                                    >
                                        <path d='M5.5 3.5A1.5 1.5 0 0 1 7 2h2a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 9 14H7a1.5 1.5 0 0 1-1.5-1.5v-9zM2 4a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-.5.5h-3A.5.5 0 0 1 2 12V4zm9.5 0a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5V4z' />
                                    </svg>
                                ) : (
                                    <svg
                                        width='1em'
                                        height='1em'
                                        viewBox='0 0 16 16'
                                        fill='currentColor'
                                        aria-hidden='true'
                                    >
                                        <path d='M5.854 4.854a.5.5 0 1 0-.708-.708l-3.5 3.5a.5.5 0 0 0 0 .708l3.5 3.5a.5.5 0 0 0 .708-.708L2.707 8l3.147-3.146zm4.292 0a.5.5 0 0 1 .708-.708l3.5 3.5a.5.5 0 0 1 0 .708l-3.5 3.5a.5.5 0 0 1-.708-.708L13.293 8l-3.147-3.146z' />
                                    </svg>
                                )}
                            </button>
                        )}
                        {h.id && !actionsMenu && (
                            <BookmarkButton refType='hadith' refId={h.id} />
                        )}
                        <button
                            type='button'
                            title={t("common.share")}
                            onClick={() => setShareImagePopUp(true)}
                            className={`${actionsMenu ? "hidden" : ""} p-2 rounded-lg text-base text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors`}
                        >
                            <svg
                                width='1em'
                                height='1em'
                                viewBox='0 0 16 16'
                                fill='currentColor'
                                aria-hidden='true'
                            >
                                <path d='M11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.499 2.499 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5z' />
                            </svg>
                        </button>
                        <div className='relative'>
                            <button
                                type='button'
                                title={t("common.more")}
                                onClick={() => setSettingPopUp((v) => !v)}
                                className='p-2 rounded-lg text-base text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors'
                            >
                                <svg
                                    width='1em'
                                    height='1em'
                                    viewBox='0 0 16 16'
                                    fill='currentColor'
                                    aria-hidden='true'
                                >
                                    <path d='M9.5 13a1.5 1.5 0 1 1-2-1.415V11.5a.5.5 0 0 1 .5-.5h.086a.5.5 0 0 0 .5-.5v-.086A1.5 1.5 0 0 1 9.5 9h1a1.5 1.5 0 0 1 1.5 1.5v.086a.5.5 0 0 0 .5.5h.086a1.5 1.5 0 0 1 0 1.5h-.086a.5.5 0 0 0-.5.5v.086a1.5 1.5 0 0 1-1.5 1.5h-1zM4 9a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm10-3a1 1 0 1 1 0-2 1 1 0 0 1 0 2z' />
                                </svg>
                            </button>
                            {settingPopUp && (
                                <div className='absolute right-0 top-9 z-20'>
                                    <div className='flex flex-col bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl w-56 p-1 shadow-lg'>
                                        {actionsMenu && (
                                            <div className='border-b border-gray-100 dark:border-slate-700 pb-1 mb-1'>
                                                {detailPath && (
                                                    <Link
                                                        href={detailPath}
                                                        className={
                                                            actionMenuButtonClass
                                                        }
                                                        onClick={() =>
                                                            setSettingPopUp(
                                                                false,
                                                            )
                                                        }
                                                    >
                                                        <span aria-hidden='true'>
                                                            🔗
                                                        </span>{" "}
                                                        {t(
                                                            "hadith.open_detail_menu",
                                                        )}
                                                    </Link>
                                                )}
                                                {h.id && (
                                                    <button
                                                        type='button'
                                                        className={
                                                            actionMenuButtonClass
                                                        }
                                                        onClick={() => {
                                                            handleAudio();
                                                            setSettingPopUp(
                                                                false,
                                                            );
                                                        }}
                                                        disabled={
                                                            audioLoading ||
                                                            !firstAudioSource
                                                        }
                                                    >
                                                        {isPlayingAudio ? (
                                                            <svg
                                                                width='1em'
                                                                height='1em'
                                                                viewBox='0 0 16 16'
                                                                fill='currentColor'
                                                                aria-hidden='true'
                                                            >
                                                                <path d='M5.5 3.5A1.5 1.5 0 0 1 7 2h2a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 9 14H7a1.5 1.5 0 0 1-1.5-1.5v-9zM2 4a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-.5.5h-3A.5.5 0 0 1 2 12V4zm9.5 0a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5V4z' />
                                                            </svg>
                                                        ) : (
                                                            <svg
                                                                width='1em'
                                                                height='1em'
                                                                viewBox='0 0 16 16'
                                                                fill='currentColor'
                                                                aria-hidden='true'
                                                            >
                                                                <path d='M5.854 4.854a.5.5 0 1 0-.708-.708l-3.5 3.5a.5.5 0 0 0 0 .708l3.5 3.5a.5.5 0 0 0 .708-.708L2.707 8l3.147-3.146zm4.292 0a.5.5 0 0 1 .708-.708l3.5 3.5a.5.5 0 0 1 0 .708l-3.5 3.5a.5.5 0 0 1-.708-.708L13.293 8l-3.147-3.146z' />
                                                            </svg>
                                                        )}
                                                        {audioLoading
                                                            ? t(
                                                                  "hadith.audio_loading",
                                                              )
                                                            : isPlayingAudio
                                                              ? t(
                                                                    "hadith.audio_pause",
                                                                )
                                                              : firstAudioSource
                                                                ? t(
                                                                      "hadith.audio_play",
                                                                  )
                                                                : t(
                                                                      "hadith.audio_unavailable_short",
                                                                  )}
                                                    </button>
                                                )}
                                                {/* Ikon di KIRI lalu label, sama seperti item lain di menu ini.
                                                    Sebelumnya barisnya memakai justify-between dengan label dulu,
                                                    jadi ikonnya terdorong ke tepi kanan sendirian.
                                                    BookmarkButton membawa p-2 dan text-lg sendiri, jadi keduanya
                                                    dinetralkan agar sebaris rapi dengan ikon saudaranya. */}
                                                {h.id && (
                                                    <div className='flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-gray-700 dark:text-gray-300'>
                                                        <BookmarkButton
                                                            refType='hadith'
                                                            refId={h.id}
                                                            className="!p-0 !text-base relative before:absolute before:-inset-2 before:content-['']"
                                                        />
                                                        <span>
                                                            {t(
                                                                "hadith.bookmark_label",
                                                            )}
                                                        </span>
                                                    </div>
                                                )}
                                                <button
                                                    type='button'
                                                    className={
                                                        actionMenuButtonClass
                                                    }
                                                    onClick={() => {
                                                        setShareImagePopUp(
                                                            true,
                                                        );
                                                        setSettingPopUp(false);
                                                    }}
                                                >
                                                    <svg
                                                        width='1em'
                                                        height='1em'
                                                        viewBox='0 0 16 16'
                                                        fill='currentColor'
                                                        aria-hidden='true'
                                                    >
                                                        <path d='M11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.499 2.499 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5z' />
                                                    </svg>{" "}
                                                    {t("common.share")}
                                                </button>
                                            </div>
                                        )}
                                        <button
                                            type='button'
                                            className={actionMenuButtonClass}
                                            onClick={() => {
                                                copyText(getCardUrl());
                                                setSettingPopUp(false);
                                            }}
                                        >
                                            <span aria-hidden='true'>🔗</span>{" "}
                                            {t("hadith.copy_link")}
                                        </button>
                                        <button
                                            type='button'
                                            className={actionMenuButtonClass}
                                            onClick={() => {
                                                setSettingPopUp(false);
                                                setTimeout(async () => {
                                                    const {
                                                        default: html2canvas,
                                                    } =
                                                        await import("html2canvas");
                                                    html2canvas(
                                                        document.getElementById(
                                                            cardId,
                                                        ),
                                                    ).then((canvas) => {
                                                        CopyImageToClipboard(
                                                            canvas,
                                                        );
                                                        setIsCopied(true);
                                                        setTimeout(
                                                            () =>
                                                                setIsCopied(
                                                                    false,
                                                                ),
                                                            1000,
                                                        );
                                                    });
                                                }, 500);
                                            }}
                                        >
                                            <span aria-hidden='true'>🖼️</span>{" "}
                                            {t("hadith.copy_image")}
                                        </button>
                                        <button
                                            type='button'
                                            className={actionMenuButtonClass}
                                            onClick={() => {
                                                copyText(
                                                    `${arabicText}\n\n${hadithText}\n\n${t("hadith.citation", { slug, number: h.number })}\n${t("hadith.via")} ${getCardUrl()}`,
                                                );
                                                setSettingPopUp(false);
                                            }}
                                        >
                                            <span aria-hidden='true'>📋</span>{" "}
                                            {t("hadith.copy_text")}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {arabicText && (
                <p
                    dir='rtl'
                    className={`${fontCls} text-gray-800 dark:text-gray-100 leading-loose text-right mb-4 pb-4 border-b border-dotted border-amber-300/60 dark:border-amber-800/40`}
                    style={{ fontSize: `${arabicFontSize}px` }}
                >
                    {arabicText}
                </p>
            )}
            {hadithText && (
                <p
                    className='text-amber-950 dark:text-amber-300 leading-relaxed text-justify [text-justify:inter-word] first-letter:font-semibold'
                    style={{ fontSize: `${translationFontSize}px` }}
                >
                    {hadithText}
                </p>
            )}
            {h.perawi && (
                <p className='text-xs italic text-amber-800 dark:text-amber-400 mt-4 font-medium'>
                    — {toStr(h.perawi)}
                </p>
            )}
            {(h.grade ||
                h.shahih_by ||
                h.dhaif_by ||
                h.grade_notes ||
                h.sanad) && (
                <div className='mt-4'>
                    <HadithAuthenticity hadith={h} />
                </div>
            )}

            {/* Sanad & Takhrij toggles */}
            {h.id && (
                <div className='mt-5 pt-4 border-t border-amber-200/70 dark:border-amber-900/40'>
                    <div className='flex gap-2'>
                        <button
                            type='button'
                            onClick={() => {
                                setShowSanad((v) => !v);
                                setShowTakhrij(false);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                showSanad
                                    ? "bg-teal-600 text-white"
                                    : "bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900/40"
                            }`}
                        >
                            {t("hadith.sanad_chain")}
                        </button>
                        <button
                            type='button'
                            onClick={() => {
                                setShowTakhrij((v) => !v);
                                setShowSanad(false);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                showTakhrij
                                    ? "bg-blue-600 text-white"
                                    : "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40"
                            }`}
                        >
                            {t("hadith.takhrij")}
                        </button>
                    </div>

                    {showSanad && (
                        <div className='mt-3 p-3 bg-teal-50 dark:bg-teal-900/10 rounded-xl'>
                            <div className='flex justify-end'>
                                <PanelCloseButton
                                    onClose={() => setShowSanad(false)}
                                />
                            </div>
                            <SanadPanel hadithId={h.id} t={t} />
                        </div>
                    )}
                    {showTakhrij && (
                        <div className='mt-3 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl'>
                            <div className='flex justify-end'>
                                <PanelCloseButton
                                    onClose={() => setShowTakhrij(false)}
                                />
                            </div>
                            <TakhrijPanel hadithId={h.id} t={t} />
                        </div>
                    )}
                </div>
            )}
            {isCopied && <PopUpIsCopied />}
        </div>
    );
}

export default function DashboardHadithDetailPage(props) {
    const params = use(props.params);
    return (
        <HadithDetailContent
            params={params}
            basePath='/dashboard/hadith'
            showSelectors={true}
        />
    );
}

export function HadithDetailContent({
    params,
    basePath = "/dashboard/hadith",
    showSelectors = true,
    initialHadiths = [],
    initialThemes = [],
    initialChapters = [],
}) {
    const { slug } = params;
    const { t, lang } = useLocale();
    const router = useRouter();

    useEffect(() => {
        if (typeof window === "undefined") return;
        const hash = window.location.hash.replace("#", "").trim();
        if (/^\d+$/.test(hash)) {
            router.replace(`${basePath}/${slug}/${hash}`);
        }
    }, [basePath, slug, router]);

    const firstThemeId =
        initialThemes.length > 0 ? themeId(initialThemes[0]) : null;
    const [themes, setThemes] = useState(initialThemes);
    const [chapters, setChapters] = useState(initialChapters);
    const [hadiths, setHadiths] = useState(initialHadiths);
    const [selectedTheme, setSelectedTheme] = useState(firstThemeId);
    const [selectedChapter, setSelectedChapter] = useState(
        initialChapters.length > 0 ? initialChapters[0] : null,
    );
    const [loading, setLoading] = useState(
        showSelectors && initialThemes.length === 0,
    );
    const [loadingHadith, setLoadingHadith] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [bookName, setBookName] = useState(
        BOOK_NAMES[slug] || initialThemes[0]?.book?.name || slug,
    );
    const hasServerDataRef = useRef(initialHadiths.length > 0);

    useEffect(() => {
        if (!showSelectors || initialThemes.length > 0) return;

        fetch(`${API_URL}/api/v1/themes/book/${slug}`)
            .then((r) => r.json())
            .then((d) => {
                const list = Array.isArray(d?.items ?? d)
                    ? (d?.items ?? d)
                    : [];
                setThemes(list);
                if (list.length > 0) {
                    const firstId = themeId(list[0]);
                    setSelectedTheme(firstId);
                    setBookName(
                        BOOK_NAMES[slug] ||
                            getLocalizedTranslation(
                                list[0]?.book?.translation,
                                lang,
                            ) ||
                            list[0]?.book?.name ||
                            slug,
                    );
                }
            })
            .catch((e) => console.error(e))
            .finally(() => setLoading(false));
    }, [slug, lang, showSelectors, initialThemes.length]);

    useEffect(() => {
        if (!selectedTheme) return;
        if (initialChapters.length > 0 && selectedTheme === firstThemeId)
            return;
        fetch(
            `${API_URL}/api/v1/chapters/book/${slug}/theme/${selectedTheme}?size=100`,
        )
            .then((r) => r.json())
            .then((d) => {
                const list = Array.isArray(d?.items ?? d)
                    ? (d?.items ?? d)
                    : [];
                setChapters(list);
                setSelectedChapter(list.length > 0 ? list[0] : null);
            })
            .catch((e) => console.error(e));
    }, [selectedTheme, slug, firstThemeId, initialChapters.length]);

    useEffect(() => {
        if (hasServerDataRef.current) {
            hasServerDataRef.current = false;
            return;
        }
        if (showSelectors) {
            if (!selectedTheme || !selectedChapter) return;
            loadHadiths(0, selectedTheme, selectedChapter.id, true);
        } else {
            loadBookHadiths(0, true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedTheme, selectedChapter, slug, showSelectors]);

    async function loadHadiths(pg, tid, cid, reset = false) {
        if (reset) {
            setHadiths([]);
            setPage(0);
            setHasMore(true);
        }
        setLoadingHadith(true);
        try {
            const res = await fetch(
                `${API_URL}/api/v1/hadiths/book/${slug}/theme/${tid}/chapter/${cid}?page=${pg}&size=20`,
            );
            const data = await res.json();
            const items = Array.isArray(data?.items ?? data)
                ? (data?.items ?? data)
                : [];
            if (reset) {
                setHadiths(items);
            } else {
                setHadiths((prev) => [...prev, ...items]);
            }
            setHasMore(items.length === 20);
        } catch {
            setHasMore(false);
        } finally {
            setLoadingHadith(false);
        }
    }

    async function loadBookHadiths(pg, reset = false) {
        if (reset) {
            setHadiths([]);
            setPage(0);
            setHasMore(true);
        }
        setLoadingHadith(true);
        try {
            const res = await fetch(
                `${API_URL}/api/v1/hadiths/book/${slug}?page=${pg}&size=20&slim=1`,
            );
            const data = await res.json();
            const items = Array.isArray(data?.items ?? data)
                ? (data?.items ?? data)
                : [];
            if (reset) {
                setHadiths(items);
            } else {
                setHadiths((prev) => [...prev, ...items]);
            }
            setHasMore(items.length === 20);
        } catch {
            setHasMore(false);
        } finally {
            setLoadingHadith(false);
        }
    }

    const loadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        if (showSelectors) {
            if (selectedTheme && selectedChapter) {
                loadHadiths(nextPage, selectedTheme, selectedChapter.id);
            }
        } else {
            loadBookHadiths(nextPage);
        }
    };

    useEffect(() => {
        if (!hadiths.length || typeof window === "undefined") return;

        const targetId = decodeURIComponent(
            window.location.hash.replace("#", ""),
        );
        if (!targetId) return;

        requestAnimationFrame(() => {
            document.getElementById(targetId)?.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        });
    }, [hadiths]);

    return (
        <ContentWidth compact='max-w-4xl' className='p-4'>
            <Link
                href={basePath}
                className='inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline mb-4'
            >
                ← {t("common.back")}
            </Link>

            <h1 className='text-xl font-bold text-gray-900 dark:text-white mb-4'>
                {bookName || BOOK_NAMES[slug] || slug}
            </h1>

            {loading ? (
                <div className='text-center py-16 text-gray-400 text-sm'>
                    {t("common.loading")}
                </div>
            ) : (
                <>
                    {showSelectors && (
                        <div className='flex flex-col gap-3 mb-5'>
                            <div className='flex flex-col'>
                                <label
                                    htmlFor='theme'
                                    className='block mb-2 text-sm font-medium text-gray-900 dark:text-white'
                                >
                                    {t("hadith.select_theme")}
                                </label>
                                <select
                                    id='theme'
                                    value={
                                        selectedTheme != null
                                            ? String(selectedTheme)
                                            : ""
                                    }
                                    onChange={(e) => {
                                        const picked = themes.find(
                                            (t) =>
                                                String(themeId(t)) ===
                                                e.target.value,
                                        );
                                        if (picked)
                                            setSelectedTheme(themeId(picked));
                                    }}
                                    className='w-full p-2.5 rounded-lg block border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 text-sm dark:text-white focus:ring-emerald-500 focus:border-emerald-500'
                                >
                                    {themes.map((t) => {
                                        const tid = themeId(t);
                                        return (
                                            <option
                                                key={tid}
                                                value={String(tid)}
                                            >
                                                {themeName(t, lang)}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            {chapters.length > 0 && (
                                <div className='flex flex-col'>
                                    <label
                                        htmlFor='chapter'
                                        className='block mb-2 text-sm font-medium text-gray-900 dark:text-white'
                                    >
                                        {t("hadith.select_chapter")}
                                    </label>
                                    <select
                                        id='chapter'
                                        value={
                                            selectedChapter?.id != null
                                                ? String(selectedChapter.id)
                                                : ""
                                        }
                                        onChange={(e) => {
                                            const ch = chapters.find(
                                                (c) =>
                                                    String(c.id) ===
                                                    e.target.value,
                                            );
                                            if (ch) setSelectedChapter(ch);
                                        }}
                                        className='w-full p-2.5 rounded-lg block border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 text-sm dark:text-white focus:ring-emerald-500 focus:border-emerald-500'
                                    >
                                        {chapters.map((c) => (
                                            <option
                                                key={c.id}
                                                value={String(c.id)}
                                            >
                                                {chapterName(c, lang)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    )}

                    <div className='space-y-4'>
                        {hadiths.map((h, idx) => (
                            <HadithCard
                                key={h.id ?? idx}
                                h={h}
                                idx={idx}
                                lang={lang}
                                t={t}
                                slug={slug}
                                basePath={basePath}
                            />
                        ))}
                    </div>

                    {loadingHadith && (
                        <div className='text-center py-8 text-gray-400 text-sm'>
                            {t("hadith.loading_hadiths")}
                        </div>
                    )}

                    {!loadingHadith && hadiths.length === 0 && (
                        <div className='text-center py-12 text-gray-400 text-sm'>
                            {t("hadith.not_found_title")}
                        </div>
                    )}

                    {hasMore && !loadingHadith && hadiths.length > 0 && (
                        <div className='text-center mt-6'>
                            <button
                                onClick={loadMore}
                                className='px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors'
                            >
                                {t("hadith.load_more")}
                            </button>
                        </div>
                    )}
                </>
            )}
        </ContentWidth>
    );
}
