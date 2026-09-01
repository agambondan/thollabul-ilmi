"use client";

import { useLocale } from "@/context/Locale";
import { useEffect } from "react";
import { MdRefresh } from "react-icons/md";

/**
 * Error boundary body shared by the dashboard and admin segments. Keeping the
 * failure inside the segment means the surrounding shell (sidebar, header)
 * stays usable instead of the whole page collapsing to the root error screen.
 */
export default function SegmentError({ error, reset }) {
    const { t } = useLocale();

    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div
            className='mx-auto max-w-md px-4 py-16 text-center'
            role='alert'
            aria-live='assertive'
        >
            <p className='mb-3 text-4xl'>⚠️</p>
            <h2 className='mb-2 text-lg font-bold text-gray-900 dark:text-white'>
                {t("global_error.title")}
            </h2>
            <p className='mb-6 text-sm leading-relaxed text-gray-500 dark:text-gray-400'>
                {error?.message?.includes("fetch")
                    ? t("global_error.api_unreachable")
                    : t("global_error.unexpected")}
            </p>
            <button
                type='button'
                onClick={reset}
                className='inline-flex items-center gap-2 rounded-full bg-emerald-700 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400'
            >
                <MdRefresh aria-hidden='true' />
                {t("common.try_again")}
            </button>
        </div>
    );
}
