"use client";

import Link from "next/link";
import { useState } from "react";
import {
    BsDiagram3Fill,
    BsInfoCircle,
    BsZoomIn,
    BsZoomOut,
    BsArrowRepeat,
} from "react-icons/bs";

const LEVEL_COLORS = {
    nabi: {
        bg: "bg-purple-600 dark:bg-purple-700",
        border: "border-purple-400 dark:border-purple-500",
        accent: "border-t-purple-600",
        text: "text-purple-700 dark:text-purple-300",
        badge: "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300",
        avatar: "bg-purple-600 text-white shadow-purple-500/30",
        line: "bg-purple-400 dark:bg-purple-600",
    },
    sahabat: {
        bg: "bg-pink-600 dark:bg-pink-700",
        border: "border-pink-400 dark:border-pink-500",
        accent: "border-t-pink-500",
        text: "text-pink-700 dark:text-pink-300",
        badge: "bg-pink-100 text-pink-800 dark:bg-pink-950/60 dark:text-pink-300",
        avatar: "bg-pink-500 text-white shadow-pink-500/30",
        line: "bg-pink-400 dark:bg-pink-600",
    },
    tabiin: {
        bg: "bg-amber-600 dark:bg-amber-700",
        border: "border-amber-400 dark:border-amber-500",
        accent: "border-t-amber-500",
        text: "text-amber-700 dark:text-amber-300",
        badge: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
        avatar: "bg-amber-500 text-white shadow-amber-500/30",
        line: "bg-amber-400 dark:bg-amber-600",
    },
    tabiut_tabiin: {
        bg: "bg-emerald-600 dark:bg-emerald-700",
        border: "border-emerald-400 dark:border-emerald-500",
        accent: "border-t-emerald-500",
        text: "text-emerald-700 dark:text-emerald-300",
        badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
        avatar: "bg-emerald-600 text-white shadow-emerald-500/30",
        line: "bg-emerald-400 dark:bg-emerald-600",
    },
    aimmah: {
        bg: "bg-blue-600 dark:bg-blue-700",
        border: "border-blue-400 dark:border-blue-500",
        accent: "border-t-blue-500",
        text: "text-blue-700 dark:text-blue-300",
        badge: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300",
        avatar: "bg-blue-600 text-white shadow-blue-500/30",
        line: "bg-blue-400 dark:bg-blue-600",
    },
};

