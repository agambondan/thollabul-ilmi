"use client";

import BookmarkButton from "@/components/BookmarkButton";
import NoteButton from "@/components/NoteButton";
import { PopUpIsCopied, ShareAyah } from "@/components/popup/ListImage";
import { mufrodatApi, munasabahApi, tafsirApi } from "@/lib/api";
import { useLocale } from "@/context/Locale";
import { listMasjidImage } from "@/lib/const";
import { NumberToArabic } from "@/lib/converter";
import { CopyImageToClipboard, CopyToClipboard } from "@/lib/copy";
import { openSurahAudio } from "@/lib/audioEvents";
import { getSurahName } from "@/lib/surahList";
import { getLocalizedTranslation } from "@/lib/translation";
import { useActionPosition } from "@/lib/useActionPosition";
import { useAsyncResource } from "@/lib/useAsyncResource";
import PanelStatus from "@/components/PanelStatus";
import { useQuranFont } from "@/lib/useQuranFont";
import classNames from "classnames";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    BsBook,
    BsFileEarmarkPlay,
    BsLink45Deg,
    BsShare,
    BsThreeDotsVertical,
    BsTranslate,
    BsExclamationTriangleFill,
} from "react-icons/bs";
import { IoIosLink, IoMdCopy, IoMdImages } from "react-icons/io";
import PanelCloseButton from "@/components/PanelCloseButton";
import ContentReportModal from "@/components/ContentReportModal";
import { sanitizeHtml } from "@/lib/sanitizeHtml";
import SourceBadges from "@/components/SourceBadges";

