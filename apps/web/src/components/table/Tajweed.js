"use client";

import { listTajweed } from "@/lib/const";
import { useLocale } from "@/context/Locale";
import { useLayoutMode } from "@/lib/useLayoutMode";

export default function TajweedTable() {
    const { lang } = useLocale();
    const { isWide } = useLayoutMode();

    return (
        <div className={isWide ? "w-full" : "w-full max-w-5xl"}>
            <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3'>
                {listTajweed.map((tajweed) => (
                    <div
                        key={tajweed.Type}
                        className='flex items-start gap-4 bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-slate-600 hover:shadow-md hover:border-gray-200 dark:hover:border-slate-500 transition-all'
                    >
                        {/* Color swatch */}
                        <div
                            className='w-12 h-12 rounded-full flex-shrink-0 mt-1 shadow ring-2 ring-white dark:ring-slate-600'
                            style={{ backgroundColor: tajweed.Colour }}
                        />

                        <div className='min-w-0 flex-1'>
                            {/* Arabic name — colored & prominent */}
                            <p
                                className='text-lg font-semibold mb-0.5 leading-relaxed'
                                style={{
                                    fontFamily: "Amiri, serif",
                                    color: tajweed.Colour,
                                    direction: "rtl",
                                    textAlign: "right",
                                }}
                            >
                                {tajweed.Arabic}
                            </p>
                            {/* Transliterated name */}
                            <p className='text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1'>
                                {lang === "EN"
                                    ? tajweed.Description
                                    : (tajweed.TitleId ?? tajweed.Description)}
                            </p>
                            {/* Localized description */}
                            <p className='text-xs text-gray-500 dark:text-gray-400 leading-snug'>
                                {lang === "EN"
                                    ? tajweed.DescriptionEn
                                    : tajweed.DescriptionId}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
