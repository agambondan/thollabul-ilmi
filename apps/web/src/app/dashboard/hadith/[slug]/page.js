"use client";

import dynamic from "next/dynamic";
import BookmarkButton from "@/components/BookmarkButton";
import GradeBadge, { HadithAuthenticity } from "@/components/GradeBadge";
import Select, { SelectOptionWithLabel } from "@/components/select/Select";
import { useLocale } from "@/context/Locale";
import { listMasjidImage } from "@/lib/const";
import { CopyImageToClipboard, CopyToClipboard } from "@/lib/copy";
import { getLocalizedTranslation } from "@/lib/translation";
import { useActionPosition } from "@/lib/useActionPosition";
import { useQuranFont } from "@/lib/useQuranFont";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, use } from "react";
import { useRouter } from "next/navigation";
import {
    BsFileEarmarkPlay,
    BsPauseFill,
    BsShare,
    BsThreeDotsVertical,
} from "react-icons/bs";
import { IoIosLink, IoMdCopy, IoMdImages } from "react-icons/io";
import PanelCloseButton from "@/components/PanelCloseButton";

const PopUpIsCopied = dynamic(
    () => import("@/components/popup/ListImage").then((m) => m.PopUpIsCopied),
    { ssr: false },
);
const ShareAyah = dynamic(
    () => import("@/components/popup/ListImage").then((m) => m.ShareAyah),
    { ssr: false },
);

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

// ─── Sanad Panel ─────────────────────────────────────────────────────────────

function SanadPanel({ hadithId, t }) {
    const [sanads, setSanads] = useState(null);
    const [sanadFailed, setSanadFailed] = useState(false);

    useEffect(() => {
        fetch(`${API_URL}/api/v1/hadiths/${hadithId}/sanad`)
            .then((r) => r.json())
            .then((d) =>
                setSanads(Array.isArray(d?.items ?? d) ? (d?.items ?? d) : []),
            )
            .catch(() => setSanadFailed(true));
    }, [hadithId]);

    if (sanadFailed) {
        return (
            <p className='text-xs text-red-500 py-1'>
                {t("common.load_error")}
            </p>
        );
    }
    if (sanads === null) {
        return (
            <p className='text-xs text-gray-400 py-1'>{t("common.loading")}</p>
        );
    }
    if (sanads.length === 0) {
        return (
            <p className='text-xs text-gray-400 py-1'>
                {t("hadith.sanad_empty")}
            </p>
        );
    }

    return (
        <div className='space-y-3'>
            {sanads.map((sanad, sIdx) => (
                <div key={sanad.id ?? sIdx}>
                    {sanads.length > 1 && (
                        <p className='text-xs font-semibold text-gray-500 dark:text-gray-300 dark:text-gray-400 mb-1.5'>
                            Jalur {sanad.nomor_jalur ?? sIdx + 1}
                            {sanad.jenis ? ` — ${sanad.jenis}` : ""}
                        </p>
                    )}
                    {/* Chain visualisation: right-to-left (perawi terdekat Nabi di kanan) */}
                    <div className='flex flex-wrap items-center gap-1 text-xs'>
                        {(sanad.mata_sanad ?? [])
                            .slice()
                            .sort((a, b) => (a.urutan ?? 0) - (b.urutan ?? 0))
                            .map((m, i, arr) => (
                                <span
                                    key={m.id ?? i}
                                    className='flex items-center gap-1'
                                >
                                    <span className='inline-flex flex-col items-center'>
                                        <span className='px-2 py-1 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 dark:text-teal-300 rounded-lg font-medium max-w-[120px] text-center leading-tight'>
                                            {m.perawi?.nama_latin ??
                                                `Perawi ${m.urutan}`}
                                        </span>
                                        {m.metode && (
                                            <span className='text-gray-400 text-[10px]'>
                                                {m.metode}
                                            </span>
                                        )}
                                    </span>
                                    {i < arr.length - 1 && (
                                        <span className='text-gray-400'>←</span>
                                    )}
                                </span>
                            ))}
                    </div>
                    {sanad.catatan && (
                        <p className='text-xs text-gray-400 mt-1.5 italic'>
                            {sanad.catatan}
                        </p>
                    )}
                </div>
            ))}
        </div>
    );
}

// ─── Takhrij Panel ───────────────────────────────────────────────────────────

