"use client";

import { useLocale } from "@/context/Locale";

const GRADE_CONFIG = {
    shahih: {
        label: "Shahih",
        color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    },
    shahih_lighairihi: {
        label: "Shahih Lighairihi",
        color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    },
    hasan: {
        label: "Hasan",
        color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    },
    hasan_lighairihi: {
        label: "Hasan Lighairihi",
        color: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400",
    },
    hasan_shahih: {
        label: "Hasan Shahih",
        color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
    },
    dhaif: {
        label: "Dha'if",
        color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    },
    dhaif_jiddan: {
        label: "Dha'if Jiddan",
        color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    },
    munkar: {
        label: "Munkar",
        color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    },
    maudhu: {
        label: "Maudhu'",
        color: "bg-red-200 text-red-900 dark:bg-red-900/50 dark:text-red-300",
    },
    matruk: {
        label: "Matruk",
        color: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400",
    },
    majhul: {
        label: "Majhul",
        color: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
    },
};

const UNVERIFIED_COLOR =
    "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400";

/**
 * A hadith with no recorded grade must not look the same as one that was never
 * graded at all — silence reads as endorsement. When `grade` is missing or
 * unrecognised we say so explicitly instead of rendering nothing.
 */
export default function GradeBadge({ grade }) {
    const { t } = useLocale();
    const cfg = grade ? GRADE_CONFIG[grade] : null;

    if (!cfg) {
        return (
            <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium italic ${UNVERIFIED_COLOR}`}
                title={t("hadith.grade_unverified_hint")}
            >
                {t("hadith.grade_unverified")}
            </span>
        );
    }

    return (
        <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cfg.color}`}
        >
            {cfg.label}
        </span>
    );
}

export function HadithAuthenticity({ hadith }) {
    const { t } = useLocale();
    const hasDetail =
        hadith.shahih_by ||
        hadith.dhaif_by ||
        hadith.grade_notes ||
        hadith.sanad;

    return (
        <div className='rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden text-sm'>
            <div className='px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/60 flex items-center gap-2'>
                <span className='font-semibold text-neutral-700 dark:text-neutral-300 text-xs'>
                    {t("hadith.authenticity")}
                </span>
                <GradeBadge grade={hadith.grade} />
            </div>
            <div className='px-4 py-3 space-y-2'>
                {!hasDetail && (
                    <p className='text-neutral-500 dark:text-neutral-400'>
                        {t("hadith.grade_unverified_hint")}
                    </p>
                )}
                {hadith.shahih_by && (
                    <div>
                        <span className='font-medium text-green-700 dark:text-green-400'>
                            {t("hadith.authenticated_by")}:{" "}
                        </span>
                        <span className='text-neutral-700 dark:text-neutral-300'>
                            {hadith.shahih_by}
                        </span>
                    </div>
                )}
                {hadith.dhaif_by && (
                    <div>
                        <span className='font-medium text-red-700 dark:text-red-400'>
                            {t("hadith.weakened_by")}:{" "}
                        </span>
                        <span className='text-neutral-700 dark:text-neutral-300'>
                            {hadith.dhaif_by}
                        </span>
                    </div>
                )}
                {hadith.grade_notes && (
                    <div>
                        <span className='font-medium text-neutral-600 dark:text-neutral-400'>
                            {t("common.notes")}:{" "}
                        </span>
                        <span className='text-neutral-600 dark:text-neutral-400'>
                            {hadith.grade_notes}
                        </span>
                    </div>
                )}
                {hadith.sanad && (
                    <details className='mt-1'>
                        <summary className='cursor-pointer font-medium text-neutral-600 dark:text-neutral-400 select-none'>
                            {t("hadith.sanad_chain")}
                        </summary>
                        <p className='mt-2 text-neutral-600 dark:text-neutral-400 leading-relaxed'>
                            {hadith.sanad}
                        </p>
                    </details>
                )}
            </div>
        </div>
    );
}
