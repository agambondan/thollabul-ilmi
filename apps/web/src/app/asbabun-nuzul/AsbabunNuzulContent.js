"use client";

import { useLocale } from "@/context/Locale";
import { useLayoutMode } from "@/lib/useLayoutMode";
import AsbabunNuzulForm from "./AsbabunNuzulForm";

export const AsbabunNuzulContent = ({
    quranBasePath = "/quran",
    initialResults = [],
    initialSurahNumber = "",
}) => {
    const { t } = useLocale();
    const { isWide } = useLayoutMode();

    return (
        <div className={isWide ? "w-full px-4" : "container mx-auto px-4 max-w-3xl"}>
            <div className='text-center mb-8'>
                <p
                    className='text-3xl text-emerald-700 dark:text-emerald-400 mb-2'
                    style={{ fontFamily: "Amiri, serif" }}
                >
                    أَسْبَابُ النُّزُول
                </p>
                <h1 className='text-2xl font-bold text-emerald-900 dark:text-emerald-300 dark:text-white mb-1'>
                    {t("asbabun.title") || "Asbabun Nuzul"}
                </h1>
                <p className='text-sm text-gray-500 dark:text-gray-300 dark:text-gray-400'>
                    {t("asbabun.subtitle") ||
                        "Latar belakang dan sebab diturunkannya ayat-ayat Al-Quran"}
                </p>
            </div>
            <AsbabunNuzulForm
                quranBasePath={quranBasePath}
                initialResults={initialResults}
                initialSurahNumber={initialSurahNumber}
            />
        </div>
    );
};

export default AsbabunNuzulContent;