const AyahPage = ({
    surah,
    ayah,
    newLimit,
    isLast,
    hafalanMode = "off",
    showTranslation = true,
    isActionMenuOpen,
    onActionMenuToggle,
}) => {
    const { t, lang } = useLocale();
    const { arabicFontSize, fontCls, translationFontSize } = useQuranFont();
    const { isHidden: actionsHidden, isMenu: actionsMenu } =
        useActionPosition();
    const cardRef = useRef();
    const [isCopied, SetIsCopied] = useState(false);
    const [reportOpen, setReportOpen] = useState(false);
    const [localSettingPopUp, setLocalSettingPopUp] = useState(false);
    const [clipboardPopUp, SetClipboardPopUp] = useState(false);
    const [shareImagePopUp, SetShareImagePopUp] = useState(false);
    const [openUpwards, setOpenUpwards] = useState(false);
    const menuButtonRef = useRef(null);
    const menuContainerRef = useRef(null);

    const [tafsirOpen, setTafsirOpen] = useState(false);
    const tafsirRes = useAsyncResource(() => tafsirApi.byAyah(ayah.id));

    const [mufrodatOpen, setMufrodatOpen] = useState(false);
    const mufrodatRes = useAsyncResource(() => mufrodatApi.byAyah(ayah.id));

    const [munasabahOpen, setMunasabahOpen] = useState(false);
    const munasabahRes = useAsyncResource(() => munasabahApi.byAyah(ayah.id));

    const [revealed, setRevealed] = useState(false);
    const ayahTranslation = getLocalizedTranslation(ayah.translation, lang);
    const ayahLatin =
        ayah.translation?.latin_idn ?? ayah.translation?.latin_en ?? "";
    const settingPopUp =
        typeof isActionMenuOpen === "boolean"
            ? isActionMenuOpen
            : localSettingPopUp;
    const SetSettingPopUp = useCallback(
        (nextValue) => {
            if (onActionMenuToggle) {
                const next =
                    typeof nextValue === "function"
                        ? nextValue(isActionMenuOpen)
                        : nextValue;
                onActionMenuToggle(next);
                return;
            }
            setLocalSettingPopUp((prev) =>
                typeof nextValue === "function" ? nextValue(prev) : nextValue,
            );
        },
        [isActionMenuOpen, onActionMenuToggle],
    );

    const hideArabic = hafalanMode === "hide_arabic" && !revealed;
    const hideTranslation = hafalanMode === "hide_translation" && !revealed;
    const hideAll = hafalanMode === "hide_all" && !revealed;
    const arabicHtml = ayah.translation?.ar_html || ayah.translation?.ar || "";

    const copyText = (value) => {
        CopyToClipboard(value);
        SetClipboardPopUp(true);
        setTimeout(() => SetClipboardPopUp(false), 2000);
    };

    const actionMenuButtonClass =
        "flex w-full items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-emerald-50 dark:hover:bg-slate-700 transition-colors text-left";

    useEffect(() => {
        if (!settingPopUp) return undefined;
        const handleOutside = (event) => {
            const target = event.target;
            if (
                menuContainerRef.current?.contains(target) ||
                menuButtonRef.current?.contains(target)
            ) {
                return;
            }
            SetSettingPopUp(false);
        };
        const handleKey = (event) => {
            if (event.key === "Escape") {
                SetSettingPopUp(false);
            }
        };
        document.addEventListener("mousedown", handleOutside);
        document.addEventListener("touchstart", handleOutside);
        document.addEventListener("keydown", handleKey);
        return () => {
            document.removeEventListener("mousedown", handleOutside);
            document.removeEventListener("touchstart", handleOutside);
            document.removeEventListener("keydown", handleKey);
        };
    }, [settingPopUp, SetSettingPopUp]);

    const toggleSettingPopUp = () => {
        if (!settingPopUp && menuButtonRef.current) {
            const rect = menuButtonRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            // If the toggle is close to the bottom of the viewport, open the
            // menu upwards so its long list is never clipped by the card edge
            // or the floating surah navigation at the bottom.
            setOpenUpwards(spaceBelow < 360);
        }
        SetSettingPopUp(!settingPopUp);
    };

    useEffect(() => {
        if (!cardRef?.current) return;
        const observer = new IntersectionObserver(([entry]) => {
            if (isLast && entry.isIntersecting) {
                newLimit();
                observer.unobserve(entry.target);
            }
        });
        observer.observe(cardRef.current);
        return () => observer.disconnect();
    }, [isLast, newLimit]);

    const toggleTafsir = () => {
        if (!tafsirOpen) tafsirRes.load();
        setTafsirOpen((v) => !v);
    };

    const toggleMufrodat = () => {
        if (!mufrodatOpen) mufrodatRes.load();
        setMufrodatOpen((v) => !v);
    };

    const toggleMunasabah = () => {
        if (!munasabahOpen) munasabahRes.load();
        setMunasabahOpen((v) => !v);
    };

    const handleAudio = () => {
        openSurahAudio({
            surahNumber: surah.number,
            ayahNumber: ayah.number,
        });
    };

    return (
        <div ref={cardRef} id={`ayah-${ayah.number}`}>
            {clipboardPopUp && (
                <div className='fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-full shadow-lg'>
                    {t("ayah.copied_to_clipboard")}
                </div>
            )}
            {shareImagePopUp && (
                <ShareAyah
                    images={listMasjidImage}
                    isCopiedCallback={() => SetShareImagePopUp(false)}
                    text={`${t("ayah.allah_says")}\n`
                        .concat(`${ayah.translation.ar} `)
                        .concat(`۝${NumberToArabic(ayah.number)}\n`)
                        .concat(ayahLatin ? `${ayahLatin}\n` : "")
                        .concat(`${ayahTranslation}\n`)
                        .concat(
                            `${t("ayah.citation", { latin: getSurahName(surah, lang) || surah.translation?.latin_en, number: surah.number, verse: t("common.verse"), ayah: ayah.number })}\n`.concat(
                                `${t("ayah.via")} ${window.location.href.split("#")[0]}#ayah-${ayah.number}`,
                            ),
                        )}
                />
            )}

            <ul
                className={classNames({
                    "flex flex-col md:flex-row md:justify-between px-3 py-3 md:p-4 border-b border-gray-100 dark:border-slate-800": true,
                    "bg-gray-50/60 dark:bg-slate-800/35": ayah.number % 2 === 1,
                    "bg-white dark:bg-slate-900": ayah.number % 2 === 0,
                    "text-gray-900 dark:text-white": true,
                })}
            >
                {!actionsHidden && (
                    <ul
                        className='flex flex-row flex-wrap items-center w-full gap-0.5 pb-1 md:flex-col md:flex-nowrap md:w-auto md:gap-1 md:p-2 md:pb-2'
                        style={{ direction: "ltr" }}
                    >
                        <li className='flex justify-center text-sm font-medium text-gray-500 dark:text-gray-300 dark:text-gray-400 mr-auto md:mr-0 md:pb-1'>
                            {surah.number}:{ayah.number}
                        </li>
                        <li
                            className={
                                actionsMenu ? "hidden" : "flex justify-center"
                            }
                        >
                            <button
                                title={t("ayah.audio_play")}
                                onClick={handleAudio}
                                className='p-2 rounded-lg text-lg transition-colors text-gray-400 hover:bg-emerald-100 dark:hover:bg-slate-700'
                            >
                                <BsFileEarmarkPlay />
                            </button>
                        </li>
                        <li
                            className={
                                actionsMenu ? "hidden" : "flex justify-center"
                            }
                        >
                            <button
                                title={t("tafsir.title")}
                                onClick={toggleTafsir}
                                className={`p-2 rounded-lg text-lg transition-colors ${
                                    tafsirOpen
                                        ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
                                        : "text-gray-400 hover:bg-emerald-100 dark:hover:bg-slate-700"
                                }`}
                            >
                                <BsBook />
                            </button>
                        </li>
                        <li
                            className={
                                actionsMenu ? "hidden" : "flex justify-center"
                            }
                        >
                            <button
                                title={t("ayah.mufrodat_title")}
                                onClick={toggleMufrodat}
                                className={`p-2 rounded-lg text-lg transition-colors ${
                                    mufrodatOpen
                                        ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
                                        : "text-gray-400 hover:bg-emerald-100 dark:hover:bg-slate-700"
                                }`}
                            >
                                <BsTranslate />
                            </button>
                        </li>
                        <li
                            className={
                                actionsMenu ? "hidden" : "flex justify-center"
                            }
                        >
                            <button
                                title={t("munasabah.title") ?? "Ayat Terkait"}
                                onClick={toggleMunasabah}
                                className={`p-2 rounded-lg text-lg transition-colors ${
                                    munasabahOpen
                                        ? "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20"
                                        : "text-gray-400 hover:bg-purple-100 dark:hover:bg-slate-700"
                                }`}
                            >
                                <BsLink45Deg />
                            </button>
                        </li>
                        <li
                            className={
                                actionsMenu ? "hidden" : "flex justify-center"
                            }
                        >
                            <BookmarkButton refType='ayah' refId={ayah.id} />
                        </li>
                        <li
                            className={
                                actionsMenu ? "hidden" : "flex justify-center"
                            }
                        >
                            <NoteButton refType='ayah' refId={ayah.id} />
                        </li>
                        <li
                            className={
                                actionsMenu ? "hidden" : "flex justify-center"
                            }
                        >
                            <button
                                title={t("common.share")}
                                onClick={() => SetShareImagePopUp(true)}
                                className='p-2 rounded-lg text-lg hover:bg-emerald-100 dark:hover:bg-slate-700 transition-colors'
                            >
                                <BsShare />
                            </button>
                        </li>
                        <li className='flex justify-center relative'>
                            <button
                                ref={menuButtonRef}
                                title={t("common.more")}
                                onClick={toggleSettingPopUp}
                                className='p-2 rounded-lg text-lg hover:bg-emerald-100 dark:hover:bg-slate-700 transition-colors'
                            >
                                <BsThreeDotsVertical />
                            </button>
                            {settingPopUp && (
                                <div
                                    ref={menuContainerRef}
                                    className={`absolute z-50 w-56 p-1 rounded-xl border border-emerald-100 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xl text-emerald-900 dark:text-emerald-300 dark:text-white max-h-[min(380px,calc(100vh-120px))] overflow-y-auto overscroll-contain ${
                                        openUpwards
                                            ? "bottom-9 md:bottom-0 top-auto right-0 md:right-auto md:left-9"
                                            : "top-9 md:top-0 bottom-auto right-0 md:right-auto md:left-9"
                                    }`}
                                >
                                    <div className='flex flex-col'>
                                        {actionsMenu && (
                                            <div className='border-b border-emerald-50 dark:border-slate-700 pb-1 mb-1'>
                                                <button
                                                    className={
                                                        actionMenuButtonClass
                                                    }
                                                    onClick={() => {
                                                        handleAudio();
                                                        SetSettingPopUp(false);
                                                    }}
                                                >
                                                    <BsFileEarmarkPlay />
                                                    {t("ayah.audio_play")}
                                               </button>
                                                <button
                                                    className={
                                                        actionMenuButtonClass
                                                    }
                                                    onClick={() => {
                                                        toggleTafsir();
                                                        SetSettingPopUp(false);
                                                    }}
                                                >
                                                    <BsBook />
                                                    {t("tafsir.title")}
                                                </button>
                                                <button
                                                    className={
                                                        actionMenuButtonClass
                                                    }
                                                    onClick={() => {
                                                        toggleMufrodat();
                                                        SetSettingPopUp(false);
                                                    }}
                                                >
                                                    <BsTranslate />
                                                    {t("ayah.mufrodat_title")}
                                                </button>
                                                <button
                                                    className={
                                                        actionMenuButtonClass
                                                    }
                                                    onClick={() => {
                                                        toggleMunasabah();
                                                        SetSettingPopUp(false);
                                                    }}
                                                >
                                                    <BsLink45Deg />
                                                    {t("munasabah.title") ??
                                                        "Ayat Terkait"}
                                                </button>
                                                {/* Ikon di KIRI lalu label, sama seperti item lain di menu ini.
                                                    Sebelumnya barisnya memakai justify-between dengan label dulu,
                                                    jadi ikonnya terdorong ke tepi kanan sendirian.
                                                    BookmarkButton membawa p-2 dan text-lg sendiri, jadi keduanya
                                                    dinetralkan agar sebaris rapi dengan ikon saudaranya. */}
                                                <div className='flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-emerald-50 dark:hover:bg-slate-700 transition-colors'>
                                                    <BookmarkButton
                                                        refType='ayah'
                                                        refId={ayah.id}
                                                        className="!p-0 !text-base relative before:absolute before:-inset-2 before:content-['']"
                                                    />
                                                    <span>
                                                        {t(
                                                            "ayah.bookmark_label",
                                                        )}
                                                    </span>
                                                </div>
                                                <div className='flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-emerald-50 dark:hover:bg-slate-700 transition-colors'>
                                                    <NoteButton
                                                        refType='ayah'
                                                        refId={ayah.id}
                                                        className="!p-0 !text-base relative before:absolute before:-inset-2 before:content-['']"
                                                    />
                                                    <span>
                                                        {t("ayah.note_label")}
                                                    </span>
                                                </div>
                                                <button
                                                    className={
                                                        actionMenuButtonClass
                                                    }
                                                    onClick={() => {
                                                        SetShareImagePopUp(
                                                            true,
                                                        );
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
                                            onClick={() =>
                                                copyText(
                                                    `${window.location.href.split("#")[0]}#ayah-${ayah.number}`,
                                                )
                                            }
                                        >
                                            <IoIosLink />
                                            {t("ayah.copy_link")}
                                        </button>
                                        <button
                                            className={actionMenuButtonClass}
                                            onClick={() => {
                                                SetSettingPopUp(false);
                                                setTimeout(() => {
                                                    import("html2canvas")
                                                        .then(
                                                            ({
                                                                default:
                                                                    html2canvas,
                                                            }) =>
                                                                html2canvas(
                                                                    document.getElementById(
                                                                        `${surah.translation.latin_en}-${ayah.number}`,
                                                                    ),
                                                                ),
                                                        )
                                                        .then((canvas) => {
                                                            CopyImageToClipboard(
                                                                canvas,
                                                            );
                                                            SetIsCopied(true);
                                                            setTimeout(
                                                                () =>
                                                                    SetIsCopied(
                                                                        false,
                                                                    ),
                                                                1000,
                                                            );
                                                        });
                                                }, 1000);
                                            }}
                                        >
                                            <IoMdImages />
                                            {t("ayah.copy_image")}
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
                                            onClick={() =>
                                                copyText(
                                                    `${t("ayah.allah_says")}\n\n`
                                                        .concat(
                                                            `${ayah.translation.ar}\n\n`,
                                                        )
                                                        .concat(
                                                            ayahLatin
                                                                ? `${ayahLatin}\n\n`
                                                                : "",
                                                        )
                                                        .concat(
                                                            `${ayahTranslation}\n\n`,
                                                        )
                                                        .concat(
                                                            `${t("ayah.citation", { latin: getSurahName(surah, lang) || surah.translation?.latin_en, number: surah.number, verse: t("common.verse"), ayah: ayah.number })}\n`.concat(
                                                                `${t("ayah.via")} ${window.location.href.split("#")[0]}#ayah-${ayah.number}`,
                                                            ),
                                                        ),
                                                )
                                            }
                                        >
                                            <IoMdCopy />
                                            {t("ayah.copy_ayah")}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </li>
                    </ul>
                )}

                <ul
                    className={`flex flex-col w-full justify-center ${fontCls}`}
                    style={{ direction: "rtl" }}
                >
                    <li
                        style={{
                            fontSize: `${arabicFontSize}px`,
                            lineHeight: "2.10",
                        }}
                        className={
                            hideArabic || hideAll ? "hidden" : ""
                        }
                        dangerouslySetInnerHTML={{
                            __html: sanitizeHtml(arabicHtml).concat(
                                `&nbsp;<span class="font-kitab">&#x06DD;${NumberToArabic(ayah.number)}</span>`,
                            ),
                        }}
                    />
                    {showTranslation && ayah.translation.latin_idn && (
                        <li
                            className={`text-left py-2 md:p-2 text-sm text-gray-500 dark:text-gray-400 italic ${hideTranslation || hideAll ? "hidden" : ""}`}
                            style={{ direction: "ltr" }}
                        >
                            {ayah.translation.latin_idn}
                       </li>
                    )}
                    {showTranslation && (
                        <li
                            className={`text-left py-2 md:p-2 ${hideTranslation || hideAll ? "hidden" : ""}`}
                            style={{
                                direction: "ltr",
                                fontSize: `${translationFontSize}px`,
                                lineHeight: "1.75",
                            }}
                        >
                            {ayahTranslation}
                       </li>
                    )}
                    {hafalanMode !== "off" && (
                        <li
                            className='pb-2 md:px-2'
                            style={{ direction: "ltr" }}
                        >
                            <button
                                type='button'
                                onClick={() => setRevealed((v) => !v)}
                                className='text-xs px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors'
                            >
                                {revealed
                                    ? (t("hafalan.hide_again") ??
                                      "Sembunyikan lagi")
                                    : (t("hafalan.reveal") ?? "Tampilkan")}
                            </button>
                        </li>
                    )}
                </ul>
            </ul>

            {tafsirOpen && (
                <div className='bg-amber-50 dark:bg-amber-900/10 border-b border-amber-100 dark:border-amber-900/30 px-4 py-4'>
                    <div className='flex items-start justify-between gap-3 mb-3'>
                        <p className='text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide'>
                            {t("ayah.tafsir_label")} {surah.number}:
                            {ayah.number}
                        </p>
                        <PanelCloseButton
                            onClose={() => setTafsirOpen(false)}
                        />
                    </div>
                    <PanelStatus
                        isLoading={tafsirRes.isLoading}
                        error={tafsirRes.error}
                        isEmpty={tafsirRes.data?.length === 0}
                        loadingText={t("ayah.loading_tafsir")}
                        emptyText={t("ayah.tafsir_empty")}
                        onRetry={tafsirRes.retry}
                    />
                    {!tafsirRes.isLoading &&
                        Array.isArray(tafsirRes.data) &&
                        tafsirRes.data.map((entry, i) => (
                            <div key={i} className='mb-4 last:mb-0'>
                                {entry.source && <SourceBadges source={entry.source} />}
                                <p className='text-sm text-gray-700 dark:text-gray-200 dark:text-gray-300 leading-relaxed'>
                                    {entry.text ?? entry.content}
                                </p>
                            </div>
                        ))}
                </div>
            )}

            {mufrodatOpen && (
                <div className='bg-sky-50 dark:bg-sky-900/10 border-b border-sky-100 dark:border-sky-900/30 px-4 py-4'>
                    <div className='flex items-start justify-between gap-3 mb-3'>
                        <p className='text-xs font-semibold text-sky-700 dark:text-sky-400 uppercase tracking-wide'>
                            {t("ayah.mufrodat_label")} {surah.number}:
                            {ayah.number}
                        </p>
                        <PanelCloseButton
                            onClose={() => setMufrodatOpen(false)}
                        />
                    </div>
                    <PanelStatus
                        isLoading={mufrodatRes.isLoading}
                        error={mufrodatRes.error}
                        isEmpty={mufrodatRes.data?.length === 0}
                        loadingText={t("ayah.loading_mufrodat")}
                        emptyText={t("ayah.mufrodat_empty")}
                        onRetry={mufrodatRes.retry}
                    />
                    {!mufrodatRes.isLoading &&
                        Array.isArray(mufrodatRes.data) && (
                            <div
                                className='flex flex-wrap gap-2'
                                style={{ direction: "rtl" }}
                            >
                                {mufrodatRes.data.map((word, i) => (
                                    <div
                                        key={i}
                                        className='text-center bg-white dark:bg-slate-800 rounded-lg border border-sky-100 dark:border-slate-700 px-3 py-2 min-w-[60px]'
                                    >
                                        <p
                                            className='text-lg font-bold text-emerald-900 dark:text-emerald-300 dark:text-white mb-0.5'
                                            style={{
                                                fontFamily: "Amiri, serif",
                                            }}
                                        >
                                            {word.arabic}
                                        </p>
                                        {word.transliteration && (
                                            <p className='text-xs italic text-gray-400 mb-0.5'>
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
                    <div className='flex items-start justify-between gap-3 mb-3'>
                        <p className='text-xs font-semibold text-purple-700 dark:text-purple-400 uppercase tracking-wide'>
                            {t("munasabah.title") ?? "Ayat Terkait"}{" "}
                            {surah.number}:{ayah.number}
                        </p>
                        <PanelCloseButton
                            onClose={() => setMunasabahOpen(false)}
                        />
                    </div>
                    <PanelStatus
                        isLoading={munasabahRes.isLoading}
                        error={munasabahRes.error}
                        isEmpty={munasabahRes.data?.length === 0}
                        loadingText={t("ayah.loading_tafsir")}
                        emptyText={t("munasabah.empty")}
                        onRetry={munasabahRes.retry}
                    />
                    {!munasabahRes.isLoading &&
                        Array.isArray(munasabahRes.data) &&
                        munasabahRes.data.map((m, i) => (
                            <div
                                key={i}
                                className='mb-3 last:mb-0 bg-white dark:bg-slate-800 rounded-lg p-3'
                            >
                                <p className='text-xs text-purple-600 dark:text-purple-400 font-medium mb-1'>
                                    {m.ayah_from?.surah?.translation
                                        ?.latin_en ??
                                        `QS ${m.ayah_from?.surah?.number}:${m.ayah_from?.number}`}{" "}
                                    ↔{" "}
                                    {m.ayah_to?.surah?.translation?.latin_en ??
                                        `QS ${m.ayah_to?.surah?.number}:${m.ayah_to?.number}`}
                                </p>
                                <p className='text-sm text-gray-700 dark:text-gray-200 dark:text-gray-300'>
                                    {m.description}
                                </p>
                            </div>
                        ))}
                </div>
            )}

            {isCopied && <PopUpIsCopied />}
            {reportOpen && (
                <ContentReportModal
                    isOpen={reportOpen}
                    onClose={() => setReportOpen(false)}
                    targetType="quran"
                    targetId={`${surah?.number || ""}:${ayah?.number || ""}`}
                    targetTitle={`QS. ${surah?.translation?.latin_en || surah?.number}:${ayah?.number}`}
                    snippet={ayahTranslation || ayah?.translation?.ar}
                />
            )}
        </div>
    );
};

export default AyahPage;
