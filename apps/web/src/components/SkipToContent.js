"use client";

import { useLocale } from "@/context/Locale";

/**
 * Keyboard users had to tab through the whole navigation on every page — up to
 * 49 links in the dashboard sidebar, 30+ in the public content menu — before
 * reaching the content. Visually hidden until focused.
 */
export default function SkipToContent() {
    const { t } = useLocale();

    return (
        <a
            href='#main-content'
            className='sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-emerald-700 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:outline-none focus:ring-2 focus:ring-gold-400'
        >
            {t("a11y.skip_to_content")}
        </a>
    );
}
