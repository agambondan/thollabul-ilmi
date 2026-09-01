"use client";

import { useLocale } from "@/context/Locale";
import { MdRefresh } from "react-icons/md";

/**
 * Inline "could not load" with a retry, for lists that previously fell back to
 * an empty array on failure — which told the reader the data does not exist
 * when in fact the request never landed.
 */
export default function InlineError({ onRetry, message }) {
    const { t } = useLocale();

    return (
        <div
            role='alert'
            aria-live='assertive'
            className='flex flex-wrap items-center justify-center gap-3 rounded-xl border border-red-100 bg-red-50/60 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/10 dark:text-red-300'
        >
            <span>{message ?? t("common.load_error")}</span>
            {onRetry && (
                <button
                    type='button'
                    onClick={onRetry}
                    className='inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-2.5 py-1 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400 dark:border-red-900/50 dark:bg-slate-800 dark:text-red-300 dark:hover:bg-slate-700'
                >
                    <MdRefresh aria-hidden='true' />
                    {t("common.try_again")}
                </button>
            )}
        </div>
    );
}
