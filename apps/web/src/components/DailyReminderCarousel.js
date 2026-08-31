"use client";

import { useLocale } from "@/context/Locale";
import { hadithApi, remindersApi } from "@/lib/api";
import { getLocalizedTranslation } from "@/lib/translation";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FaQuran } from "react-icons/fa";
import { ImBook } from "react-icons/im";
import { MdChevronLeft, MdChevronRight, MdFormatQuote } from "react-icons/md";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
const ROTATE_MS = 9000;

const STATIC_REMINDERS = [
    {
        type: "Nasihat Ulama",
        icon: MdFormatQuote,
        title: "Pengingat",
        text: "Ilmu yang bermanfaat adalah ilmu yang membuat hati semakin tunduk dan amal semakin terarah.",
        source: "Pengingat harian",
    },
    {
        type: "Nasihat Ulama",
        icon: MdFormatQuote,
        title: "Pengingat",
        text: "Mulai dari amal yang kecil, lalu jaga agar tetap hidup setiap hari.",
        source: "Pengingat harian",
    },
];

const THEMES = {
    "Al-Quran": {
        card: "from-emerald-50 to-teal-50 border-emerald-100 dark:from-emerald-900/20 dark:to-teal-900/20 dark:border-emerald-900/30",
        icon: "text-emerald-600 dark:text-emerald-400",
        title: "text-emerald-700 dark:text-emerald-400",
        source: "text-emerald-700 dark:text-emerald-400",
        button: "border-emerald-100 bg-white text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900/40 dark:bg-slate-900 dark:text-emerald-300 dark:hover:bg-emerald-950/40",
        dot: "bg-emerald-500",
    },
    Hadis: {
        card: "from-amber-50 to-emerald-50 border-amber-100 dark:from-amber-900/20 dark:to-emerald-900/20 dark:border-amber-900/30",
        icon: "text-amber-600 dark:text-amber-400",
        title: "text-amber-700 dark:text-amber-400",
        source: "text-emerald-700 dark:text-emerald-400",
        button: "border-amber-100 bg-white text-amber-700 hover:bg-amber-50 dark:border-amber-900/40 dark:bg-slate-900 dark:text-amber-300 dark:hover:bg-amber-950/40",
        dot: "bg-amber-500",
    },
    default: {
        card: "from-emerald-50 to-white border-emerald-100 dark:from-emerald-900/20 dark:to-slate-900 dark:border-emerald-900/30",
        icon: "text-emerald-600 dark:text-emerald-400",
        title: "text-emerald-700 dark:text-emerald-400",
        source: "text-emerald-700 dark:text-emerald-400",
        button: "border-emerald-100 bg-white text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900/40 dark:bg-slate-900 dark:text-emerald-300 dark:hover:bg-emerald-950/40",
        dot: "bg-emerald-500",
    },
};

const unwrapPayload = (payload) => payload?.data ?? payload;

const normalizeAyah = (payload, lang, ayahBasePath) => {
    const ayah = unwrapPayload(payload);
    if (!ayah || Array.isArray(ayah)) return null;

    const arabic = ayah.translation?.ar ?? ayah.ar ?? "";
    const text =
        getLocalizedTranslation(ayah.translation, lang) ||
        ayah.translation?.idn ||
        ayah.translation?.en ||
        "";
    const surahName =
        getLocalizedTranslation(ayah.surah?.translation, lang) ||
        ayah.surah?.translation?.latin_en ||
        ayah.surah?.identifier ||
        "";
    const ayahNum = ayah.number ?? "";
    const surahSlug =
        ayah.surah?.slug ??
        ayah.surah?.translation?.latin_en
            ?.toLowerCase()
            ?.replace(/\s+/g, "-") ??
        "";
    const href = surahSlug ? `${ayahBasePath}/${surahSlug}#${ayahNum}` : "";

    if (!arabic && !text) return null;

    return {
        type: "Al-Quran",
        icon: FaQuran,
        title: "Ayat Hari Ini",
        arabic,
        text,
        source: `${surahName}${ayahNum ? `: ${ayahNum}` : ""}`,
        href,
    };
};

const normalizeHadith = (payload, lang, basePath) => {
    const hadith = unwrapPayload(payload);
    if (!hadith || Array.isArray(hadith)) return null;

    const arabic = hadith.translation?.ar ?? hadith.arab ?? "";
    const text =
        getLocalizedTranslation(hadith.translation, lang) ||
        hadith.translation?.idn ||
        hadith.translation?.en ||
        "";
    const bookName = hadith.book?.translation
        ? getLocalizedTranslation(hadith.book.translation, lang)
        : (hadith.book?.slug ?? hadith.book_slug ?? "");
    const number = hadith.number ?? hadith.id;
    const slug = hadith.book?.slug ?? hadith.book_slug ?? "";
    const href = slug
        ? number
            ? `${basePath}/${slug}/${number}`
            : `${basePath}/${slug}`
        : "";

    if (!arabic && !text) return null;

    return {
        type: "Hadis",
        icon: ImBook,
        title: "Hadis Hari Ini",
        arabic,
        text,
        source: `HR. ${bookName}${number ? ` No. ${number}` : ""}`,
        href,
    };
};

const unwrapListPayload = (payload) => {
    const data = unwrapPayload(payload);
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.items)) return data.items;
    return [];
};

