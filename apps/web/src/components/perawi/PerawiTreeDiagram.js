"use client";

import Link from "next/link";
import { useState } from "react";
import { BsDiagram3Fill, BsListUl, BsArrowDown, BsArrowUp } from "react-icons/bs";

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

function StatusPill({ status }) {
    if (!status) return null;
    const color =
        STATUS_COLORS[status] ??
        "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-gray-200";
    return (
        <span
            className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${color}`}
        >
            {status.replace(/_/g, " ")}
        </span>
    );
}

function TreeNodeCard({ perawi, basePath, isCurrent = false, roleLabel }) {
    if (!perawi) return null;

    const cardContent = (
        <div
            className={`relative pt-5 pb-3 px-3 rounded-2xl transition-all duration-200 text-center w-[165px] sm:w-[185px] ${
                isCurrent
                    ? "bg-teal-600 text-white shadow-xl shadow-teal-500/25 ring-4 ring-teal-500/30 scale-105 border-2 border-teal-300 border-t-4 border-t-white"
                    : "bg-white dark:bg-slate-800 hover:bg-teal-50/70 dark:hover:bg-slate-700/80 border border-gray-200 dark:border-slate-700 border-t-4 border-t-teal-500 shadow-sm hover:shadow-md hover:border-teal-400"
            }`}
        >
            {/* Top Floating Avatar */}
            <div
                className={`absolute -top-3.5 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-md ring-2 ring-white dark:ring-slate-800 ${
                    isCurrent
                        ? "bg-white text-teal-700"
                        : "bg-teal-600 text-white"
                }`}
            >
                {(perawi.nama_latin ?? "?")[0].toUpperCase()}
            </div>

            {roleLabel && (
                <div className='mb-1'>
                    <span
                        className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            isCurrent
                                ? "bg-teal-700/90 text-teal-100"
                                : "bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300"
                        }`}
                    >
                        {roleLabel}
                    </span>
                </div>
            )}

            {perawi.nama_arab && (
                <p
                    dir='rtl'
                    className={`font-arabic text-xs leading-normal line-clamp-1 mb-0.5 ${
                        isCurrent ? "text-teal-100" : "text-gray-600 dark:text-gray-300"
                    }`}
                >
                    {perawi.nama_arab}
                </p>
            )}
            <p
                className={`text-xs font-bold leading-snug line-clamp-2 mb-1 ${
                    isCurrent ? "text-white" : "text-gray-900 dark:text-white"
                }`}
            >
                {perawi.nama_latin}
            </p>
            {perawi.tabaqah && (
                <p
                    className={`text-[10px] capitalize mb-1 ${
                        isCurrent ? "text-teal-100" : "text-gray-500 dark:text-gray-400"
                    }`}
                >
                    {perawi.tabaqah.replace(/_/g, " ")}
                </p>
            )}
            {perawi.tahun_wafat && (
                <p
                    className={`text-[10px] mb-1.5 ${
                        isCurrent ? "text-teal-200" : "text-gray-400 dark:text-gray-500"
                    }`}
                >
                    w. {perawi.tahun_wafat} H
                </p>
            )}
            {!isCurrent && perawi.status && <StatusPill status={perawi.status} />}
            {isCurrent && perawi.status && (
                <span className='inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-white/20 text-white'>
                    {perawi.status.replace(/_/g, " ")}
                </span>
            )}
        </div>
    );

    if (isCurrent) {
        return <div className='relative z-10'>{cardContent}</div>;
    }

    return (
        <Link href={`${basePath}/${perawi.id}`} className='relative z-10 group block'>
            {cardContent}
        </Link>
    );
}

