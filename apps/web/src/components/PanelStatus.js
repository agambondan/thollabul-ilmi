"use client";

import { useLocale } from "@/context/Locale";
import { MdRefresh } from "react-icons/md";

/**
 * Loading / failed / empty for a lazily loaded panel.
 *
 * Keeping "failed to load" visually distinct from "there is nothing here"
 * matters most on content panels — telling a reader an ayah has no tafsir
 * because the request failed is worse than showing no answer at all.
 */
const PanelStatus = ({
    isLoading,
    error,
    isEmpty,
    loadingText,
    emptyText,
    onRetry,
}) => {
    const { t } = useLocale();

    if (isLoading) {
        return (
            <p
                className='text-sm text-gray-400'
                role='status'
                aria-live='polite'
            >
                {loadingText ?? t("common.loading")}
            </p>
        );
    }

    if (error) {
        return (
            <div
                className='flex flex-wrap items-center gap-3'
                role='alert'
                aria-live='assertive'
            >
                <p className='text-sm text-red-600 dark:text-red-400'>
                    {t("common.load_error")}
                </p>
                {onRetry && (
                    <button
                        type='button'
                        onClick={onRetry}
                        className='inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-2.5 py-1 text-xs font-semibold text-red-700 dark:text-red-400 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400 dark:border-red-900/50 dark:bg-slate-800 dark:text-red-300 dark:hover:bg-slate-700'
                    >
                        <MdRefresh aria-hidden='true' />
                        {t("common.try_again")}
                    </button>
                )}
            </div>
        );
    }

    if (isEmpty) {
        return (
            <p className='text-sm text-gray-500 dark:text-gray-300 dark:text-gray-400 italic'>
                {emptyText}
            </p>
        );
    }

    return null;
};

export default PanelStatus;