const SANAD_TREE_DATA = {
    id: 1,
    nama_latin: "Muhammad Rasulullah ﷺ",
    nama_arab: "مُحَمَّدٌ رَسُولُ اللَّهِ ﷺ",
    tabaqah: "Nabi & Rasul",
    levelKey: "nabi",
    status: "Nabi",
    tahun_wafat: 11,
    initial: "ﷺ",
    children: [
        {
            id: 3,
            nama_latin: "Abdullah bin Umar",
            nama_arab: "عَبْدُ اللَّهِ بْنُ عُمَرَ",
            tabaqah: "Sahabat",
            levelKey: "sahabat",
            status: "Tsiqah",
            tahun_wafat: 73,
            initial: "U",
            children: [
                {
                    id: 6,
                    nama_latin: "Nafi' Maula Ibnu Umar",
                    nama_arab: "نَافِعٌ مَوْلَى ابْنِ عُمَرَ",
                    tabaqah: "Tabi'in",
                    levelKey: "tabiin",
                    status: "Tsiqah",
                    tahun_wafat: 117,
                    initial: "N",
                    children: [
                        {
                            id: 8,
                            nama_latin: "Malik bin Anas (Imam Malik)",
                            nama_arab: "مَالِكُ بْنُ أَنَسٍ",
                            tabaqah: "Tabi'ut Tabi'in",
                            levelKey: "tabiut_tabiin",
                            status: "Imam Darul Hijrah",
                            tahun_wafat: 179,
                            initial: "M",
                            children: [
                                {
                                    id: 9,
                                    nama_latin: "Muhammad bin Ismail al-Bukhari",
                                    nama_arab: "مُحَمَّدُ بْنُ إِسْمَاعِيلَ البُخَارِيُّ",
                                    tabaqah: "Mukharrij (Shahih Bukhari)",
                                    levelKey: "aimmah",
                                    status: "Amirul Mukminin",
                                    tahun_wafat: 256,
                                    initial: "B",
                                },
                                {
                                    id: 10,
                                    nama_latin: "Muslim bin al-Hajjaj",
                                    nama_arab: "مُسْلِمُ بْنُ الحَجَّاجِ",
                                    tabaqah: "Mukharrij (Shahih Muslim)",
                                    levelKey: "aimmah",
                                    status: "Imam Tsiqah",
                                    tahun_wafat: 261,
                                    initial: "M",
                                },
                            ],
                        },
                    ],
                },
                {
                    id: 22,
                    nama_latin: "Ikrimah bin Khalid",
                    nama_arab: "عِكْرِمَةُ بْنُ خَالِدٍ",
                    tabaqah: "Tabi'in",
                    levelKey: "tabiin",
                    status: "Tsiqah",
                    tahun_wafat: 114,
                    initial: "I",
                },
            ],
        },
        {
            id: 4,
            nama_latin: "Anas bin Malik",
            nama_arab: "أَنَسُ بْنُ مَالِكٍ",
            tabaqah: "Sahabat",
            levelKey: "sahabat",
            status: "Tsiqah",
            tahun_wafat: 93,
            initial: "A",
            children: [
                {
                    id: 7,
                    nama_latin: "Ibnu Syihab az-Zuhri",
                    nama_arab: "مُحَمَّدُ بْنُ مُسْلِمٍ الزُّهْرِيُّ",
                    tabaqah: "Tabi'in",
                    levelKey: "tabiin",
                    status: "Imam Al-Hafizh",
                    tahun_wafat: 124,
                    initial: "Z",
                    children: [
                        {
                            id: 13,
                            nama_latin: "Qutaibah bin Sa'id",
                            nama_arab: "قُتَيْبَةُ بْنُ سَعِيدٍ",
                            tabaqah: "Thabaqah 5",
                            levelKey: "tabiut_tabiin",
                            status: "Tsiqah Tsabat",
                            tahun_wafat: 240,
                            initial: "Q",
                            children: [
                                {
                                    id: 11,
                                    nama_latin: "Abu Dawud as-Sijistani",
                                    nama_arab: "أَبُو دَاوُدَ السِّجِسْتَانِيُّ",
                                    tabaqah: "Mukharrij (Sunan)",
                                    levelKey: "aimmah",
                                    status: "Imam Muhaddits",
                                    tahun_wafat: 275,
                                    initial: "D",
                                },
                                {
                                    id: 12,
                                    nama_latin: "Muhammad bin Isa at-Tirmidzi",
                                    nama_arab: "مُحَمَّدُ بْنُ عِيسَى التِّرْمِذِيُّ",
                                    tabaqah: "Mukharrij (Jami')",
                                    levelKey: "aimmah",
                                    status: "Imam Al-Hafizh",
                                    tahun_wafat: 279,
                                    initial: "T",
                                },
                            ],
                        },
                    ],
                },
            ],
        },
        {
            id: 2,
            nama_latin: "Abu Hurairah",
            nama_arab: "أَبُو هُرَيْرَةَ",
            tabaqah: "Sahabat",
            levelKey: "sahabat",
            status: "Rawi Terbanyak",
            tahun_wafat: 57,
            initial: "H",
            children: [
                {
                    id: 16,
                    nama_latin: "Atha' bin Yasar",
                    nama_arab: "عَطَاءُ بْنُ يَسَارٍ",
                    tabaqah: "Tabi'in",
                    levelKey: "tabiin",
                    status: "Tsiqah Fadlil",
                    tahun_wafat: 103,
                    initial: "Y",
                },
                {
                    id: 19,
                    nama_latin: "Amir bin Sa'd",
                    nama_arab: "عَامِرُ بْنُ سَعْدٍ",
                    tabaqah: "Tabi'in",
                    levelKey: "tabiin",
                    status: "Tsiqah",
                    tahun_wafat: 104,
                    initial: "S",
                },
            ],
        },
        {
            id: 5,
            nama_latin: "Aisyah Ummul Mukminin",
            nama_arab: "عَائِشَةُ أُمُّ المُؤْمِنِينَ",
            tabaqah: "Sahabat (Faqihah)",
            levelKey: "sahabat",
            status: "Tsiqah",
            tahun_wafat: 58,
            initial: "Ai",
            children: [
                {
                    id: 15,
                    nama_latin: "Abu Suhail Nafi' bin Malik",
                    nama_arab: "أَبُو سُهَيْلٍ نَافِعُ بْنُ مَالِكٍ",
                    tabaqah: "Thabaqah 4",
                    levelKey: "tabiin",
                    status: "Tsiqah",
                    tahun_wafat: 140,
                    initial: "S",
                },
                {
                    id: 21,
                    nama_latin: "Hanzhalah bin Abu Sufyan",
                    nama_arab: "حَنْظَلَةُ بْنُ أَبِي سُفْيَانَ",
                    tabaqah: "Thabaqah 6",
                    levelKey: "tabiin",
                    status: "Tsiqah Tsabat",
                    tahun_wafat: 151,
                    initial: "H",
                },
            ],
        },
    ],
};

