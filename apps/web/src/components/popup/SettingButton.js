"use client";

import { useLocale } from "@/context/Locale";
import { useActionPosition } from "@/lib/useActionPosition";
import { useLayoutMode } from "@/lib/useLayoutMode";
import { QURAN_FONTS, useQuranFont } from "@/lib/useQuranFont";
import { useSettings } from "@/lib/useSettings";
import classNames from "classnames";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
    BsLayoutSidebarReverse,
    BsLayoutSplit,
    BsLayoutTextSidebarReverse,
    BsMenuButtonWide,
    BsEyeSlash,
} from "react-icons/bs";
import { RiSettings3Fill } from "react-icons/ri";

const SettingButton = () => {
    const { t } = useLocale();
    const pathname = usePathname();
    const [showPopup, setShowPopup] = useState(false);
    const { isWide, setLayout } = useLayoutMode();
    const { isMenu, position, setPosition } = useActionPosition();
    const {
        arabicFontSize,
        decreaseArabicFontSize,
        decreaseTranslationFontSize,
        fontId,
        increaseArabicFontSize,
        increaseTranslationFontSize,
        resetArabicFontSize,
        resetTranslationFontSize,
        setFont,
        translationFontSize,
    } = useQuranFont();
    const { settings, updateSetting } = useSettings();
    const hafalanMode = settings.quranHafalanMode ?? "off";
    const readerMode = settings.quranReaderMode ?? "ayah";
    const showMushafTranslation =
        settings.quranMushafTranslation ?? true;
    const popupRef = useRef(null);
    const label = (key, fallback) => t(key) || fallback;

    useEffect(() => {
        if (!showPopup) return;
        const handler = (e) => {
            if (popupRef.current && !popupRef.current.contains(e.target)) {
                setShowPopup(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [showPopup]);

    const isDashboard = pathname?.startsWith("/dashboard");
    const isQuranRoute =
        pathname === "/quran" || pathname?.startsWith("/quran/");
    const bottomClass = isDashboard
        ? "bottom-[84px] md:bottom-4"
        : "bottom-[68px] md:bottom-4";

    return (
        <div
            ref={popupRef}
            data-testid='global-setting-control'
            className={`fixed right-2 z-30 transition-opacity duration-200 ${bottomClass} opacity-90 hover:opacity-100`}
        >
            <button
                type='button'
                data-testid='global-setting-button'
                className='dark:bg-slate-200 bg-slate-800 dark:text-black text-white rounded-full p-3 shadow hover:opacity-80 transition-opacity'
                onClick={() => setShowPopup((p) => !p)}
                title={t("settings.title")}
                aria-label={t("settings.title")}
            >
                <RiSettings3Fill size={24} />
            </button>

            {showPopup && (
                <div className='absolute right-0 bottom-16 bg-white dark:bg-slate-800 border border-emerald-100 dark:border-slate-700 rounded-xl w-64 sm:w-72 max-h-[calc(100vh-8rem)] overflow-y-auto p-3 shadow-lg text-sm text-emerald-900 dark:text-emerald-300 dark:text-white'>
                    <p className='font-semibold mb-3 text-xs text-gray-500 dark:text-gray-300 dark:text-gray-400 uppercase tracking-wide'>
                        {t("settings.title")}
                    </p>

                    {isQuranRoute && (
                        <>
                            {/* Mode Hafalan */}
                            <div className='mb-3'>
                                <p className='text-xs text-gray-500 dark:text-gray-300 dark:text-gray-400 mb-2'>
                                    {label(
                                        "hafalan.mode_label",
                                        "Mode Hafalan",
                                    )}
                                </p>
                                <div className='grid grid-cols-2 gap-1.5'>
                                    {[
                                        {
                                            value: "off",
                                            label: label(
                                                "hafalan.mode_off",
                                                "Mati",
                                            ),
                                        },
                                        {
                                            value: "hide_arabic",
                                            label: label(
                                                "hafalan.mode_hide_arabic",
                                                "Sembunyikan Arab",
                                            ),
                                        },
                                        {
                                            value: "hide_translation",
                                            label: label(
                                                "hafalan.mode_hide_translation",
                                                "Sembunyikan Terjemahan",
                                            ),
                                        },
                                        {
                                            value: "hide_all",
                                            label: label(
                                                "hafalan.mode_hide_all",
                                                "Sembunyikan Semua",
                                            ),
                                        },
                                    ].map((m) => (
                                        <button
                                            key={m.value}
                                            type='button'
                                            onClick={() =>
                                                updateSetting(
                                                    "quranHafalanMode",
                                                    m.value,
                                                )
                                            }
                                            className={classNames(
                                                "py-1.5 px-2 rounded-lg border text-[11px] sm:text-xs leading-snug text-center transition-all",
                                                {
                                                    "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-semibold":
                                                        hafalanMode === m.value,
                                                    "border-gray-200 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-slate-500":
                                                        hafalanMode !== m.value,
                                                },
                                            )}
                                        >
                                            {m.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Tampilan (Daftar / Alur Mushaf) */}
                            <div className='mb-3'>
                                <p className='text-xs text-gray-500 dark:text-gray-300 dark:text-gray-400 mb-2'>
                                    {label("mushaf.view", "Tampilan")}
                                </p>
                                <div className='flex gap-2'>
                                    {[
                                        {
                                            value: "ayah",
                                            label: label(
                                                "mushaf.list",
                                                "Daftar",
                                            ),
                                        },
                                        {
                                            value: "mushaf",
                                            label: label(
                                                "mushaf.continuous",
                                                "Alur (Mushaf)",
                                            ),
                                        },
                                    ].map((m) => (
                                        <button
                                            key={m.value}
                                            type='button'
                                            onClick={() =>
                                                updateSetting(
                                                    "quranReaderMode",
                                                    m.value,
                                                )
                                            }
                                            className={classNames(
                                                "flex-1 py-1.5 px-2 rounded-lg border text-xs text-center transition-all",
                                                {
                                                    "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-semibold":
                                                        readerMode === m.value,
                                                    "border-gray-200 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-slate-500":
                                                        readerMode !== m.value,
                                                },
                                            )}
                                        >
                                            {m.label}
                                        </button>
                                    ))}
                                </div>
                                {readerMode === "mushaf" && (
                                    <button
                                        type='button'
                                        onClick={() =>
                                            updateSetting(
                                                "quranMushafTranslation",
                                                !showMushafTranslation,
                                            )
                                        }
                                        className={classNames(
                                            "mt-1.5 w-full py-1.5 px-2 rounded-lg border text-xs text-center transition-all",
                                            {
                                                "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-semibold":
                                                    showMushafTranslation,
                                                "border-gray-200 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-slate-500":
                                                    !showMushafTranslation,
                                            },
                                        )}
                                    >
                                        {showMushafTranslation
                                            ? label(
                                                  "mushaf.translation_off",
                                                  "Sembunyikan Terjemahan",
                                              )
                                            : label(
                                                  "mushaf.translation_on",
                                                  "Tampilkan Terjemahan",
                                              )}
                                    </button>
                                )}
                            </div>

                            <div className='my-3 border-t border-gray-100 dark:border-slate-700' />
                        </>
                    )}

                    {/* Layout toggle */}
                    <div className='hidden md:block mb-3'>
                        <p className='text-xs text-gray-500 dark:text-gray-300 dark:text-gray-400 mb-2'>
                            {t("settings.ayah_layout")}
                        </p>
                        <div className='flex gap-2'>
                            <button
                                onClick={() => setLayout(false)}
                                title={t("settings.compact")}
                                aria-label={t("settings.compact")}
                                className={classNames(
                                    "flex-1 flex justify-center items-center py-2 px-1 rounded-lg border text-xs transition-all",
                                    {
                                        "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-semibold":
                                            !isWide,
                                        "border-gray-200 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-slate-500":
                                            isWide,
                                    },
                                )}
                            >
                                <BsLayoutSidebarReverse size={18} />
                            </button>
                            <button
                                onClick={() => setLayout(true)}
                                title={t("settings.wide")}
                                aria-label={t("settings.wide")}
                                className={classNames(
                                    "flex-1 flex justify-center items-center py-2 px-1 rounded-lg border text-xs transition-all",
                                    {
                                        "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-semibold":
                                            isWide,
                                        "border-gray-200 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-slate-500":
                                            !isWide,
                                    },
                                )}
                            >
                                <BsLayoutSplit size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Action layout */}
                    <div className='mb-3'>
                        <p className='text-xs text-gray-500 dark:text-gray-300 dark:text-gray-400 mb-2'>
                            {label(
                                "settings.action_position",
                                "Aksi Ayat/Hadith",
                            )}
                        </p>
                        <div className='grid grid-cols-3 gap-2'>
                            <button
                                onClick={() => setPosition("side")}
                                title={label("settings.action_side", "Samping")}
                                aria-label={label(
                                    "settings.action_side",
                                    "Samping",
                                )}
                                className={classNames(
                                    "flex justify-center items-center py-2 px-1 rounded-lg border text-xs transition-all",
                                    {
                                        "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-semibold":
                                            position === "side",
                                        "border-gray-200 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-slate-500":
                                            position !== "side",
                                    },
                                )}
                            >
                                <BsLayoutTextSidebarReverse size={16} />
                            </button>
                            <button
                                onClick={() => setPosition("menu")}
                                title={label("settings.action_menu", "Menu")}
                                aria-label={label(
                                    "settings.action_menu",
                                    "Menu",
                                )}
                                className={classNames(
                                    "flex justify-center items-center py-2 px-1 rounded-lg border text-xs transition-all",
                                    {
                                        "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-semibold":
                                            isMenu,
                                        "border-gray-200 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-slate-500":
                                            !isMenu,
                                    },
                                )}
                            >
                                <BsMenuButtonWide size={16} />
                            </button>
                            <button
                                onClick={() => setPosition("hidden")}
                                title={label("settings.action_hidden", "Hide")}
                                aria-label={label(
                                    "settings.action_hidden",
                                    "Hide",
                                )}
                                className={classNames(
                                    "flex justify-center items-center py-2 px-1 rounded-lg border text-xs transition-all",
                                    {
                                        "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-semibold":
                                            position === "hidden",
                                        "border-gray-200 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-slate-500":
                                            position !== "hidden",
                                    },
                                )}
                            >
                                <BsEyeSlash size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Arabic font size */}
                    <div className='mb-3'>
                        <p className='text-xs text-gray-500 dark:text-gray-300 dark:text-gray-400 mb-2'>
                            {label(
                                "settings.arabic_size",
                                "Ukuran Arab (Quran/Hadis)",
                            )}
                        </p>
                        <div className='flex items-center gap-2'>
                            <button
                                type='button'
                                onClick={decreaseArabicFontSize}
                                className='h-9 w-10 rounded-lg border border-gray-200 dark:border-gray-700 dark:border-slate-600 text-sm font-bold text-gray-600 dark:text-gray-300 hover:border-emerald-400 hover:text-emerald-600 transition-colors'
                                aria-label={t("settings.decrease_arabic_size")}
                            >
                                A-
                            </button>
                            <button
                                type='button'
                                onClick={resetArabicFontSize}
                                className='h-9 flex-1 rounded-lg border border-gray-200 dark:border-gray-700 dark:border-slate-600 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:border-emerald-400 hover:text-emerald-600 transition-colors'
                            >
                                {arabicFontSize}px
                            </button>
                            <button
                                type='button'
                                onClick={increaseArabicFontSize}
                                className='h-9 w-10 rounded-lg border border-gray-200 dark:border-gray-700 dark:border-slate-600 text-sm font-bold text-gray-600 dark:text-gray-300 hover:border-emerald-400 hover:text-emerald-600 transition-colors'
                                aria-label={t("settings.increase_arabic_size")}
                            >
                                A+
                            </button>
                        </div>
                    </div>

                    {/* Translation font size */}
                    <div className='mb-3'>
                        <p className='text-xs text-gray-500 dark:text-gray-300 dark:text-gray-400 mb-2'>
                            {label(
                                "settings.translation_size",
                                "Ukuran Terjemahan",
                            )}
                        </p>
                        <div className='flex items-center gap-2'>
                            <button
                                type='button'
                                onClick={decreaseTranslationFontSize}
                                className='h-9 w-10 rounded-lg border border-gray-200 dark:border-gray-700 dark:border-slate-600 text-sm font-bold text-gray-600 dark:text-gray-300 hover:border-emerald-400 hover:text-emerald-600 transition-colors'
                                aria-label={t(
                                    "settings.decrease_translation_size",
                                )}
                            >
                                T-
                            </button>
                            <button
                                type='button'
                                onClick={resetTranslationFontSize}
                                className='h-9 flex-1 rounded-lg border border-gray-200 dark:border-gray-700 dark:border-slate-600 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:border-emerald-400 hover:text-emerald-600 transition-colors'
                            >
                                {translationFontSize}px
                            </button>
                            <button
                                type='button'
                                onClick={increaseTranslationFontSize}
                                className='h-9 w-10 rounded-lg border border-gray-200 dark:border-gray-700 dark:border-slate-600 text-sm font-bold text-gray-600 dark:text-gray-300 hover:border-emerald-400 hover:text-emerald-600 transition-colors'
                                aria-label={t(
                                    "settings.increase_translation_size",
                                )}
                            >
                                T+
                            </button>
                        </div>
                    </div>

                    {/* Arabic font selector */}
                    <div>
                        <p className='text-xs text-gray-500 dark:text-gray-300 dark:text-gray-400 mb-2'>
                            {t("settings.arabic_font")}
                        </p>
                        <div className='flex flex-col gap-1'>
                            {QURAN_FONTS.map((font) => (
                                <button
                                    key={font.id}
                                    onClick={() => setFont(font.id)}
                                    className={classNames(
                                        "flex items-center justify-between px-3 py-2 rounded-lg border text-xs transition-all",
                                        {
                                            "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-semibold":
                                                fontId === font.id,
                                            "border-gray-200 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-slate-500":
                                                fontId !== font.id,
                                        },
                                    )}
                                >
                                    <span>{font.label}</span>
                                    <span
                                        className={`${font.cls} text-base leading-none`}
                                        style={{ direction: "rtl" }}
                                    >
                                        بِسْمِ
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingButton;
