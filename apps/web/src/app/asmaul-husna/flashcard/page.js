"use client";

import ContentWidth from "@/components/layout/ContentWidth";
import Section from "@/components/Section";
import { useLocale } from "@/context/Locale";
import { asmaulHusnaApi } from "@/lib/api";
import { asmaulHusnaData } from "@/lib/asmaulHusnaData";
import { getLocalizedTranslation } from "@/lib/translation";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
    BsArrowCounterclockwise,
    BsArrowLeft,
    BsArrowRight,
    BsShuffle,
} from "react-icons/bs";

const shuffleArray = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

export function AsmaulHusnaFlashcardContent({ basePath = "/asmaul-husna" }) {
    const { t, lang } = useLocale();
    const [items, setItems] = useState([]);
    const [order, setOrder] = useState([]);
    const [idx, setIdx] = useState(0);
    const [revealed, setRevealed] = useState(false);
    const [shuffled, setShuffled] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        asmaulHusnaApi
            .list()
            .then((r) => r.json())
            .then((data) => {
                const arr = data?.items ?? data ?? [];
                if (Array.isArray(arr) && arr.length > 0) {
                    const sorted = [...arr].sort(
                        (a, b) => (a.number ?? 0) - (b.number ?? 0),
                    );
                    setItems(sorted);
                    setOrder(sorted.map((_, i) => i));
                }
            })
            .catch((e) => console.error(e))
            .finally(() => setLoading(false));
    }, []);

    const current = useMemo(() => {
        if (items.length === 0 || order.length === 0) return null;
        return items[order[idx]];
    }, [items, order, idx]);

    const next = () => {
        setIdx((i) => (i + 1) % Math.max(1, order.length));
        setRevealed(false);
    };
    const prev = () => {
        setIdx((i) => (i - 1 + order.length) % Math.max(1, order.length));
        setRevealed(false);
    };
    const shuffle = () => {
        setOrder(shuffleArray(items.map((_, i) => i)));
        setIdx(0);
        setRevealed(false);
        setShuffled(true);
    };
    const reset = () => {
        setOrder(items.map((_, i) => i));
        setIdx(0);
        setRevealed(false);
        setShuffled(false);
    };

    if (loading) {
        return (
            <div className='flex items-center justify-center py-20'>
                <div className='w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin' />
            </div>
        );
    }

    if (!current) {
        return (
            <div className='text-center py-20 text-sm text-gray-500 dark:text-gray-400'>
                {t("asmaul.flashcard_empty") ?? "Tidak ada data Asmaul Husna."}
            </div>
        );
    }

    return (
        <ContentWidth compact='max-w-2xl' className='px-4 py-6'>
            <div className='text-center mb-6'>
                <Link
                    href={basePath}
                    className='text-sm text-emerald-700 dark:text-emerald-400 hover:underline'
                >
                    ← {t("asmaul.back_to_list") ?? "Kembali ke Daftar"}
                </Link>
                <h1 className='text-2xl font-bold text-emerald-900 dark:text-white mt-2'>
                    {t("asmaul.flashcard_title") ?? "Flashcard Asmaul Husna"}
                </h1>
                <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
                    {t("asmaul.flashcard_subtitle") ??
                        "Uji hafalan 99 nama Allah"}
                </p>
            </div>

            <div className='flex items-center justify-between mb-4 text-xs text-gray-500 dark:text-gray-400'>
                <span>
                    {idx + 1} / {order.length}
                </span>
                <div className='flex gap-2'>
                    <button
                        type='button'
                        onClick={shuffle}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors ${
                            shuffled
                                ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                                : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                        }`}
                    >
                        <BsShuffle />
                        {t("asmaul.shuffle") ?? "Acak"}
                    </button>
                    {shuffled && (
                        <button
                            type='button'
                            onClick={reset}
                            className='flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors'
                        >
                            <BsArrowCounterclockwise />
                            {t("asmaul.reset_order") ?? "Urutan Asli"}
                        </button>
                    )}
                </div>
            </div>

            <div
                onClick={() => setRevealed((v) => !v)}
                className='relative bg-white dark:bg-slate-800 rounded-3xl border border-emerald-100 dark:border-slate-700 shadow-sm p-8 min-h-[320px] flex flex-col items-center justify-center cursor-pointer select-none transition-all hover:shadow-md'
            >
                <span className='absolute top-4 left-4 text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium'>
                    #{current.number}
                </span>
                <span className='absolute top-4 right-4 text-xs text-gray-400'>
                    {revealed
                        ? (t("asmaul.tap_to_hide") ?? "Tap untuk sembunyikan")
                        : (t("asmaul.tap_to_reveal") ?? "Tap untuk lihat arti")}
                </span>

                <p
                    dir='rtl'
                    className='font-arabic text-5xl text-emerald-900 dark:text-emerald-300 leading-loose text-center mb-4'
                >
                    {current.arabic ?? current.translation?.ar}
                </p>

                {revealed ? (
                    <>
                        <p className='text-xl font-semibold text-gray-800 dark:text-white text-center'>
                            {current.latin ?? current.translation?.latin_idn}
                        </p>
                        <p className='text-base text-emerald-700 dark:text-emerald-400 text-center mt-2 font-medium'>
                            {getLocalizedTranslation(
                                current.translation,
                                lang,
                            ) ?? current.meaning}
                        </p>
                        {current.description && (
                            <p className='text-sm text-gray-500 dark:text-gray-400 text-center mt-3 leading-relaxed'>
                                {getLocalizedTranslation(
                                    {
                                        idn: current.description,
                                        en: current.description_en,
                                    },
                                    lang,
                                ) ?? current.description}
                            </p>
                        )}
                        {(() => {
                            const extra = asmaulHusnaData[current.number];
                            if (!extra) return null;
                            return (
                                <div className='mt-4 pt-4 border-t border-emerald-100 dark:border-slate-700 w-full text-left space-y-2 text-xs'>
                                    {extra.dalilRef && (
                                        <div className='p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/40'>
                                            <p className='font-bold text-emerald-800 dark:text-emerald-300'>
                                                📖 {extra.dalilRef}
                                            </p>
                                            {extra.dalilText && (
                                                <p
                                                    dir='rtl'
                                                    className='font-arabic text-sm text-right text-emerald-900 dark:text-emerald-200 my-1'
                                                >
                                                    {extra.dalilText}
                                                </p>
                                            )}
                                            <p className='text-gray-600 dark:text-gray-300 italic'>
                                                &ldquo;{extra.dalilTrans}&rdquo;
                                            </p>
                                        </div>
                                    )}
                                    {extra.ulamaQuote && (
                                        <div className='p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-800/30 text-amber-900 dark:text-amber-300'>
                                            <p className='font-semibold'>
                                                💬 {t("asmaul.ulama_explanation") ?? "Penjelasan Ulama"}:
                                            </p>
                                            <p className='text-gray-700 dark:text-gray-300 mt-0.5'>
                                                {extra.ulamaQuote}
                                            </p>
                                        </div>
                                    )}
                                    {extra.internalLink && (
                                        <div className='text-center pt-1'>
                                            <Link
                                                href={extra.internalLink}
                                                onClick={(e) => e.stopPropagation()}
                                                className='inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 hover:underline font-medium'
                                            >
                                                {extra.linkLabel ?? "Lihat di Al-Qur'an"} &rarr;
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </>
                ) : (
                    <p className='text-sm italic text-gray-400 mt-4'>
                        {t("asmaul.guess_meaning") ?? "Ingat-ingat artinya..."}
                    </p>
                )}
            </div>

            <div className='flex items-center justify-between mt-5 gap-3'>
                <button
                    type='button'
                    onClick={prev}
                    className='flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors'
                >
                    <BsArrowLeft />
                    {t("common.prev") ?? "Sebelumnya"}
                </button>

                <button
                    type='button'
                    onClick={() => setRevealed((v) => !v)}
                    className='flex-1 px-4 py-2.5 bg-emerald-700 text-white rounded-xl text-sm font-medium hover:bg-emerald-800 transition-colors'
                >
                    {revealed
                        ? (t("hafalan.hide_again") ?? "Sembunyikan")
                        : (t("hafalan.reveal") ?? "Tampilkan")}
                </button>

                <button
                    type='button'
                    onClick={next}
                    className='flex items-center gap-2 px-4 py-2.5 bg-emerald-700 text-white rounded-xl text-sm font-medium hover:bg-emerald-800 transition-colors'
                >
                    {t("common.next") ?? "Selanjutnya"}
                    <BsArrowRight />
                </button>
            </div>
        </ContentWidth>
    );
}

export default function AsmaulHusnaFlashcardPage() {
    return (
        <main className='min-h-screen flex flex-col bg-gradient-to-b from-emerald-50/40 via-white to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950'>
            <Section>
                <AsmaulHusnaFlashcardContent />
            </Section>
        </main>
    );
}
