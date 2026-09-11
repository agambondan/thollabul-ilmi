"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export default function SanadPanel({ hadithId, t }) {
    const [sanads, setSanads] = useState(null);
    const [sanadFailed, setSanadFailed] = useState(false);

    useEffect(() => {
        fetch(`${API_URL}/api/v1/hadiths/${hadithId}/sanad`)
            .then((r) => r.json())
            .then((d) =>
                setSanads(Array.isArray(d?.items ?? d) ? (d?.items ?? d) : []),
            )
            .catch(() => setSanadFailed(true));
    }, [hadithId]);

    if (sanadFailed) {
        return (
            <p className='text-xs text-red-500 py-1'>
                {t("common.load_error")}
            </p>
        );
    }
    if (sanads === null) {
        return (
            <p className='text-xs text-gray-400 py-1'>{t("common.loading")}</p>
        );
    }
    if (sanads.length === 0) {
        return (
            <p className='text-xs text-gray-400 py-1'>
                {t("hadith.sanad_empty")}
            </p>
        );
    }

    return (
        <div className='space-y-3'>
            {sanads.map((sanad, sIdx) => (
                <div key={sanad.id ?? sIdx}>
                    {sanads.length > 1 && (
                        <p className='text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5'>
                            Jalur {sanad.nomor_jalur ?? sIdx + 1}
                            {sanad.jenis ? ` — ${sanad.jenis}` : ""}
                        </p>
                    )}
                    <div className='flex flex-wrap items-center gap-1 text-xs'>
                        {(sanad.mata_sanad ?? [])
                            .slice()
                            .sort((a, b) => (a.urutan ?? 0) - (b.urutan ?? 0))
                            .map((m, i, arr) => (
                                <span
                                    key={m.id ?? i}
                                    className='flex items-center gap-1'
                                >
                                    <span className='inline-flex flex-col items-center'>
                                        <span className='px-2 py-1 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 rounded-lg font-medium max-w-[120px] text-center leading-tight'>
                                            {m.perawi?.nama_latin ??
                                                `Perawi ${m.urutan}`}
                                        </span>
                                        {m.metode && (
                                            <span className='text-gray-400 text-[10px]'>
                                                {m.metode}
                                            </span>
                                        )}
                                    </span>
                                    {i < arr.length - 1 && (
                                        <span className='text-gray-400'>←</span>
                                    )}
                                </span>
                            ))}
                    </div>
                    {sanad.catatan && (
                        <p className='text-xs text-gray-400 mt-1.5 italic'>
                            {sanad.catatan}
                        </p>
                    )}
                </div>
            ))}
        </div>
    );
}