function TakhrijPanel({ hadithId, t }) {
    const [takhrijList, setTakhrijList] = useState(null);
    const [takhrijFailed, setTakhrijFailed] = useState(false);

    useEffect(() => {
        fetch(`${API_URL}/api/v1/hadiths/${hadithId}/takhrij`)
            .then((r) => r.json())
            .then((d) =>
                setTakhrijList(
                    Array.isArray(d?.items ?? d) ? (d?.items ?? d) : [],
                ),
            )
            .catch(() => setTakhrijFailed(true));
    }, [hadithId]);

    if (takhrijFailed) {
        return (
            <p className='text-xs text-red-500 py-1'>
                {t("common.load_error")}
            </p>
        );
    }
    if (takhrijList === null) {
        return (
            <p className='text-xs text-gray-400 py-1'>
                {t("common.loading") ?? "Memuat..."}
            </p>
        );
    }
    if (takhrijList.length === 0) {
        return (
            <p className='text-xs text-gray-400 py-1'>
                {t("hadith.takhrij_empty")}
            </p>
        );
    }

    return (
        <div className='flex flex-wrap gap-2'>
            {takhrijList.map((tk, idx) => {
                const bookName =
                    getLocalizedTranslation(tk.book?.translation, "ID") ??
                    tk.book?.slug ??
                    "";
                return (
                    <div
                        key={tk.id ?? idx}
                        className='px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-800'
                    >
                        <span className='font-semibold'>{bookName}</span>
                        {tk.nomor_hadis_kitab && (
                            <span className='ml-1 text-blue-500 dark:text-blue-500'>
                                No. {tk.nomor_hadis_kitab}
                            </span>
                        )}
                        {tk.catatan && (
                            <span className='ml-1 text-blue-400 dark:text-blue-600 hidden sm:inline'>
                                — {tk.catatan}
                            </span>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

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
                        className='font-serif italic text-amber-800 dark:text-amber-300 dark:text-amber-400 text-lg leading-none shrink-0'
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
                                <IoIosLink />
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
                                    <BsPauseFill />
                                ) : (
                                    <BsFileEarmarkPlay />
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
                            <BsShare />
                        </button>
                        <div className='relative'>
                            <button
                                type='button'
                                title={t("common.more")}
                                onClick={() => setSettingPopUp((v) => !v)}
                                className='p-2 rounded-lg text-base text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors'
                            >
                                <BsThreeDotsVertical />
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
                                                        <IoIosLink />{" "}
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
                                                    <div className='flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-gray-700 dark:text-gray-200 dark:text-gray-300'>
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
                                                    <BsShare />{" "}
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
                                            <IoIosLink />{" "}
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
                                            <IoMdImages />{" "}
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
                                            <IoMdCopy /> {t("hadith.copy_text")}
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
                    className='text-amber-950 dark:text-amber-300 dark:text-amber-100 leading-relaxed text-justify [text-justify:inter-word] first-letter:font-semibold'
                    style={{ fontSize: `${translationFontSize}px` }}
                >
                    {hadithText}
                </p>
            )}
            {h.perawi && (
                <p className='text-xs italic text-amber-800 dark:text-amber-300 dark:text-amber-400 mt-4 font-medium'>
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

    const [themes, setThemes] = useState([]);
    const [chapters, setChapters] = useState([]);
    const [hadiths, setHadiths] = useState([]);
    const [selectedTheme, setSelectedTheme] = useState(null);
    const [selectedChapter, setSelectedChapter] = useState(null);
    const [loading, setLoading] = useState(showSelectors);
    const [loadingHadith, setLoadingHadith] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [bookName, setBookName] = useState("");

    useEffect(() => {
        if (!showSelectors) return;

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
    }, [slug, lang, showSelectors]);

    useEffect(() => {
        if (!selectedTheme) return;
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
    }, [selectedTheme, slug]);

    useEffect(() => {
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
        <div className='p-4'>
            <Link
                href={basePath}
                className='inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline mb-4'
            >
                ← {t("common.back")}
            </Link>

            <h1 className='text-xl font-bold text-gray-900 dark:text-gray-100 dark:text-white mb-4'>
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
                            <SelectOptionWithLabel
                                id='theme'
                                label={t("hadith.select_theme")}
                                callbackOnChange={(e) => {
                                    const picked = themes.find(
                                        (t) =>
                                            String(themeId(t)) ===
                                            e.target.value,
                                    );
                                    if (picked)
                                        setSelectedTheme(themeId(picked));
                                }}
                                defaultValue={
                                    selectedTheme != null
                                        ? String(selectedTheme)
                                        : ""
                                }
                            >
                                {themes.map((t) => {
                                    const tid = themeId(t);
                                    return (
                                        <Select.Option
                                            key={tid}
                                            value={String(tid)}
                                        >
                                            {themeName(t, lang)}
                                        </Select.Option>
                                    );
                                })}
                            </SelectOptionWithLabel>

                            {chapters.length > 0 && (
                                <SelectOptionWithLabel
                                    id='chapter'
                                    label={t("hadith.select_chapter")}
                                    callbackOnChange={(e) => {
                                        const ch = chapters.find(
                                            (c) =>
                                                String(c.id) === e.target.value,
                                        );
                                        if (ch) setSelectedChapter(ch);
                                    }}
                                    defaultValue={
                                        selectedChapter?.id != null
                                            ? String(selectedChapter.id)
                                            : ""
                                    }
                                >
                                    {chapters.map((c) => (
                                        <Select.Option
                                            key={c.id}
                                            value={String(c.id)}
                                        >
                                            {chapterName(c, lang)}
                                        </Select.Option>
                                    ))}
                                </SelectOptionWithLabel>
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
        </div>
    );
}
