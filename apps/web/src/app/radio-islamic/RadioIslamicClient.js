"use client";

import ContentWidth from "@/components/layout/ContentWidth";
import { ISLAMIC_RADIOS, RADIO_DOMISILI } from "@/lib/masjidRadioData";
import { radioIslamicApi } from "@/lib/api";
import { pickItems } from "@/lib/personalSync";
import { useMemo, useRef, useState } from "react";
import {
    MdInfoOutline,
    MdPause,
    MdPlayArrow,
    MdRadio,
    MdSearch,
    MdVolumeUp,
} from "react-icons/md";

const normalize = (value) => String(value || "").toLowerCase();

export function RadioIslamicClientContent({
    initialRadios = [],
    initialTotal = 0,
}) {
    const [query, setQuery] = useState("");
    const [domisili, setDomisili] = useState("Semua Domisili");
    const [radios, setRadios] = useState(
        initialRadios.length ? initialRadios : ISLAMIC_RADIOS,
    );
    const [activeRadio, setActiveRadio] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioError, setAudioError] = useState("");
    const audioRef = useRef(null);

    const visibleRadios = useMemo(() => {
        const q = normalize(query);
        return radios.filter((r) => {
            const matchQuery =
                !q ||
                normalize(r.name).includes(q) ||
                normalize(r.frequency).includes(q) ||
                normalize(r.city).includes(q) ||
                normalize(r.description).includes(q) ||
                normalize(r.tags).includes(q);
            const matchDomisili =
                domisili === "Semua Domisili" ||
                normalize(r.city).includes(normalize(domisili)) ||
                (domisili === "Nasional / Streaming" &&
                    (normalize(r.city).includes("nasional") ||
                        normalize(r.frequency).includes("stream") ||
                        normalize(r.frequency).includes("online")));
            return matchQuery && matchDomisili;
        });
    }, [domisili, query, radios]);

    const handleFilterDomisili = async (nextDomisili) => {
        setDomisili(nextDomisili);
        try {
            const cityParam =
                nextDomisili === "Semua Domisili" ||
                nextDomisili === "Nasional / Streaming"
                    ? ""
                    : nextDomisili;
            const payload = await radioIslamicApi.list({
                city: cityParam,
                size: 100,
            });
            setRadios(pickItems(payload));
        } catch {
            setRadios(ISLAMIC_RADIOS);
        }
    };

    const togglePlay = (radio) => {
        setAudioError("");
        if (activeRadio?.id === radio.id && isPlaying) {
            audioRef.current?.pause();
            setIsPlaying(false);
            return;
        }

        const stream = radio.streamUrl || radio.stream_url;
        if (!stream) {
            setAudioError(`Siaran online untuk ${radio.name} belum tersedia.`);
            return;
        }

        setActiveRadio(radio);
        setIsPlaying(true);
        if (audioRef.current) {
            audioRef.current.src = stream;
            audioRef.current.play().catch(() => {
                setIsPlaying(false);
                setAudioError("Gagal memutar siaran radio.");
            });
        }
    };

    return (
        <ContentWidth compact='max-w-5xl' className='px-4 pt-navbar pb-12'>
            <div className='mb-6 text-center'>
                <div className='inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'>
                    <MdRadio className='text-4xl' />
                </div>
                <h1 className='mt-4 text-2xl font-extrabold text-emerald-950 dark:text-emerald-50 sm:text-3xl'>
                    Radio Islam & Frekuensi
                </h1>
                <p className='mx-auto mt-2 max-w-2xl text-sm text-gray-600 dark:text-gray-300'>
                    Daftar radio dakwah dan tilawah Al-Qur&apos;an berdasarkan
                    frekuensi AM/FM dan kota domisili.
                </p>
            </div>

            <div className='mb-6 rounded-3xl border border-blue-100 bg-blue-50/70 p-5 dark:border-blue-900/40 dark:bg-blue-950/20'>
                <div className='flex items-start gap-3.5'>
                    <MdInfoOutline className='mt-0.5 shrink-0 text-xl text-blue-700 dark:text-blue-400' />
                    <div className='text-sm leading-relaxed text-blue-950 dark:text-blue-200'>
                        <p className='font-bold'>
                            Kenapa 1 frekuensi bisa beda radio tergantung
                            daerah?
                        </p>
                        <p className='mt-1'>
                            Gelombang radio terrestrial (FM/AM) memiliki
                            jangkauan terbatas dan diatur oleh Izin Stasiun
                            Radio (ISR) per wilayah geografis. Oleh karena itu,
                            frekuensi yang sama (misalnya 99.3 FM) dapat
                            digunakan oleh stasiun berbeda di kota lain tanpa
                            saling bertabrakan sinyal.
                        </p>
                    </div>
                </div>
            </div>

            {activeRadio && (
                <div className='sticky top-20 z-30 mb-6 rounded-3xl border border-emerald-200 bg-emerald-700 p-4 text-white shadow-xl dark:border-emerald-600 dark:bg-emerald-800'>
                    <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                        <div className='flex items-center gap-3'>
                            <div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-2xl'>
                                <MdVolumeUp />
                            </div>
                            <div>
                                <span className='rounded-full bg-emerald-900/40 px-2.5 py-0.5 text-xs font-bold text-emerald-200'>
                                    {activeRadio.frequency} · {activeRadio.city}
                                </span>
                                <h3 className='font-bold text-white'>
                                    {activeRadio.name}
                                </h3>
                            </div>
                        </div>
                        <div className='flex items-center gap-3 self-end sm:self-auto'>
                            <button
                                type='button'
                                onClick={() => togglePlay(activeRadio)}
                                className='inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-2.5 text-sm font-black text-emerald-900 shadow-md hover:bg-emerald-50'
                            >
                                {isPlaying ? (
                                    <>
                                        <MdPause /> Jeda
                                    </>
                                ) : (
                                    <>
                                        <MdPlayArrow /> Putar
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                    {audioError && (
                        <p className='mt-2 text-xs font-semibold text-rose-200'>
                            {audioError}
                        </p>
                    )}
                </div>
            )}

            <div className='mb-6 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800'>
                <div className='grid gap-3 sm:grid-cols-[1fr_auto]'>
                    <label className='relative block'>
                        <MdSearch className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder='Cari nama radio, frekuensi, topik...'
                            className='w-full rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm text-gray-900 outline-none focus:border-emerald-400 focus:bg-white dark:border-slate-600 dark:bg-slate-900 dark:text-white'
                        />
                    </label>
                    <select
                        value={domisili}
                        onChange={(e) => handleFilterDomisili(e.target.value)}
                        className='rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-900 outline-none focus:border-emerald-400 dark:border-slate-600 dark:bg-slate-900 dark:text-white'
                    >
                        {RADIO_DOMISILI.map((item) => (
                            <option key={item} value={item}>
                                {item}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className='grid gap-4 sm:grid-cols-2'>
                {visibleRadios.map((radio) => {
                    const isCurrent = activeRadio?.id === radio.id;
                    const stream = radio.streamUrl || radio.stream_url;
                    return (
                        <div
                            key={radio.id || radio.name}
                            className={`flex flex-col justify-between rounded-3xl border p-5 transition ${
                                isCurrent && isPlaying
                                    ? "border-emerald-500 bg-emerald-50/50 shadow-md dark:border-emerald-500 dark:bg-emerald-950/20"
                                    : "border-gray-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800"
                            }`}
                        >
                            <div>
                                <div className='mb-3 flex items-start justify-between gap-3'>
                                    <div>
                                        <span className='inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'>
                                            {radio.frequency}
                                        </span>
                                        <h2 className='mt-2 text-lg font-black text-gray-950 dark:text-white'>
                                            {radio.name}
                                        </h2>
                                    </div>
                                    <span className='rounded-xl border border-gray-200 px-2.5 py-1 text-xs font-bold text-gray-600 dark:border-slate-600 dark:text-gray-300'>
                                        {radio.city}
                                    </span>
                                </div>
                                <p className='text-sm leading-relaxed text-gray-600 dark:text-gray-300'>
                                    {radio.description}
                                </p>
                                {radio.coverageArea && (
                                    <p className='mt-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300'>
                                        Jangkauan: {radio.coverageArea}
                                    </p>
                                )}
                                {radio.frequencyNotice && (
                                    <p className='mt-2 rounded-xl bg-amber-50 p-2.5 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-200'>
                                        {radio.frequencyNotice}
                                    </p>
                                )}
                            </div>

                            <div className='mt-5 flex items-center justify-between border-t border-gray-100 pt-4 dark:border-slate-700'>
                                <div className='flex flex-wrap gap-1'>
                                    {(Array.isArray(radio.tags)
                                        ? radio.tags
                                        : String(radio.tags || "")
                                              .split(",")
                                              .filter(Boolean)
                                    ).map((tag) => (
                                        <span
                                            key={tag}
                                            className='rounded-lg bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600 dark:bg-slate-700 dark:text-gray-300'
                                        >
                                            #{tag.trim()}
                                        </span>
                                    ))}
                                </div>
                                {stream && (
                                    <button
                                        type='button'
                                        onClick={() => togglePlay(radio)}
                                        className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold text-white transition ${
                                            isCurrent && isPlaying
                                                ? "bg-emerald-700 hover:bg-emerald-800"
                                                : "bg-emerald-600 hover:bg-emerald-700"
                                        }`}
                                    >
                                        {isCurrent && isPlaying ? (
                                            <>
                                                <MdPause /> Jeda
                                            </>
                                        ) : (
                                            <>
                                                <MdPlayArrow /> Streaming
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <audio
                ref={audioRef}
                onEnded={() => setIsPlaying(false)}
                className='hidden'
            />
        </ContentWidth>
    );
}
