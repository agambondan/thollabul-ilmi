"use client";

import Link from "next/link";
import { useState, useRef } from "react";
import {
    BsDiagram3Fill,
    BsInfoCircle,
    BsZoomIn,
    BsZoomOut,
    BsFilter,
    BsSearch,
    BsX,
    BsDownload,
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

const ALL_40_PERAWI_TREE = {
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
            branchKey: "ibnu_umar",
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
                            nama_latin: "Malik bin Anas",
                            nama_arab: "مَالِكُ بْنُ أَنَسٍ",
                            tabaqah: "Tabi'ut Tabi'in",
                            levelKey: "tabiut_tabiin",
                            status: "Imam Darul Hijrah",
                            tahun_wafat: 179,
                            initial: "M",
                            children: [
                                {
                                    id: 23,
                                    nama_latin: "Muhammad bin Idris asy-Syafi'i",
                                    nama_arab: "مُحَمَّدُ بْنُ إِدْرِيسَ الشَّافِعِيُّ",
                                    tabaqah: "Imam Mazhab (Tabaqah 5)",
                                    levelKey: "aimmah",
                                    status: "Nashirus Sunnah",
                                    tahun_wafat: 204,
                                    initial: "S",
                                    children: [
                                        {
                                            id: 22,
                                            nama_latin: "Ahmad bin Hanbal",
                                            nama_arab: "أَحْمَدُ بْنُ حَنْبَلٍ",
                                            tabaqah: "Imam Mazhab (Tabaqah 5)",
                                            levelKey: "aimmah",
                                            status: "Imam Ahlus Sunnah",
                                            tahun_wafat: 241,
                                            initial: "Ah",
                                            children: [
                                                {
                                                    id: 9,
                                                    nama_latin: "Muhammad bin Ismail al-Bukhari",
                                                    nama_arab: "مُحَمَّدُ بْنُ إِسْمَاعِيلَ البُخَارِيُّ",
                                                    tabaqah: "Mukharrij (Shahih)",
                                                    levelKey: "aimmah",
                                                    status: "Amirul Mukminin",
                                                    tahun_wafat: 256,
                                                    initial: "B",
                                                },
                                                {
                                                    id: 10,
                                                    nama_latin: "Muslim bin al-Hajjaj",
                                                    nama_arab: "مُسْلِمُ بْنُ الحَجَّاجِ",
                                                    tabaqah: "Mukharrij (Shahih)",
                                                    levelKey: "aimmah",
                                                    status: "Imam Tsiqah",
                                                    tahun_wafat: 261,
                                                    initial: "Mu",
                                                },
                                                {
                                                    id: 11,
                                                    nama_latin: "Abu Dawud as-Sijistani",
                                                    nama_arab: "أَبُو دَاوُدَ السِّجِسْتَانِيُّ",
                                                    tabaqah: "Mukharrij (Sunan)",
                                                    levelKey: "aimmah",
                                                    status: "Imam Muhaddits",
                                                    tahun_wafat: 275,
                                                    initial: "D",
                                                    children: [
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
                            ],
                        },
                    ],
                },
                {
                    id: 56,
                    nama_latin: "Ikrimah bin Khalid",
                    nama_arab: "عِكْرِمَةُ بْنُ خَالِدٍ",
                    tabaqah: "Thabaqah 4",
                    levelKey: "tabiin",
                    status: "Tsiqah",
                    tahun_wafat: 114,
                    initial: "I",
                },
                {
                    id: 55,
                    nama_latin: "Hanzhalah bin Abu Sufyan",
                    nama_arab: "حَنْظَلَةُ بْنُ أَبِي سُفْيَانَ",
                    tabaqah: "Thabaqah 6",
                    levelKey: "tabiut_tabiin",
                    status: "Tsiqah Tsabat",
                    tahun_wafat: 151,
                    initial: "H",
                    children: [
                        {
                            id: 54,
                            nama_latin: "Ubaidullah bin Musa",
                            nama_arab: "عُبَيْدُ اللَّهِ بْنُ مُوسَى",
                            tabaqah: "Thabaqah 9",
                            levelKey: "aimmah",
                            status: "Tsiqah",
                            tahun_wafat: 213,
                            initial: "Ub",
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
            branchKey: "abu_hurairah",
            children: [
                {
                    id: 20,
                    nama_latin: "Sa'id bin al-Musayyab",
                    nama_arab: "سَعِيدُ بْنُ المُسَيَّبِ",
                    tabaqah: "Sayyidut Tabi'in",
                    levelKey: "tabiin",
                    status: "Faqih Madinah",
                    tahun_wafat: 94,
                    initial: "M",
                },
                {
                    id: 21,
                    nama_latin: "Abu Salamah bin Abdurrahman",
                    nama_arab: "أَبُو سَلَمَةَ بْنُ عَبْدِ الرَّحْمَنِ",
                    tabaqah: "Tabi'in",
                    levelKey: "tabiin",
                    status: "Faqih Madinah",
                    tahun_wafat: 104,
                    initial: "Sl",
                },
                {
                    id: 50,
                    nama_latin: "Atha' bin Yasar",
                    nama_arab: "عَطَاءُ بْنُ يَسَارٍ",
                    tabaqah: "Thabaqah 3",
                    levelKey: "tabiin",
                    status: "Tsiqah Fadlil",
                    tahun_wafat: 103,
                    initial: "Y",
                },
                {
                    id: 53,
                    nama_latin: "Amir bin Sa'd",
                    nama_arab: "عَامِرُ بْنُ سَعْدٍ",
                    tabaqah: "Thabaqah 3",
                    levelKey: "tabiin",
                    status: "Tsiqah",
                    tahun_wafat: 104,
                    initial: "Am",
                    children: [
                        {
                            id: 52,
                            nama_latin: "Bukair bin Mismar",
                            nama_arab: "بُكَيْرُ بْنُ مِسْمَارٍ",
                            tabaqah: "Thabaqah 6",
                            levelKey: "tabiut_tabiin",
                            status: "Shaduq",
                            tahun_wafat: 150,
                            initial: "Bk",
                        },
                    ],
                },
                {
                    id: 61,
                    nama_latin: "Abu Zur'ah bin Amr bin Jarir",
                    nama_arab: "أَبُو زُرْعَةَ بْنُ عَمْرٍو",
                    tabaqah: "Tabi'in",
                    levelKey: "tabiin",
                    status: "Tsiqah",
                    initial: "Z",
                    children: [
                        {
                            id: 60,
                            nama_latin: "Abu Hayyan at-Taimi",
                            nama_arab: "أَبُو حَيَّانَ التَّيْمِيُّ",
                            tabaqah: "Thabaqah 6",
                            levelKey: "tabiut_tabiin",
                            status: "Tsiqah",
                            tahun_wafat: 145,
                            initial: "Hy",
                            children: [
                                {
                                    id: 59,
                                    nama_latin: "Isma'il bin Ibrahim (Ibnu 'Ulayyah)",
                                    nama_arab: "إِسْمَاعِيلُ بْنُ إِبْرَاهِيمَ",
                                    tabaqah: "Thabaqah 8",
                                    levelKey: "tabiut_tabiin",
                                    status: "Hafizh Tsiqah",
                                    tahun_wafat: 193,
                                    initial: "Ul",
                                    children: [
                                        {
                                            id: 58,
                                            nama_latin: "Musaddad bin Musarhad",
                                            nama_arab: "مُسَدَّدُ بْنُ مُسَرْهَدٍ",
                                            tabaqah: "Thabaqah 10",
                                            levelKey: "aimmah",
                                            status: "Hafizh Bashrah",
                                            tahun_wafat: 228,
                                            initial: "Ms",
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
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
            branchKey: "anas_bin_malik",
            children: [
                {
                    id: 7,
                    nama_latin: "Ibnu Syihab az-Zuhri",
                    nama_arab: "مُحَمَّدُ بْنُ مُسْلِمٍ الزُّهْرِيُّ",
                    tabaqah: "Tabi'in",
                    levelKey: "tabiin",
                    status: "Imam Al-Hafizh",
                    tahun_wafat: 124,
                    initial: "Zh",
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
                        },
                    ],
                },
                {
                    id: 64,
                    nama_latin: "Qatadah bin Di'amah",
                    nama_arab: "قَتَادَةُ بْنُ دِعَامَةَ",
                    tabaqah: "Thabaqah 4",
                    levelKey: "tabiin",
                    status: "Hafizh Mufassir",
                    tahun_wafat: 117,
                    initial: "Qt",
                    children: [
                        {
                            id: 63,
                            nama_latin: "Syu'bah bin al-Hajjaj",
                            nama_arab: "شُعْبَةُ بْنُ الحَجَّاجِ",
                            tabaqah: "Thabaqah 7",
                            levelKey: "tabiut_tabiin",
                            status: "Amirul Mukminin",
                            tahun_wafat: 160,
                            initial: "Sy",
                            children: [
                                {
                                    id: 62,
                                    nama_latin: "Yahya bin Sa'id al-Qattan",
                                    nama_arab: "يَحْيَى بْنُ سَعِيدٍ القَطَّانُ",
                                    tabaqah: "Thabaqah 9",
                                    levelKey: "aimmah",
                                    status: "Imam Naqid Hadits",
                                    tahun_wafat: 198,
                                    initial: "Yh",
                                },
                            ],
                        },
                    ],
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
            branchKey: "aisyah",
            children: [
                {
                    id: 49,
                    nama_latin: "Abu Suhail Nafi' bin Malik",
                    nama_arab: "أَبُو سُهَيْلٍ نَافِعُ بْنُ مَالِكٍ",
                    tabaqah: "Thabaqah 4",
                    levelKey: "tabiin",
                    status: "Tsiqah",
                    tahun_wafat: 140,
                    initial: "Sh",
                    children: [
                        {
                            id: 48,
                            nama_latin: "Ismail bin Ja'far",
                            nama_arab: "إِسْمَاعِيلُ بْنُ جَعْفَرٍ",
                            tabaqah: "Thabaqah 8",
                            levelKey: "tabiut_tabiin",
                            status: "Qari & Tsiqah",
                            tahun_wafat: 180,
                            initial: "J",
                            children: [
                                {
                                    id: 51,
                                    nama_latin: "Sulaiman Abu ar-Rabi'",
                                    nama_arab: "سُلَيْمَانُ أَبُو الرَّبِيعِ",
                                    tabaqah: "Thabaqah 10",
                                    levelKey: "aimmah",
                                    status: "Tsiqah",
                                    tahun_wafat: 234,
                                    initial: "Sl",
                                },
                            ],
                        },
                    ],
                },
            ],
        },
        {
            id: 14,
            nama_latin: "Umar bin Khattab",
            nama_arab: "عُمَرُ بْنُ الخَطَّابِ",
            tabaqah: "Khulafaur Rasyidin",
            levelKey: "sahabat",
            status: "Amirul Mukminin",
            tahun_wafat: 23,
            initial: "Um",
            branchKey: "sahabat_lainnya",
            children: [
                {
                    id: 57,
                    nama_latin: "Malik bin Abi 'Amir",
                    nama_arab: "مَالِكُ بْنُ أَبِي عَامِرٍ",
                    tabaqah: "Kibarut Tabi'in",
                    levelKey: "tabiin",
                    status: "Kakek Imam Malik",
                    tahun_wafat: 74,
                    initial: "Ma",
                },
            ],
        },
        {
            id: 15,
            nama_latin: "Ali bin Abi Talib",
            nama_arab: "عَلِيُّ بْنُ أَبِي طَالِبٍ",
            tabaqah: "Khulafaur Rasyidin",
            levelKey: "sahabat",
            status: "Amirul Mukminin",
            tahun_wafat: 40,
            initial: "Al",
            branchKey: "sahabat_lainnya",
        },
        {
            id: 16,
            nama_latin: "Abdullah bin Abbas",
            nama_arab: "عَبْدُ اللَّهِ بْنُ عَبَّاسٍ",
            tabaqah: "Habrul Ummah",
            levelKey: "sahabat",
            status: "Tarjumanul Quran",
            tahun_wafat: 68,
            initial: "Ab",
            branchKey: "sahabat_lainnya",
        },
        {
            id: 17,
            nama_latin: "Jabir bin Abdullah",
            nama_arab: "جَابِرُ بْنُ عَبْدِ اللَّهِ",
            tabaqah: "Sahabat",
            levelKey: "sahabat",
            status: "Muktsirun",
            tahun_wafat: 78,
            initial: "Jb",
            branchKey: "sahabat_lainnya",
        },
        {
            id: 18,
            nama_latin: "Abu Sa'id al-Khudri",
            nama_arab: "أَبُو سَعِيدٍ الخُدْرِيُّ",
            tabaqah: "Sahabat",
            levelKey: "sahabat",
            status: "Muktsirun",
            tahun_wafat: 74,
            initial: "Kh",
            branchKey: "sahabat_lainnya",
        },
        {
            id: 19,
            nama_latin: "Abdullah bin Mas'ud",
            nama_arab: "عَبْدُ اللَّهِ بْنُ مَسْعُودٍ",
            tabaqah: "Sahabat (Faqih Kufah)",
            levelKey: "sahabat",
            status: "Kibarush Shahabah",
            tahun_wafat: 32,
            initial: "Ms",
            branchKey: "sahabat_lainnya",
        },
    ],
};

function checkNodeMatch(node, q) {
    if (!q) return false;
    const query = q.toLowerCase();
    return (
        (node.nama_latin && node.nama_latin.toLowerCase().includes(query)) ||
        (node.nama_arab && node.nama_arab.includes(query)) ||
        (node.tabaqah && node.tabaqah.toLowerCase().includes(query))
    );
}

function countMatches(node, q) {
    if (!q) return 0;
    let count = checkNodeMatch(node, q) ? 1 : 0;
    if (node.children) {
        for (const c of node.children) {
            count += countMatches(c, q);
        }
    }
    return count;
}

function OrgCard({ node, basePath, isRoot = false, searchQuery = "" }) {
    const levelStyle = LEVEL_COLORS[node.levelKey] || LEVEL_COLORS.tabiin;
    const isMatch = checkNodeMatch(node, searchQuery);
    const isFaded = Boolean(searchQuery && !isMatch);

    return (
        <Link
            href={`${basePath}/${node.id}`}
            className={`group relative block transition-all duration-200 z-10 ${
                isFaded ? "opacity-30 grayscale hover:opacity-100 hover:grayscale-0" : ""
            } ${isMatch ? "scale-105" : "hover:-translate-y-1"}`}
        >
            <div
                className={`relative pt-5 pb-3 px-2 rounded-2xl bg-white dark:bg-slate-800 border-2 border-t-4 shadow-sm hover:shadow-xl transition-all duration-200 text-center w-[145px] sm:w-[165px] ${
                    isMatch
                        ? "ring-4 ring-amber-400 ring-offset-2 dark:ring-offset-slate-900 border-amber-500 border-t-amber-500 shadow-amber-500/20"
                        : isRoot
                          ? "border-purple-400 dark:border-purple-600 border-t-purple-600 ring-4 ring-purple-100 dark:ring-purple-950/50"
                          : `${levelStyle.border} ${levelStyle.accent}`
                }`}
            >
                {/* Floating Top Avatar Badge */}
                <div
                    className={`absolute -top-3.5 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-md ring-2 ring-white dark:ring-slate-800 transition-transform group-hover:scale-110 ${
                        isMatch ? "bg-amber-500 text-white" : levelStyle.avatar
                    }`}
                >
                    {node.initial || (node.nama_latin ? node.nama_latin[0] : "?")}
                </div>

                {/* Level / Tabaqah Badge */}
                <div className='mb-1'>
                    <span
                        className={`inline-block text-[8.5px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${levelStyle.badge} truncate max-w-[130px]`}
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
                <p
                    className={`text-xs font-bold leading-tight line-clamp-2 mb-1 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors ${
                        isMatch ? "text-amber-700 dark:text-amber-400" : "text-gray-900 dark:text-white"
                    }`}
                >
                    {node.nama_latin}
                </p>

                {/* Metadata & Status */}
                <div className='flex items-center justify-center gap-1 text-[9.5px] text-gray-500 dark:text-gray-400'>
                    {node.tahun_wafat && <span>w. {node.tahun_wafat} H</span>}
                    {node.status && (
                        <>
                            <span>•</span>
                            <span className='font-medium text-teal-600 dark:text-teal-400 truncate max-w-[75px]'>
                                {node.status}
                            </span>
                        </>
                    )}
                </div>
            </div>
        </Link>
    );
}

function OrgTreeNode({ node, basePath, isRoot = false, searchQuery = "" }) {
    const hasChildren = node.children && node.children.length > 0;

    return (
        <div className='flex flex-col items-center'>
            {/* The Node Card */}
            <OrgCard node={node} basePath={basePath} isRoot={isRoot} searchQuery={searchQuery} />

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
                        <div className='flex gap-3 sm:gap-5'>
                            {node.children.map((child, idx) => (
                                <div
                                    key={child.id || idx}
                                    className='relative flex flex-col items-center'
                                >
                                    {/* Drop line from horizontal crossbar into child node avatar */}
                                    <div className='absolute -top-6 w-0.5 h-6 bg-gray-300 dark:bg-slate-600' />

                                    {/* Recursive child tree */}
                                    <OrgTreeNode
                                        node={child}
                                        basePath={basePath}
                                        searchQuery={searchQuery}
                                    />
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
    const [zoom, setZoom] = useState(0.8);
    const [selectedBranch, setSelectedBranch] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [exporting, setExporting] = useState(false);
    const treeRef = useRef(null);

    const zoomIn = () => setZoom((z) => Math.min(1.4, +(z + 0.1).toFixed(2)));
    const zoomOut = () => setZoom((z) => Math.max(0.4, +(z - 0.1).toFixed(2)));
    const zoomReset = () => setZoom(1);

    // Filter tree by selected branch if requested
    const filteredTree = {
        ...ALL_40_PERAWI_TREE,
        children:
            selectedBranch === "all"
                ? ALL_40_PERAWI_TREE.children
                : ALL_40_PERAWI_TREE.children.filter((c) =>
                      selectedBranch === "sahabat_lainnya"
                          ? c.branchKey === "sahabat_lainnya"
                          : c.branchKey === selectedBranch,
                  ),
    };

    const matchTotal = searchQuery ? countMatches(filteredTree, searchQuery) : 0;

    const handleExportPNG = async () => {
        if (!treeRef.current || exporting) return;
        setExporting(true);
        try {
            const html2canvas = (await import("html2canvas")).default;
            const originalTransform = treeRef.current.style.transform;
            treeRef.current.style.transform = "scale(1)";

            const canvas = await html2canvas(treeRef.current, {
                backgroundColor: "#0f172a",
                scale: 2,
                useCORS: true,
                logging: false,
            });

            treeRef.current.style.transform = originalTransform;

            const link = document.createElement("a");
            link.download = `silsilah-sanad-hadis-${selectedBranch}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
        } catch (err) {
            console.error("Export error:", err);
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className='bg-slate-50 dark:bg-slate-900/60 rounded-3xl border border-gray-200 dark:border-slate-800 p-4 sm:p-6 shadow-inner'>
            {/* Header Legend & Zoom Controls */}
            <div className='flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5 pb-4 border-b border-gray-200 dark:border-slate-700/80'>
                <div>
                    <h2 className='text-base font-bold text-gray-900 dark:text-white flex items-center gap-2'>
                        <BsDiagram3Fill className='text-teal-600 dark:text-teal-400' />
                        Pohon Transmisi Sanad Hadis Lengkap (40 Perawi)
                    </h2>
                    <p className='text-xs text-gray-500 dark:text-gray-400 mt-0.5'>
                        Bagan lengkap silsilah transmisi 40 perawi dari Rasulullah ﷺ ke 10 Sahabat, Tabi&apos;in, hingga Aimmatul Kutub
                    </p>
                </div>

                <div className='flex flex-wrap items-center gap-3'>
                    {/* Level Legend pills */}
                    <div className='flex flex-wrap items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold'>
                        <span className='flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800'>
                            <span className='w-2 h-2 rounded-full bg-purple-600' />
                            Nabi ﷺ (1)
                        </span>
                        <span className='flex items-center gap-1 px-2 py-0.5 rounded-full bg-pink-100 text-pink-800 dark:bg-pink-950/60 dark:text-pink-300 border border-pink-200 dark:border-pink-800'>
                            <span className='w-2 h-2 rounded-full bg-pink-500' />
                            Sahabat (10)
                        </span>
                        <span className='flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'>
                            <span className='w-2 h-2 rounded-full bg-amber-500' />
                            Tabi&apos;in (11)
                        </span>
                        <span className='flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'>
                            <span className='w-2 h-2 rounded-full bg-emerald-600' />
                            Tabi&apos;ut Tabi&apos;in (8)
                        </span>
                        <span className='flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800'>
                            <span className='w-2 h-2 rounded-full bg-blue-600' />
                            Aimmah (10)
                        </span>
                    </div>

                    {/* Zoom & Export Controller */}
                    <div className='flex items-center gap-1.5'>
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
                                title='Reset Skala 100%'
                            >
                                100%
                            </button>
                            <button
                                type='button'
                                onClick={() => setZoom(0.65)}
                                className='px-2 py-1 text-[11px] font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg'
                                title='Sesuaikan Layar (Fit View 65%)'
                            >
                                Fit
                            </button>
                        </div>

                        {/* Export PNG button */}
                        <button
                            type='button'
                            onClick={handleExportPNG}
                            disabled={exporting}
                            className='flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors'
                            title='Simpan Diagram sebagai Gambar PNG'
                        >
                            <BsDownload />
                            <span>{exporting ? "Menyimpan..." : "Export PNG"}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Interactive Search & Branch Controls Row */}
            <div className='flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-4'>
                {/* Branch Quick Filter Tabs */}
                <div className='flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide text-xs'>
                    <span className='text-gray-400 flex items-center gap-1 mr-1 text-[11px] font-medium shrink-0'>
                        <BsFilter /> Fokus Jalur:
                    </span>
                    {[
                        { key: "all", label: "Semua Jalur (40 Perawi)" },
                        { key: "ibnu_umar", label: "Jalur Ibnu Umar (Silsilah Emas)" },
                        { key: "abu_hurairah", label: "Jalur Abu Hurairah" },
                        { key: "anas_bin_malik", label: "Jalur Anas bin Malik" },
                        { key: "aisyah", label: "Jalur Aisyah r.a." },
                        { key: "sahabat_lainnya", label: "Sahabat Utama Lainnya" },
                    ].map(({ key, label }) => (
                        <button
                            key={key}
                            type='button'
                            onClick={() => setSelectedBranch(key)}
                            className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap shrink-0 transition-colors ${
                                selectedBranch === key
                                    ? "bg-teal-600 text-white shadow-sm"
                                    : "bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-700 hover:bg-teal-50 dark:hover:bg-teal-900/20"
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* Node Search & Highlight Box */}
                <div className='relative min-w-[220px] sm:min-w-[260px] self-start md:self-auto'>
                    <span className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs'>
                        <BsSearch />
                    </span>
                    <input
                        type='text'
                        placeholder='Cari & sorot perawi...'
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className='w-full pl-8 pr-16 py-1.5 border border-gray-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 shadow-sm'
                    />
                    {searchQuery ? (
                        <div className='absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1'>
                            <span className='text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300'>
                                {matchTotal}
                            </span>
                            <button
                                type='button'
                                onClick={() => setSearchQuery("")}
                                className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-0.5'
                            >
                                <BsX className='text-sm' />
                            </button>
                        </div>
                    ) : null}
                </div>
            </div>

            {/* Scrollable Tree Canvas Container - Never clip left on scroll */}
            <div className='overflow-auto max-h-[85vh] p-4 sm:p-8 bg-white/70 dark:bg-slate-950/50 rounded-2xl border border-gray-100 dark:border-slate-800/80 shadow-sm scrollbar-thin'>
                <div className='inline-block min-w-full text-left'>
                    <div
                        ref={treeRef}
                        className='w-max mx-auto flex flex-col items-center py-2 transition-transform duration-200'
                        style={{
                            transform: `scale(${zoom})`,
                            transformOrigin: "top center",
                        }}
                    >
                        <OrgTreeNode
                            node={filteredTree}
                            basePath={basePath}
                            isRoot
                            searchQuery={searchQuery}
                        />
                    </div>
                </div>
            </div>

            {/* Footer Hint */}
            <div className='flex items-center justify-between mt-4 text-xs text-gray-500 dark:text-gray-400 px-2'>
                <p className='flex items-center gap-1.5'>
                    <BsInfoCircle className='text-teal-600 shrink-0' />
                    <span>Klik kartu perawi untuk membuka biografi, jarh wa ta&apos;dil, dan sanad. Pilih tab fokus jalur atau gunakan zoom untuk kenyamanan navigasi.</span>
                </p>
                <span className='hidden sm:inline-block text-[11px] font-medium bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded text-gray-400'>
                    Total 40 Perawi Terhubung
                </span>
            </div>
        </div>
    );
}
