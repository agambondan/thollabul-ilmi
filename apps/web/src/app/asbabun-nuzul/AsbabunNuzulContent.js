"use client";

import ContentWidth from "@/components/layout/ContentWidth";
import { useLocale } from "@/context/Locale";
import { BsInfoCircle } from "react-icons/bs";
import AsbabunNuzulForm from "./AsbabunNuzulForm";

export const AsbabunNuzulContent = ({
    quranBasePath = "/quran",
    initialResults = [],
    initialSurahNumber = "",
}) => {
    const { t } = useLocale();

    return (
        <ContentWidth compact='max-w-3xl' className='px-4 py-6'>
            <div className='text-center mb-6'>
                <p
                    className='text-3xl text-emerald-700 dark:text-emerald-400 mb-2'
                    style={{ fontFamily: "Amiri, serif" }}
                >
                    أَسْبَابُ النُّزُول
                </p>
                <h1 className='text-2xl font-bold text-emerald-900 dark:text-white mb-1'>
                    {t("asbabun.title") || "Asbabun Nuzul"}
                </h1>
                <p className='text-sm text-gray-500 dark:text-gray-400'>
                    {t("asbabun.subtitle") ||
                        "Latar belakang dan sebab diturunkannya ayat-ayat Al-Quran"}
                </p>
            </div>

            <div className='bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4 mb-6 flex items-start gap-3'>
                <BsInfoCircle className='text-amber-600 dark:text-amber-400 text-lg shrink-0 mt-0.5' />
                <p className='text-xs text-amber-800 dark:text-amber-300 leading-relaxed'>
                    {t("asbabun.intro") ??
                        "Riwayat sebab turunnya ayat membantu memahami konteks Al-Quran secara lebih utuh. Cari berdasarkan surah untuk melihat seluruh riwayat asbabun nuzul yang tercatat di dalamnya, lengkap dengan perawi dan rujukan kitabnya."}
                </p>
            </div>

            <AsbabunNuzulForm
                quranBasePath={quranBasePath}
                initialResults={initialResults}
                initialSurahNumber={initialSurahNumber}
            />
        </ContentWidth>
    );
};

export default AsbabunNuzulContent;
