"use client";

import { useLocale } from "@/context/Locale";
import { useLayoutMode } from "@/lib/useLayoutMode";
import {
    asmaulHusnaData,
    asmaulHusnaGeneralDalil,
} from "@/lib/asmaulHusnaData";
import { getLocalizedText } from "@/lib/translation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import {
    BsLink45Deg,
    BsPauseFill,
    BsPlayFill,
    BsSearch,
    BsVolumeUpFill,
} from "react-icons/bs";
import { GiPrayerBeads } from "react-icons/gi";
import { MdOutlineFlipCameraAndroid } from "react-icons/md";
import { useModalA11y } from "@/lib/useModalA11y";
import SourceBadges from "@/components/SourceBadges";

export default function AsmaulHusnaClient({ initialNames = [] }) {
    const { t, lang } = useLocale();
    const { isWide } = useLayoutMode();
    const pathname = usePathname();
    const flashcardHref = pathname?.startsWith("/dashboard")
        ? "/dashboard/asmaul-husna/flashcard"
        : "/asmaul-husna/flashcard";
    const [names] = useState(initialNames);
    const [selected, setSelected] = useState(null);
    const [search, setSearch] = useState("");
    const [playing, setPlaying] = useState(false);
    const audioRef = useRef(null);

    const filteredNames = names.filter((name) => {
        const query = search.trim().toLowerCase();
        if (!query) return true;
        return (
            name.arabic.includes(query) ||
            name.transliteration.toLowerCase().includes(query) ||
            getLocalizedText({ idn: name.indonesian, en: name.english }, lang)
                .toLowerCase()
                .includes(query)
        );
    });

    const playAudio = (url) => {
        if (!url) return;
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = "";
        }
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => setPlaying(false);
        audio.onerror = () => setPlaying(false);
        audio
            .play()
            .then(() => setPlaying(true))
            .catch(() => setPlaying(false));
    };

    const stopAudio = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = "";
        }
        setPlaying(false);
    };

    const modalA11y = useModalA11y({
        open: !!selected,
        onClose: () => closeModal(),
    });

    const closeModal = () => {
        stopAudio();
        setSelected(null);
    };

    return (
        <div
            className={
                isWide ? "w-full px-4" : "container mx-auto px-4 max-w-5xl"
            }
        >
            <div className='text-center mb-8'>
                <p
                    className='text-3xl text-emerald-700 dark:text-emerald-400 mb-2'
                    style={{ fontFamily: "Amiri, serif" }}
                >
                    أَسْمَاءُ اللهِ الْحُسْنَى
                </p>
                <h1 className='text-2xl font-bold text-emerald-900 dark:text-emerald-300 dark:text-white mb-1'>
                    Asmaul Husna
                </h1>
                <p className='text-sm text-gray-500 dark:text-gray-300 dark:text-gray-400'>
                    {t("asmaul.subtitle")}
                </p>
                {names[0]?.source && (
                    <div className='mt-2 flex justify-center'>
                        <SourceBadges source={names[0].source} />
                    </div>
                )}
            </div>

            {/* Flashcard shortcut */}
            <Link
                href={flashcardHref}
                className='flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-3 mb-4 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors group'
            >
                <MdOutlineFlipCameraAndroid className='text-2xl text-emerald-600 dark:text-emerald-400 shrink-0' />
                <div className='flex-1 min-w-0'>
                    <p className='text-sm font-semibold text-emerald-800 dark:text-emerald-300 group-hover:underline'>
                        {t("asmaul.flashcard_title") ?? "Flashcard Asmaul Husna"}
                    </p>
                    <p className='text-xs text-emerald-600 dark:text-emerald-500 truncate'>
                        {t("asmaul.flashcard_subtitle") ??
                            "Hafal satu per satu dengan kartu bolak-balik"}
                    </p>
                </div>
                <span className='text-emerald-400 dark:text-emerald-600 text-sm'>
                    ›
                </span>
            </Link>

            {/* Wirid shortcut */}
            <Link
                href={
                    pathname?.startsWith("/dashboard")
                        ? "/dashboard/asmaul-husna/wirid"
                        : "/asmaul-husna/wirid"
                }
                className='flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 mb-4 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors group'
            >
                <GiPrayerBeads className='text-2xl text-amber-600 dark:text-amber-400 shrink-0' />
                <div className='flex-1 min-w-0'>
                    <p className='text-sm font-semibold text-amber-800 dark:text-amber-300 group-hover:underline'>
                        {t("asmaul.wirid_title") ?? "Wirid Asmaul Husna"}
                    </p>
                    <p className='text-xs text-amber-600 dark:text-amber-500 truncate'>
                        {t("asmaul.wirid_subtitle") ??
                            "Hitung wirid dengan 99 nama Allah"}
                    </p>
                </div>
                <span className='text-amber-400 dark:text-amber-600 text-sm'>
                    ›
                </span>
            </Link>

            <div className='flex items-center gap-2 mb-6 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 dark:border-slate-700 px-3 py-2'>
                <BsSearch className='text-gray-400 shrink-0' />
                <input
                    type='text'
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t("asmaul.search_placeholder")}
                    className='flex-1 bg-transparent text-sm text-gray-700 dark:text-gray-200 outline-none'
                />
            </div>

            <div className='grid sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3'>
                {filteredNames.map((name) => (
                    <button
                        key={name.number}
                        onClick={() => setSelected(name)}
                        className='text-left p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-sm transition-all'
                    >
                        <div className='flex items-start justify-between mb-2'>
                            <span className='text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 rounded-full w-6 h-6 flex items-center justify-center'>
                                {name.number}
                            </span>
                            {name.audio_url && (
                                <BsVolumeUpFill className='text-emerald-400 dark:text-emerald-600 text-sm' />
                            )}
                        </div>
                        <p
                            className='text-2xl font-bold text-emerald-900 dark:text-emerald-300 dark:text-white mb-1 text-right'
                            style={{ fontFamily: "Amiri, serif" }}
                        >
                            {name.arabic}
                        </p>
                        <p className='text-xs text-gray-500 dark:text-gray-300 dark:text-gray-400 italic mb-0.5'>
                            {name.transliteration}
                        </p>
                        <p className='text-sm font-medium text-gray-700 dark:text-gray-200'>
                            {getLocalizedText(
                                {
                                    idn: name.indonesian,
                                    en: name.english,
                                },
                                lang,
                            )}
                        </p>
                    </button>
                ))}
            </div>

            {filteredNames.length === 0 && (
                <p className='text-center text-xs text-gray-400 dark:text-gray-600 dark:text-gray-300 py-4'>
                    {t("asmaul.not_found")}
                </p>
            )}

            {selected && (
                <div
                    className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4'
                    onClick={closeModal}
                >
                    <div
                        {...modalA11y}
                        className='bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-xl border border-gray-100 dark:border-slate-700 outline-none'
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className='text-center mb-4'>
                            <span className='text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 rounded-full px-3 py-1'>
                                #{selected.number}
                            </span>
                        </div>
                        <p
                            className='text-4xl font-bold text-emerald-900 dark:text-emerald-300 dark:text-white text-center mb-2'
                            style={{ fontFamily: "Amiri, serif" }}
                        >
                            {selected.arabic}
                        </p>
                        <p className='text-sm text-gray-500 dark:text-gray-300 dark:text-gray-400 italic text-center mb-1'>
                            {selected.transliteration}
                        </p>
                        <p className='text-base font-semibold text-emerald-800 dark:text-emerald-300 text-center mb-4'>
                            {lang === "EN" ? selected.english : selected.indonesian}
                        </p>
                        {(lang === "EN"
                            ? selected.description_en
                            : selected.description) && (
                            <p className='text-sm text-gray-600 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3 mb-3'>
                                {lang === "EN"
                                    ? selected.description_en
                                    : selected.description}
                            </p>
                        )}
                        {(() => {
                            const extra = asmaulHusnaData[selected.number];
                            if (!extra) return null;
                            const isIdn = lang === "ID";
                            return (
                                <div className='space-y-2 text-xs text-left mb-3'>
                                    {extra.dalilRef && (
                                        <div className='p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/40'>
                                            <p className='font-bold text-emerald-800 dark:text-emerald-300'>
                                                {extra.dalilRef}
                                            </p>
                                            {extra.dalilText && (
                                                <p
                                                    dir='rtl'
                                                    className='font-arabic text-sm text-right text-emerald-950 dark:text-emerald-300 dark:text-emerald-200 my-1'
                                                >
                                                    {extra.dalilText}
                                                </p>
                                            )}
                                            {isIdn && extra.dalilTrans && (
                                                <p className='text-gray-600 dark:text-gray-300 italic'>
                                                    &ldquo;{extra.dalilTrans}&rdquo;
                                                </p>
                                            )}
                                        </div>
                                    )}
                                    {isIdn && extra.ulamaQuote && (
                                        <div className='p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-800/30 text-amber-900 dark:text-amber-300'>
                                            <p className='font-semibold'>
                                                💬 {t("asmaul.ulama_explanation") ?? "Penjelasan Ulama"}:
                                            </p>
                                            <p className='text-gray-700 dark:text-gray-200 dark:text-gray-300 mt-0.5'>
                                                {extra.ulamaQuote}
                                            </p>
                                        </div>
                                    )}
                                    {extra.internalLink && (
                                        <div className='pt-1'>
                                            <Link
                                                href={extra.internalLink}
                                                className='inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium hover:underline'
                                            >
                                                <BsLink45Deg /> {t("asmaul.open_quran") ?? "Buka di Al-Qur'an"} &rarr;
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                        {selected.audio_url && (
                            <button
                                type='button'
                                onClick={() =>
                                    playing
                                        ? stopAudio()
                                        : playAudio(selected.audio_url)
                                }
                                className='mt-4 w-full flex items-center justify-center gap-2 py-2 border border-emerald-500 dark:border-emerald-600 text-emerald-700 dark:text-emerald-400 rounded-xl text-sm font-medium hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors'
                            >
                                {playing ? (
                                    <>
                                        <BsPauseFill />
                                        {t("common.pause") ?? "Pause"}
                                    </>
                                ) : (
                                    <>
                                        <BsPlayFill />
                                        {t("asmaul.play_audio") ?? "Dengarkan"}
                                    </>
                                )}
                            </button>
                        )}
                        <button
                            onClick={closeModal}
                            className='mt-3 w-full py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium transition-colors'
                        >
                            {t("common.close")}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export { AsmaulHusnaClient as AsmaulHusnaContent };
