"use client";

import { useEffect, useState } from "react";
import { getLocalizedTranslation } from "@/lib/translation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export default function TakhrijPanel({ hadithId, t }) {
    const [takhrijList, setTakhrijList] = useState(null);
    const [takhrijFailed, setTakhrijFailed] = useState(false);

    useEffect(() => {
        fetch(`${API_URL}/api/v1/hadiths/${hadithId}/takhrij`)
            .then((r) => r.json())
            .then((d) =>
                setTakhrijList(
                    Array.isArray(d?.items ?? d) ? (d?.items ?? d) : [],
                ),
            )
            .catch(() => setTakhrijFailed(true));
    }, [hadithId]);

    if (takhrijFailed) {
        return (
            <p className='text-xs text-red-500 py-1'>
                {t("common.load_error")}
            </p>
        );
    }
    if (takhrijList === null) {
        return (
            <p className='text-xs text-gray-400 py-1'>
                {t("common.loading") ?? "Memuat..."}
            </p>
        );
    }
    if (takhrijList.length === 0) {
        return (
            <p className='text-xs text-gray-400 py-1'>
                {t("hadith.takhrij_empty")}
            </p>
        );
    }

    return (
        <div className='flex flex-wrap gap-2'>
            {takhrijList.map((tk, idx) => {
                const bookName =
                    getLocalizedTranslation(tk.book?.translation, "ID") ??
                    tk.book?.slug ??
                    "";
                return (
                    <div
                        key={tk.id ?? idx}
                        className='px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-800'
                    >
                        <span className='font-semibold'>{bookName}</span>
                        {tk.nomor_hadis_kitab && (
                            <span className='ml-1 text-blue-500 dark:text-blue-500'>
                                No. {tk.nomor_hadis_kitab}
                            </span>
                        )}
                        {tk.catatan && (
                            <span className='ml-1 text-blue-400 dark:text-blue-600 hidden sm:inline'>
                                — {tk.catatan}
                            </span>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