function OrgCard({ node, basePath, isRoot = false }) {
    const levelStyle = LEVEL_COLORS[node.levelKey] || LEVEL_COLORS.tabiin;

    return (
        <Link
            href={`${basePath}/${node.id}`}
            className='group relative block transition-transform duration-200 hover:-translate-y-1 z-10'
        >
            <div
                className={`relative pt-5 pb-3 px-2.5 rounded-2xl bg-white dark:bg-slate-800 border-2 border-t-4 shadow-sm hover:shadow-xl transition-all duration-200 text-center w-[150px] sm:w-[170px] ${
                    isRoot
                        ? "border-purple-400 dark:border-purple-600 border-t-purple-600 ring-4 ring-purple-100 dark:ring-purple-950/50"
                        : `${levelStyle.border} ${levelStyle.accent}`
                }`}
            >
                {/* Floating Top Avatar Badge */}
                <div
                    className={`absolute -top-3.5 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-md ring-2 ring-white dark:ring-slate-800 transition-transform group-hover:scale-110 ${levelStyle.avatar}`}
                >
                    {node.initial || (node.nama_latin ? node.nama_latin[0] : "?")}
                </div>

                {/* Level / Tabaqah Badge */}
                <div className='mb-1'>
                    <span
                        className={`inline-block text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${levelStyle.badge}`}
                    >
                        {node.tabaqah}
                    </span>
                </div>

                {/* Arabic Name */}
                {node.nama_arab && (
                    <p
                        dir='rtl'
                        className='font-arabic text-xs text-gray-700 dark:text-gray-300 line-clamp-1 mb-0.5 leading-normal'
                    >
                        {node.nama_arab}
                    </p>
                )}

                {/* Latin Name */}
                <p className='text-xs font-bold text-gray-900 dark:text-white line-clamp-2 mb-1 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors leading-tight'>
                    {node.nama_latin}
                </p>

                {/* Metadata & Status */}
                <div className='flex items-center justify-center gap-1 text-[10px] text-gray-500 dark:text-gray-400'>
                    {node.tahun_wafat && <span>w. {node.tahun_wafat} H</span>}
                    {node.status && (
                        <>
                            <span>•</span>
                            <span className='font-medium text-teal-600 dark:text-teal-400 truncate max-w-[80px]'>
                                {node.status}
                            </span>
                        </>
                    )}
                </div>
            </div>
        </Link>
    );
}

