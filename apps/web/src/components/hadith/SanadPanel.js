"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BsDiagram3Fill, BsListUl, BsArrowDown } from "react-icons/bs";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

const STATUS_COLORS = {
    tsiqah_tsiqah: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700",
    tsiqah: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border-green-300 dark:border-green-700",
    shaduq: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-300 dark:border-blue-700",
    la_baasa_bihi: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300 border-cyan-300 dark:border-cyan-700",
    maqbul: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300 border-sky-300 dark:border-sky-700",
    majhul: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-gray-300 dark:border-gray-700",
    layyin: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700",
    dhaif: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border-orange-300 dark:border-orange-700",
    matruk: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-300 dark:border-red-700",
    kadzdzab: "bg-red-200 text-red-800 dark:bg-red-900/60 dark:text-red-200 border-red-400 dark:border-red-800",
    nabi: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-purple-300 dark:border-purple-700",
};

export default function SanadPanel({ hadithId, t }) {
    const [sanads, setSanads] = useState(null);
    const [sanadFailed, setSanadFailed] = useState(false);
    const [viewMode, setViewMode] = useState("tree");

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
                {t ? t("common.load_error") : "Gagal memuat data sanad"}
            </p>
        );
    }
    if (sanads === null) {
        return (
            <p className='text-xs text-gray-400 py-1'>
                {t ? t("common.loading") : "Memuat..."}
            </p>
        );
    }
    if (sanads.length === 0) {
        return (
            <p className='text-xs text-gray-400 py-1'>
                {t ? t("hadith.sanad_empty") : "Belum ada catatan sanad untuk hadits ini."}
            </p>
        );
    }

    return (
        <div className='space-y-4'>
            {/* View Mode Toggle Header */}
            <div className='flex items-center justify-between gap-2 pb-2 border-b border-gray-100 dark:border-slate-800'>
                <span className='text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5'>
                    <BsDiagram3Fill className='text-teal-600 dark:text-teal-400' />
                    Alur Silsilah Sanad
                </span>
                <div className='flex items-center bg-gray-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs'>
                    <button
                        type='button'
                        onClick={() => setViewMode("tree")}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                            viewMode === "tree"
                                ? "bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 font-bold shadow-xs"
                                : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
                        }`}
                        title='Diagram Alur Sanad'
                    >
                        <BsDiagram3Fill />
                        <span>Bagan</span>
                    </button>
                    <button
                        type='button'
                        onClick={() => setViewMode("list")}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                            viewMode === "list"
                                ? "bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 font-bold shadow-xs"
                                : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
                        }`}
                        title='Rantai Teks'
                    >
                        <BsListUl />
                        <span>Rantai</span>
                    </button>
                </div>
            </div>

            {sanads.map((sanad, sIdx) => {
                const sortedChain = (sanad.mata_sanad ?? [])
                    .slice()
                    .sort((a, b) => (a.urutan ?? 0) - (b.urutan ?? 0));

                return (
                    <div
                        key={sanad.id ?? sIdx}
                        className='bg-gray-50/50 dark:bg-slate-900/40 rounded-xl p-3 border border-gray-100 dark:border-slate-800'
                    >
                        {sanads.length > 1 && (
                            <p className='text-xs font-bold text-teal-700 dark:text-teal-400 mb-2'>
                                Jalur {sanad.nomor_jalur ?? sIdx + 1}
                                {sanad.jenis ? ` — ${sanad.jenis}` : ""}
                            </p>
                        )}

                        {viewMode === "tree" ? (
                            /* Tree Diagram Flow */
                            <div className='flex flex-col items-center py-2'>
                                {sortedChain.map((m, idx, arr) => {
                                    const p = m.perawi || {};
                                    const colorBadge =
                                        STATUS_COLORS[p.status] ||
                                        "bg-teal-50 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200 dark:border-teal-800";

                                    const cardEl = (
                                        <div className='relative pt-4 pb-2.5 px-3 rounded-xl bg-white dark:bg-slate-800 border-2 border-teal-500/40 border-t-4 border-t-teal-500 shadow-xs hover:shadow-md transition-all text-center w-[170px] sm:w-[200px]'>
                                            <div className='absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-[10px] shadow-xs'>
                                                {idx + 1}
                                            </div>
                                            {p.nama_arab && (
                                                <p
                                                    dir='rtl'
                                                    className='font-arabic text-xs text-gray-600 dark:text-gray-300 mb-0.5 line-clamp-1'
                                                >
                                                    {p.nama_arab}
                                                </p>
                                            )}
                                            <p className='text-xs font-bold text-gray-900 dark:text-white line-clamp-2 hover:text-teal-600'>
                                                {p.nama_latin ?? `Perawi ${m.urutan ?? idx + 1}`}
                                            </p>
                                            {p.tabaqah && (
                                                <p className='text-[10px] text-gray-400 capitalize mt-0.5'>
                                                    {p.tabaqah.replace(/_/g, " ")}
                                                </p>
                                            )}
                                            {p.status && (
                                                <span
                                                    className={`inline-block mt-1 px-1.5 py-0.2 rounded text-[9px] font-semibold border ${colorBadge}`}
                                                >
                                                    {p.status.replace(/_/g, " ")}
                                                </span>
                                            )}
                                        </div>
                                    );

                                    return (
                                        <div
                                            key={m.id ?? idx}
                                            className='flex flex-col items-center w-full'
                                        >
                                            {p.id ? (
                                                <Link href={`/perawi/${p.id}`} className='block'>
                                                    {cardEl}
                                                </Link>
                                            ) : (
                                                cardEl
                                            )}

                                            {idx < arr.length - 1 && (
                                                <div className='flex flex-col items-center my-1'>
                                                    <div className='w-0.5 h-4 bg-teal-400 dark:bg-teal-600' />
                                                    {m.metode && (
                                                        <span className='text-[9.5px] font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-full border border-teal-200 dark:border-teal-800 -my-0.5'>
                                                            {m.metode}
                                                        </span>
                                                    )}
                                                    <div className='w-0.5 h-4 bg-teal-400 dark:bg-teal-600' />
                                                    <BsArrowDown className='text-xs text-teal-600 -mt-1' />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            /* Linear Text Chain */
                            <div className='flex flex-wrap items-center gap-1.5 text-xs py-1'>
                                {sortedChain.map((m, i, arr) => (
                                    <span
                                        key={m.id ?? i}
                                        className='flex items-center gap-1.5'
                                    >
                                        <span className='inline-flex flex-col items-center'>
                                            {m.perawi?.id ? (
                                                <Link
                                                    href={`/perawi/${m.perawi.id}`}
                                                    className='px-2.5 py-1 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 rounded-lg font-semibold hover:bg-teal-100 text-center leading-tight'
                                                >
                                                    {m.perawi.nama_latin}
                                                </Link>
                                            ) : (
                                                <span className='px-2.5 py-1 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 rounded-lg font-semibold text-center leading-tight'>
                                                    {m.perawi?.nama_latin ?? `Perawi ${m.urutan}`}
                                                </span>
                                            )}
                                            {m.metode && (
                                                <span className='text-gray-400 text-[10px] mt-0.5'>
                                                    {m.metode}
                                                </span>
                                            )}
                                        </span>
                                        {i < arr.length - 1 && (
                                            <span className='text-gray-400 font-bold'>←</span>
                                        )}
                                    </span>
                                ))}
                            </div>
                        )}

                        {sanad.catatan && (
                            <p className='text-xs text-gray-400 mt-2 italic'>
                                {sanad.catatan}
                            </p>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
