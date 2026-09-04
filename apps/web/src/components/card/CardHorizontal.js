"use client";

import { getLocalizedTranslation } from "@/lib/translation";

const getRevelationType = (type, t) => {
    const lower = (type ?? "").toLowerCase();
    if (lower === "meccan") return t("quran.meccan");
    if (lower === "medinan") return t("quran.medinan");
    return type ?? "";
};

const CardHorizontal = ({
    surat,
    lang = "ID",
    ayahUnit = "Ayat",
    t = (k) => k,
}) => {
    const arabicName = surat.translation.ar.replace("سُورَةُ", "").trim();

    return (
        <div className='bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-700 hover:shadow-sm transition-all p-4 group cursor-pointer'>
            <div className='flex items-center gap-3'>
                {/* Surah number badge */}
                <div className='w-9 h-9 flex-shrink-0 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40 transition-colors'>
                    <span className='text-xs font-bold text-emerald-800 dark:text-emerald-300'>
                        {surat.number}
                    </span>
                </div>

                {/* Name + detail */}
                <div className='flex-1 min-w-0'>
                    <p className='font-semibold text-gray-900 dark:text-gray-100 dark:text-white text-sm truncate group-hover:text-emerald-700 hover:dark:text-emerald-400 dark:group-hover:text-emerald-400 transition-colors'>
                        {surat.translation.latin_en}
                    </p>
                    <p className='text-xs text-gray-500 dark:text-gray-300 dark:text-gray-400 mt-0.5 truncate'>
                        {getRevelationType(surat.revelation_type, t)} &middot;{" "}
                        {getLocalizedTranslation(surat.translation, lang)}{" "}
                        &middot; {surat.number_of_ayahs} {ayahUnit}
                    </p>
                </div>

                {/* Arabic name */}
                <span
                    className='flex-shrink-0 text-xl text-gray-500 dark:text-gray-300 dark:text-gray-400'
                    style={{ fontFamily: "Uthmani, serif", direction: "rtl" }}
                >
                    {arabicName}
                </span>
            </div>
        </div>
    );
};

export default CardHorizontal;