export default function PerawiTreeDiagram({
    currentPerawi,
    guru = [],
    murid = [],
    basePath = "/dashboard/perawi",
    t,
}) {
    const [viewMode, setViewMode] = useState("tree");

    const hasGuru = guru && guru.length > 0;
    const hasMurid = murid && murid.length > 0;

    if (!hasGuru && !hasMurid) {
        return null;
    }

    return (
        <div className='bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 mb-4'>
            <div className='flex items-center justify-between gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-slate-700'>
                <div>
                    <h2 className='text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider flex items-center gap-2'>
                        <BsDiagram3Fill className='text-teal-600 dark:text-teal-400' />
                        Silsilah Sanad & Guru-Murid
                    </h2>
                    <p className='text-xs text-gray-500 dark:text-gray-400 mt-0.5'>
                        Bagan hubungan transmisi guru (atas) dan murid (bawah)
                    </p>
                </div>
                <div className='flex items-center bg-gray-100 dark:bg-slate-700 p-0.5 rounded-lg text-xs font-medium'>
                    <button
                        type='button'
                        onClick={() => setViewMode("tree")}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
                            viewMode === "tree"
                                ? "bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-sm font-bold"
                                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                        }`}
                        title='Tampilan Tree Diagram'
                    >
                        <BsDiagram3Fill className='text-sm' />
                        <span className='hidden sm:inline'>Diagram</span>
                    </button>
                    <button
                        type='button'
                        onClick={() => setViewMode("list")}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
                            viewMode === "list"
                                ? "bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-sm font-bold"
                                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                        }`}
                        title='Tampilan Daftar'
                    >
                        <BsListUl className='text-sm' />
                        <span className='hidden sm:inline'>Daftar</span>
                    </button>
                </div>
            </div>

            {viewMode === "tree" ? (
                <div className='overflow-x-auto pb-6 pt-4 -mx-2 px-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-600'>
                    <div className='min-w-[500px] flex flex-col items-center gap-0'>
                        {/* Layer 1: Guru / Masyayikh (Sanad Atas) */}
                        {hasGuru && (
                            <div className='flex flex-col items-center w-full'>
                                <div className='flex items-center gap-1 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4'>
                                    <BsArrowUp className='text-teal-600' />
                                    Jalur Guru ({guru.length})
                                </div>
                                <div className='flex justify-center relative pb-6 w-full'>
                                    {guru.length > 1 && (
                                        <div
                                            className='absolute bottom-0 h-0.5 bg-gray-300 dark:bg-slate-600'
                                            style={{
                                                left: `calc(100% / (${guru.length} * 2))`,
                                                right: `calc(100% / (${guru.length} * 2))`,
                                            }}
                                        />
                                    )}
                                    <div className='flex gap-6 sm:gap-8'>
                                        {guru.map((g) => (
                                            <div key={g.id} className='relative flex flex-col items-center'>
                                                <TreeNodeCard
                                                    perawi={g}
                                                    basePath={basePath}
                                                    roleLabel='Guru'
                                                />
                                                <div className='absolute -bottom-6 w-0.5 h-6 bg-gray-300 dark:bg-slate-600' />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {/* Center drop line into current */}
                                <div className='w-0.5 h-6 bg-teal-500' />
                            </div>
                        )}

                        {/* Layer 2: Perawi Aktif (Center Focus) */}
                        <div className='flex flex-col items-center my-0'>
                            <TreeNodeCard
                                perawi={currentPerawi}
                                basePath={basePath}
                                isCurrent
                                roleLabel='Perawi Ini'
                            />
                        </div>

                        {/* Layer 3: Murid / Thullab (Sanad Bawah) */}
                        {hasMurid && (
                            <div className='flex flex-col items-center w-full'>
                                {/* Center line down from current */}
                                <div className='w-0.5 h-6 bg-teal-500' />
                                <div className='flex justify-center relative pt-6 w-full'>
                                    {murid.length > 1 && (
                                        <div
                                            className='absolute top-0 h-0.5 bg-gray-300 dark:bg-slate-600'
                                            style={{
                                                left: `calc(100% / (${murid.length} * 2))`,
                                                right: `calc(100% / (${murid.length} * 2))`,
                                            }}
                                        />
                                    )}
                                    <div className='flex gap-6 sm:gap-8'>
                                        {murid.map((m) => (
                                            <div key={m.id} className='relative flex flex-col items-center'>
                                                <div className='absolute -top-6 w-0.5 h-6 bg-gray-300 dark:bg-slate-600' />
                                                <TreeNodeCard
                                                    perawi={m}
                                                    basePath={basePath}
                                                    roleLabel='Murid'
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className='flex items-center gap-1 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-4'>
                                    <BsArrowDown className='text-teal-600' />
                                    Jalur Murid ({murid.length})
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* List View Alternative */
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    {hasGuru && (
                        <div className='space-y-2'>
                            <h3 className='text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider'>
                                Guru ({guru.length})
                            </h3>
                            <div className='space-y-1.5'>
                                {guru.map((g) => (
                                    <Link
                                        key={g.id}
                                        href={`${basePath}/${g.id}`}
                                        className='flex items-center justify-between p-2.5 rounded-lg bg-gray-50 dark:bg-slate-700/50 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors group'
                                    >
                                        <div className='flex items-center gap-2 min-w-0'>
                                            <div className='w-7 h-7 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-700 dark:text-teal-400 text-xs font-bold shrink-0'>
                                                {(g.nama_latin ?? "?")[0].toUpperCase()}
                                            </div>
                                            <div className='truncate'>
                                                <p className='text-xs font-semibold text-gray-800 dark:text-gray-200 group-hover:text-teal-600 truncate'>
                                                    {g.nama_latin}
                                                </p>
                                                {g.tabaqah && (
                                                    <p className='text-[10px] text-gray-400 capitalize'>
                                                        {g.tabaqah.replace(/_/g, " ")}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        {g.status && <StatusPill status={g.status} />}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                    {hasMurid && (
                        <div className='space-y-2'>
                            <h3 className='text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider'>
                                Murid ({murid.length})
                            </h3>
                            <div className='space-y-1.5'>
                                {murid.map((m) => (
                                    <Link
                                        key={m.id}
                                        href={`${basePath}/${m.id}`}
                                        className='flex items-center justify-between p-2.5 rounded-lg bg-gray-50 dark:bg-slate-700/50 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors group'
                                    >
                                        <div className='flex items-center gap-2 min-w-0'>
                                            <div className='w-7 h-7 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-700 dark:text-teal-400 text-xs font-bold shrink-0'>
                                                {(m.nama_latin ?? "?")[0].toUpperCase()}
                                            </div>
                                            <div className='truncate'>
                                                <p className='text-xs font-semibold text-gray-800 dark:text-gray-200 group-hover:text-teal-600 truncate'>
                                                    {m.nama_latin}
                                                </p>
                                                {m.tabaqah && (
                                                    <p className='text-[10px] text-gray-400 capitalize'>
                                                        {m.tabaqah.replace(/_/g, " ")}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        {m.status && <StatusPill status={m.status} />}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
