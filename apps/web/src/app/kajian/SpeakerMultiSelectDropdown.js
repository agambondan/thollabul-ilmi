"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";

export default function SpeakerMultiSelectDropdown({
    speakers = [],
    selectedSpeakers = [],
    onChange,
    t = (k) => k,
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const dropdownRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    const filteredSpeakers = useMemo(() => {
        if (!search.trim()) return speakers;
        const q = search.toLowerCase();
        return speakers.filter((s) => s.toLowerCase().includes(q));
    }, [speakers, search]);

    const isAllSelected =
        selectedSpeakers.length === 0 ||
        selectedSpeakers.length === speakers.length;

    const handleToggle = (speaker) => {
        let next;
        if (selectedSpeakers.includes(speaker)) {
            next = selectedSpeakers.filter((s) => s !== speaker);
        } else {
            next = [...selectedSpeakers, speaker];
        }
        if (next.length === speakers.length) {
            onChange([]);
        } else {
            onChange(next);
        }
    };

    const handleSelectAll = () => {
        onChange([]);
    };

    const handleClear = () => {
        onChange([]);
    };

    const formatSpeakerName = (s) => {
        return s.replace(/^Ust\.\s*Dr\.\s*/i, "Ust. ");
    };

    return (
        <div className='relative mb-4' ref={dropdownRef}>
            <div className='flex items-center justify-between gap-2 mb-1.5'>
                <p className='text-[10px] uppercase tracking-wide text-gray-400'>
                    {t("kajian.filter_speaker") || "Filter Ustadz"}
                </p>
                {selectedSpeakers.length > 0 && (
                    <button
                        type='button'
                        onClick={handleClear}
                        className='text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline'
                    >
                        {t("common.reset") || "Reset"}
                    </button>
                )}
            </div>

            <button
                type='button'
                onClick={() => setIsOpen((prev) => !prev)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs font-medium rounded-xl border transition-all text-left ${
                    selectedSpeakers.length > 0
                        ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200"
                        : "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-200 hover:border-gray-300 dark:hover:border-slate-600"
                }`}
            >
                <div className='flex items-center gap-2 truncate'>
                    <span className='text-sm shrink-0'>🎙️</span>
                    <span className='truncate'>
                        {selectedSpeakers.length === 0
                            ? t("kajian.transcript_all_speakers") ||
                              "Semua Ustadz"
                            : selectedSpeakers.length === 1
                              ? formatSpeakerName(selectedSpeakers[0])
                              : `${selectedSpeakers.length} Ustadz Dipilih`}
                    </span>
                </div>

                <div className='flex items-center gap-1.5 shrink-0'>
                    {selectedSpeakers.length > 0 && (
                        <span className='px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-600 text-white'>
                            {selectedSpeakers.length}
                        </span>
                    )}
                    <svg
                        className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                            isOpen ? "rotate-180" : ""
                        }`}
                        fill='none'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                    >
                        <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M19 9l-7 7-7-7'
                        />
                    </svg>
                </div>
            </button>

            {selectedSpeakers.length > 0 && (
                <div className='flex flex-wrap gap-1.5 mt-2'>
                    {selectedSpeakers.map((s) => (
                        <span
                            key={s}
                            className='inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 text-[11px]'
                        >
                            <span className='truncate max-w-[160px]'>
                                {formatSpeakerName(s)}
                            </span>
                            <button
                                type='button'
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggle(s);
                                }}
                                className='hover:text-emerald-950 dark:hover:text-white ml-0.5'
                                title='Hapus'
                            >
                                ×
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {isOpen && (
                <div className='absolute z-30 mt-1.5 w-full bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-200 dark:border-slate-700 p-2 overflow-hidden animate-in fade-in zoom-in-95 duration-100'>

                    <div className='mb-2 relative'>
                        <input
                            type='text'
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder='🔍 Cari ustadz...'
                            className='w-full px-2.5 py-1.5 text-xs rounded-lg bg-gray-50 dark:bg-slate-700/60 border border-gray-200 dark:border-slate-600 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500'
                        />
                        {search && (
                            <button
                                type='button'
                                onClick={() => setSearch("")}
                                className='absolute right-2 top-1.5 text-xs text-gray-400 hover:text-gray-600'
                            >
                                ×
                            </button>
                        )}
                    </div>


                    <div className='flex items-center justify-between px-1 py-1 mb-1 border-b border-gray-100 dark:border-slate-700/60 text-[11px]'>
                        <button
                            type='button'
                            onClick={handleSelectAll}
                            className={`font-semibold transition-colors ${
                                isAllSelected
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-gray-500 hover:text-emerald-600"
                            }`}
                        >
                            ✓ {t("common.all") || "Pilih Semua"}
                        </button>
                        {selectedSpeakers.length > 0 && (
                            <button
                                type='button'
                                onClick={handleClear}
                                className='text-gray-400 hover:text-red-500 dark:hover:text-red-400'
                            >
                                {t("common.clear") || "Hapus Pilihan"}
                            </button>
                        )}
                    </div>


                    <div className='max-h-56 overflow-y-auto space-y-0.5 pr-1 scrollbar-thin'>
                        {filteredSpeakers.length === 0 ? (
                            <div className='py-4 text-center text-xs text-gray-400'>
                                Ustadz tidak ditemukan
                            </div>
                        ) : (
                            filteredSpeakers.map((s) => {
                                const isChecked = selectedSpeakers.includes(s);
                                return (
                                    <label
                                        key={s}
                                        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs cursor-pointer transition-colors select-none ${
                                            isChecked
                                                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-medium"
                                                : "hover:bg-gray-50 dark:hover:bg-slate-700/50 text-gray-700 dark:text-gray-300"
                                        }`}
                                    >
                                        <input
                                            type='checkbox'
                                            checked={isChecked}
                                            onChange={() => handleToggle(s)}
                                            className='w-3.5 h-3.5 rounded border-gray-300 dark:border-slate-600 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600'
                                        />
                                        <span className='truncate flex-1'>
                                            {formatSpeakerName(s)}
                                        </span>
                                    </label>
                                );
                            })
                        )}
                    </div>


                    <div className='mt-2 pt-1.5 border-t border-gray-100 dark:border-slate-700/60 px-1 flex items-center justify-between text-[10px] text-gray-400'>
                        <span>
                            {selectedSpeakers.length === 0
                                ? "Menampilkan semua"
                                : `${selectedSpeakers.length} dari ${speakers.length} ustadz`}
                        </span>
                        <button
                            type='button'
                            onClick={() => setIsOpen(false)}
                            className='px-2 py-0.5 bg-emerald-600 text-white rounded font-medium hover:bg-emerald-700 text-[11px]'
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