function OrgTreeNode({ node, basePath, isRoot = false }) {
    const hasChildren = node.children && node.children.length > 0;

    return (
        <div className='flex flex-col items-center'>
            {/* The Node Card */}
            <OrgCard node={node} basePath={basePath} isRoot={isRoot} />

            {/* If children exist, draw vertical line down and branch out */}
            {hasChildren && (
                <div className='flex flex-col items-center w-full'>
                    {/* Vertical line from parent bottom to horizontal crossbar */}
                    <div className='w-0.5 h-6 bg-gray-300 dark:bg-slate-600' />

                    {/* Children row with horizontal crossbar */}
                    <div className='flex justify-center relative pt-6'>
                        {/* Horizontal Crossbar line spanning across children */}
                        {node.children.length > 1 && (
                            <div
                                className='absolute top-0 h-0.5 bg-gray-300 dark:bg-slate-600'
                                style={{
                                    left: `calc(100% / (${node.children.length} * 2))`,
                                    right: `calc(100% / (${node.children.length} * 2))`,
                                }}
                            />
                        )}

                        {/* Each Child branch */}
                        <div className='flex gap-4 sm:gap-6'>
                            {node.children.map((child, idx) => (
                                <div
                                    key={child.id || idx}
                                    className='relative flex flex-col items-center'
                                >
                                    {/* Drop line from horizontal crossbar into child node avatar */}
                                    <div className='absolute -top-6 w-0.5 h-6 bg-gray-300 dark:bg-slate-600' />

                                    {/* Recursive child tree */}
                                    <OrgTreeNode node={child} basePath={basePath} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function GlobalPerawiTree({ basePath = "/perawi" }) {
    const [zoom, setZoom] = useState(1);

    const zoomIn = () => setZoom((z) => Math.min(1.4, +(z + 0.1).toFixed(2)));
    const zoomOut = () => setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(2)));
    const zoomReset = () => setZoom(1);

    return (
        <div className='bg-slate-50 dark:bg-slate-900/60 rounded-3xl border border-gray-200 dark:border-slate-800 p-4 sm:p-6 shadow-inner'>
            {/* Header Legend & Zoom Controls */}
            <div className='flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-200 dark:border-slate-700/80'>
                <div>
                    <h2 className='text-base font-bold text-gray-900 dark:text-white flex items-center gap-2'>
                        <BsDiagram3Fill className='text-teal-600 dark:text-teal-400' />
                        Pohon Transmisi Sanad Hadis
                    </h2>
                    <p className='text-xs text-gray-500 dark:text-gray-400 mt-0.5'>
                        Bagan silsilah periwayatan dari Rasulullah ﷺ ke Sahabat, Tabi&apos;in, hingga Aimmatul Kutub
                    </p>
                </div>

                <div className='flex flex-wrap items-center gap-3'>
                    {/* Level Legend pills */}
                    <div className='flex flex-wrap items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold'>
                        <span className='flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800'>
                            <span className='w-2 h-2 rounded-full bg-purple-600' />
                            Nabi ﷺ
                        </span>
                        <span className='flex items-center gap-1 px-2 py-0.5 rounded-full bg-pink-100 text-pink-800 dark:bg-pink-950/60 dark:text-pink-300 border border-pink-200 dark:border-pink-800'>
                            <span className='w-2 h-2 rounded-full bg-pink-500' />
                            Sahabat
                        </span>
                        <span className='flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'>
                            <span className='w-2 h-2 rounded-full bg-amber-500' />
                            Tabi&apos;in
                        </span>
                        <span className='flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'>
                            <span className='w-2 h-2 rounded-full bg-emerald-600' />
                            Tabi&apos;ut Tabi&apos;in
                        </span>
                        <span className='flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800'>
                            <span className='w-2 h-2 rounded-full bg-blue-600' />
                            Aimmah
                        </span>
                    </div>

                    {/* Zoom Controller */}
                    <div className='flex items-center bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-0.5 shadow-sm text-xs'>
                        <button
                            type='button'
                            onClick={zoomOut}
                            className='p-1.5 text-gray-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700'
                            title='Perkecil (Zoom Out)'
                        >
                            <BsZoomOut />
                        </button>
                        <span className='px-2 font-mono text-[11px] font-semibold text-gray-700 dark:text-gray-300 min-w-[40px] text-center'>
                            {Math.round(zoom * 100)}%
                        </span>
                        <button
                            type='button'
                            onClick={zoomIn}
                            className='p-1.5 text-gray-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700'
                            title='Perbesar (Zoom In)'
                        >
                            <BsZoomIn />
                        </button>
                        <button
                            type='button'
                            onClick={zoomReset}
                            className='px-2 py-1 text-[11px] font-semibold text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-slate-700 rounded-lg ml-0.5'
                            title='Reset Skala'
                        >
                            Reset
                        </button>
                        <button
                            type='button'
                            onClick={() => setZoom(0.75)}
                            className='px-2 py-1 text-[11px] font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg'
                            title='Sesuaikan Layar (Fit View 75%)'
                        >
                            Fit
                        </button>
                    </div>
                </div>
            </div>

            {/* Scrollable Tree Canvas Container - Never clip left on scroll */}
            <div className='overflow-auto max-h-[85vh] p-4 sm:p-8 bg-white/70 dark:bg-slate-950/50 rounded-2xl border border-gray-100 dark:border-slate-800/80 shadow-sm'>
                <div className='inline-block min-w-full text-left'>
                    <div
                        className='w-max mx-auto flex flex-col items-center py-2 transition-transform duration-200'
                        style={{
                            transform: `scale(${zoom})`,
                            transformOrigin: "top center",
                        }}
                    >
                        <OrgTreeNode node={SANAD_TREE_DATA} basePath={basePath} isRoot />
                    </div>
                </div>
            </div>

            {/* Footer Hint */}
            <div className='flex items-center justify-between mt-4 text-xs text-gray-500 dark:text-gray-400 px-2'>
                <p className='flex items-center gap-1.5'>
                    <BsInfoCircle className='text-teal-600 shrink-0' />
                    <span>Klik kartu perawi untuk membuka detail &amp; riwayat lengkap. Gunakan zoom atau geser ke samping untuk eksplorasi.</span>
                </p>
                <span className='hidden sm:inline-block text-[11px] font-medium bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded text-gray-400'>
                    ↔ Geser / Zoom untuk melihat seluruh cabang
                </span>
            </div>
        </div>
    );
}