const normalizeReminder = (item) => {
    if (!item?.text) return null;
    const source = [item.author, item.source].filter(Boolean).join(" · ");
    const title =
        item.type === "ulama"
            ? item.title || "Nasihat Ulama"
            : item.title || "Pengingat Harian";

    return {
        type: "Nasihat Ulama",
        icon: MdFormatQuote,
        title,
        text: item.text,
        source: source || "Pengingat harian",
    };
};

export default function DailyReminderCarousel({
    hadithBasePath = "/hadith",
    ayahBasePath = "/quran",
}) {
    const { lang, t } = useLocale();
    const [dynamicSlides, setDynamicSlides] = useState([]);
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        let ignore = false;

        Promise.allSettled([
            fetch(`${API_URL}/api/v1/ayah/daily`).then((r) => {
                if (!r.ok) throw new Error("ayah failed");
                return r.json();
            }),
            hadithApi.daily().then((r) => {
                if (!r.ok) throw new Error("hadith failed");
                return r.json();
            }),
            remindersApi
                .list({ active: "true", limit: "20", lang: "idn" })
                .then((r) => {
                    if (!r.ok) throw new Error("reminders failed");
                    return r.json();
                }),
        ]).then((results) => {
            if (ignore) return;

            const nextSlides = [
                results[0].status === "fulfilled"
                    ? normalizeAyah(results[0].value, lang, ayahBasePath)
                    : null,
                results[1].status === "fulfilled"
                    ? normalizeHadith(results[1].value, lang, hadithBasePath)
                    : null,
                ...(results[2].status === "fulfilled"
                    ? unwrapListPayload(results[2].value).map(normalizeReminder)
                    : []),
            ].filter(Boolean);

            setDynamicSlides(nextSlides);
            setActiveIndex(0);
        });

        return () => {
            ignore = true;
        };
    }, [ayahBasePath, hadithBasePath, lang]);

    const slides = useMemo(() => {
        return [...dynamicSlides, ...STATIC_REMINDERS];
    }, [dynamicSlides]);

    useEffect(() => {
        if (slides.length <= 1) return undefined;
        const timer = setInterval(() => {
            setActiveIndex((current) => (current + 1) % slides.length);
        }, ROTATE_MS);
        return () => clearInterval(timer);
    }, [slides.length]);

    const active = slides[activeIndex % slides.length];
    const Icon = active.icon;
    const theme = THEMES[active.type] ?? THEMES.default;
    const goPrev = () =>
        setActiveIndex(
            (current) => (current - 1 + slides.length) % slides.length,
        );
    const goNext = () =>
        setActiveIndex((current) => (current + 1) % slides.length);

    return (
        <section
            className={`rounded-2xl border bg-gradient-to-br p-5 shadow-sm ${theme.card}`}
        >
            <div className='mb-3 flex items-center justify-between gap-3'>
                <div className='flex min-w-0 items-center gap-2'>
                    <Icon className={`shrink-0 text-lg ${theme.icon}`} />
                    <p
                        className={`truncate text-xs font-semibold uppercase tracking-wider ${theme.title}`}
                    >
                        {active.title}
                    </p>
                </div>
                <div className='flex shrink-0 items-center gap-1.5'>
                    <button
                        type='button'
                        aria-label={t("common.prev")}
                        onClick={goPrev}
                        className={`flex h-8 w-8 items-center justify-center rounded-full border text-lg transition-colors ${theme.button}`}
                    >
                        <MdChevronLeft />
                    </button>
                    <button
                        type='button'
                        aria-label={t("common.next")}
                        onClick={goNext}
                        className={`flex h-8 w-8 items-center justify-center rounded-full border text-lg transition-colors ${theme.button}`}
                    >
                        <MdChevronRight />
                    </button>
                </div>
            </div>

            {active.arabic ? (
                <p
                    dir='rtl'
                    className='mb-3 line-clamp-3 font-kitab text-2xl leading-loose text-gray-800 dark:text-gray-100'
                >
                    {active.arabic}
                </p>
            ) : null}

            <p className='mb-3 line-clamp-4 text-sm leading-relaxed text-gray-700 dark:text-gray-300'>
                &ldquo;{active.text}&rdquo;
            </p>

            <div className='flex items-center justify-between gap-3 text-xs'>
                <span
                    className={`min-w-0 truncate font-medium ${theme.source}`}
                >
                    {active.source}
                </span>
                {active.href ? (
                    <Link
                        href={active.href}
                        className='shrink-0 font-medium text-emerald-600 hover:underline dark:text-emerald-400'
                    >
                        Selengkapnya →
                    </Link>
                ) : null}
            </div>

            {slides.length > 1 ? (
                <div className='mt-4 flex items-center gap-1.5'>
                    {slides.map((slide, index) => (
                        <button
                            key={`${slide.type}-${index}`}
                            type='button'
                            aria-label={`Tampilkan ${slide.title}`}
                            onClick={() => setActiveIndex(index)}
                            className={`h-1.5 rounded-full transition-all ${
                                index === activeIndex
                                    ? `w-6 ${theme.dot}`
                                    : "w-1.5 bg-gray-300 dark:bg-slate-600"
                            }`}
                        />
                    ))}
                </div>
            ) : null}
        </section>
    );
}
