"use client";

import ContentWidth from "@/components/layout/ContentWidth";
import ModalShell from "@/components/ModalShell";
import {
    JAKARTA_DOMISILI,
    JAKARTA_MASJIDS,
    calculateDistanceKm,
    getNearbyMasjids,
} from "@/lib/masjidRadioData";
import { masjidApi } from "@/lib/api";
import { pickItems } from "@/lib/personalSync";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import {
    MdGridView,
    MdLocationOn,
    MdMap,
    MdMosque,
    MdMyLocation,
    MdSearch,
} from "react-icons/md";

const MasjidMapComponent = dynamic(() => import("./MasjidMapComponent"), {
    ssr: false,
    loading: () => (
        <div className='h-[480px] w-full animate-pulse rounded-3xl bg-gray-100 dark:bg-slate-800' />
    ),
});

const normalize = (value) => String(value || "").toLowerCase();

const formatDistance = (value) =>
    typeof value === "number" ? `${value.toFixed(value < 10 ? 1 : 0)} km` : "—";

export function MasjidClientContent({ initialMasjids = [], initialTotal = 0 }) {
    const [viewMode, setViewMode] = useState("grid");
    const [query, setQuery] = useState("");
    const [domisili, setDomisili] = useState("Semua Jakarta");
    const [masjids, setMasjids] = useState(
        initialMasjids.length ? initialMasjids : JAKARTA_MASJIDS,
    );
    const [nearby, setNearby] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [selected, setSelected] = useState(null);
    const total = initialTotal || masjids.length;

    const visibleMasjids = useMemo(() => {
        const q = normalize(query);
        return masjids.filter((m) => {
            const matchQuery =
                !q ||
                normalize(m.name).includes(q) ||
                normalize(m.address).includes(q) ||
                normalize(m.district).includes(q) ||
                normalize(m.city).includes(q);
            const matchDomisili =
                domisili === "Semua Jakarta" ||
                (domisili === "Bodetabek"
                    ? !normalize(m.province).includes("dki")
                    : m.city === domisili);
            return matchQuery && matchDomisili;
        });
    }, [domisili, masjids, query]);

    const refreshByDomisili = async (nextDomisili) => {
        setDomisili(nextDomisili);
        setNearby(false);
        setError("");
        try {
            const city =
                nextDomisili === "Semua Jakarta" || nextDomisili === "Bodetabek"
                    ? ""
                    : nextDomisili;
            const payload = await masjidApi.list({ city, size: 100 });
            setMasjids(pickItems(payload));
        } catch {
            setMasjids(JAKARTA_MASJIDS);
        }
    };

    const handleNearby = () => {
        if (!navigator.geolocation) {
            setError("Browser belum mendukung deteksi lokasi.");
            return;
        }
        setLoading(true);
        setError("");
        navigator.geolocation.getCurrentPosition(
            async ({ coords }) => {
                try {
                    const payload = await masjidApi.nearby({
                        lat: coords.latitude,
                        lng: coords.longitude,
                        radius: 25,
                        limit: 50,
                    });
                    const items = pickItems(payload);
                    setMasjids(
                        items.length
                            ? items
                            : getNearbyMasjids(
                                  coords.latitude,
                                  coords.longitude,
                              ),
                    );
                    setNearby(true);
                    setDomisili("Semua Jakarta");
                } catch {
                    setMasjids(
                        getNearbyMasjids(coords.latitude, coords.longitude),
                    );
                    setNearby(true);
                } finally {
                    setLoading(false);
                }
            },
            () => {
                setLoading(false);
                setError("Izin lokasi ditolak. Pilih domisili manual.");
            },
            { enableHighAccuracy: true, timeout: 8000 },
        );
    };

    return (
        <ContentWidth compact='max-w-5xl' className='px-4 pb-10'>
            <div className='mb-6 text-center'>
                <div className='inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'>
                    <MdMosque className='text-4xl' />
                </div>
                <h1 className='mt-4 text-2xl font-extrabold text-emerald-950 dark:text-emerald-50 sm:text-3xl'>
                    Daftar Masjid Jakarta
                </h1>
                <p className='mx-auto mt-2 max-w-2xl text-sm text-gray-600 dark:text-gray-300'>
                    Cari masjid sesuai domisili, lihat fasilitas, lalu urutkan
                    dari lokasi Anda.
                </p>
            </div>

            <div className='mb-5 rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800'>
                <div className='grid gap-3 sm:grid-cols-[1fr_auto_auto]'>
                    <label className='relative block'>
                        <MdSearch className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder='Cari nama, kecamatan, alamat...'
                            className='w-full rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm text-gray-900 outline-none focus:border-emerald-400 focus:bg-white dark:border-slate-600 dark:bg-slate-900 dark:text-white'
                        />
                    </label>
                    <select
                        value={domisili}
                        onChange={(e) => refreshByDomisili(e.target.value)}
                        className='rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-900 outline-none focus:border-emerald-400 dark:border-slate-600 dark:bg-slate-900 dark:text-white'
                    >
                        {JAKARTA_DOMISILI.map((item) => (
                            <option key={item} value={item}>
                                {item}
                            </option>
                        ))}
                    </select>
                    <button
                        type='button'
                        onClick={handleNearby}
                        disabled={loading}
                        className='inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60'
                    >
                        <MdMyLocation />
                        {loading ? "Mencari..." : "Masjid Terdekat"}
                    </button>
                </div>
                <div className='mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-3 dark:border-slate-700/60'>
                    <div className='flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400'>
                        <span>{visibleMasjids.length} tampil</span>
                        <span>•</span>
                        <span>{total} data</span>
                        {nearby && (
                            <>
                                <span>•</span>
                                <span>Diurutkan berdasarkan jarak</span>
                            </>
                        )}
                    </div>
                    <div className='inline-flex rounded-xl bg-gray-100 p-1 dark:bg-slate-700'>
                        <button
                            type='button'
                            onClick={() => setViewMode("grid")}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                                viewMode === "grid"
                                    ? "bg-white text-emerald-800 shadow-sm dark:bg-slate-900 dark:text-emerald-300"
                                    : "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                            }`}
                        >
                            <MdGridView /> Daftar
                        </button>
                        <button
                            type='button'
                            onClick={() => setViewMode("map")}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                                viewMode === "map"
                                    ? "bg-white text-emerald-800 shadow-sm dark:bg-slate-900 dark:text-emerald-300"
                                    : "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                            }`}
                        >
                            <MdMap /> Peta
                        </button>
                    </div>
                </div>
                {error && (
                    <p className='mt-3 text-sm font-medium text-red-600 dark:text-red-400'>
                        {error}
                    </p>
                )}
            </div>

            {viewMode === "map" ? (
                <MasjidMapComponent
                    masjids={visibleMasjids}
                    onSelect={(m) => setSelected(m)}
                />
            ) : (
                <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                    {visibleMasjids.map((masjid) => {
                        const distance = masjid.distance_km ?? masjid.distance;
                        return (
                            <button
                                type='button'
                                key={masjid.id || masjid.name}
                                onClick={() => setSelected(masjid)}
                                className='group rounded-3xl border border-gray-100 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-800'
                            >
                                <div className='mb-3 flex items-start justify-between gap-3'>
                                    <div>
                                        <h2 className='text-lg font-extrabold text-gray-950 group-hover:text-emerald-700 dark:text-white dark:group-hover:text-emerald-300'>
                                            {masjid.name}
                                        </h2>
                                        <p className='mt-1 text-sm font-semibold text-emerald-700 dark:text-emerald-300'>
                                            {masjid.district} · {masjid.city}
                                        </p>
                                    </div>
                                    {distance != null && (
                                        <span className='rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'>
                                            {formatDistance(distance)}
                                        </span>
                                    )}
                                </div>
                                <p className='line-clamp-2 text-sm text-gray-600 dark:text-gray-300'>
                                    {masjid.description || masjid.address}
                                </p>
                                <div className='mt-4 flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400'>
                                    <MdLocationOn className='shrink-0' />
                                    <span className='line-clamp-1'>
                                        {masjid.address}
                                    </span>
                                </div>
                                <div className='hidden'>
                                    {masjid.capacity > 0 && (
                                        <span>
                                            {masjid.capacity.toLocaleString(
                                                "id-ID",
                                            )}{" "}
                                            jamaah
                                        </span>
                                    )}
                                    {masjid.phone && (
                                        <span>{masjid.phone}</span>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

            {!visibleMasjids.length && (
                <div className='rounded-3xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300'>
                    Masjid tidak ditemukan.
                </div>
            )}

            <ModalShell
                isOpen={Boolean(selected)}
                onClose={() => setSelected(null)}
                label={selected?.name || "Detail masjid"}
                overlayClassName='fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4'
                panelClassName='max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl dark:bg-slate-900 sm:rounded-3xl'
            >
                {selected && (
                    <div>
                        <div className='mx-auto mb-4 h-1.5 w-12 rounded-full bg-gray-200 dark:bg-slate-700 sm:hidden' />
                        <div className='mb-4 flex items-start justify-between gap-4'>
                            <div>
                                <h2 className='text-2xl font-black text-emerald-950 dark:text-emerald-50'>
                                    {selected.name}
                                </h2>
                                <p className='mt-1 text-sm font-bold text-emerald-700 dark:text-emerald-300'>
                                    {selected.district} · {selected.city}
                                </p>
                            </div>
                            <button
                                type='button'
                                onClick={() => setSelected(null)}
                                className='rounded-full bg-gray-100 px-3 py-1.5 text-sm font-bold text-gray-600 hover:bg-gray-200 dark:bg-slate-800 dark:text-gray-200'
                            >
                                Tutup
                            </button>
                        </div>
                        <p className='text-sm leading-7 text-gray-700 dark:text-gray-300'>
                            {selected.description}
                        </p>
                        <div className='mt-5 grid gap-3 rounded-2xl bg-emerald-50 p-4 text-sm dark:bg-emerald-950/30'>
                            <div>
                                <span className='font-bold text-emerald-900 dark:text-emerald-100'>
                                    Alamat:{" "}
                                </span>
                                <span className='text-gray-700 dark:text-gray-300'>
                                    {selected.address}
                                </span>
                            </div>
                            {selected.capacity > 0 && (
                                <div>
                                    <span className='font-bold text-emerald-900 dark:text-emerald-100'>
                                        Kapasitas:{" "}
                                    </span>
                                    <span className='text-gray-700 dark:text-gray-300'>
                                        {selected.capacity.toLocaleString(
                                            "id-ID",
                                        )}{" "}
                                        jamaah
                                    </span>
                                </div>
                            )}
                            {selected.phone && (
                                <div>
                                    <span className='font-bold text-emerald-900 dark:text-emerald-100'>
                                        Telepon:{" "}
                                    </span>
                                    <span className='text-gray-700 dark:text-gray-300'>
                                        {selected.phone}
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className='mt-5 flex flex-wrap gap-2'>
                            {(Array.isArray(selected.facilities)
                                ? selected.facilities
                                : String(selected.facilities || "")
                                      .split(",")
                                      .filter(Boolean)
                            ).map((facility) => (
                                <span
                                    key={facility}
                                    className='rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700 dark:bg-slate-800 dark:text-gray-200'
                                >
                                    {facility.trim()}
                                </span>
                            ))}
                        </div>
                        <div className='mt-6 flex flex-col gap-2 sm:flex-row'>
                            <a
                                href={`https://www.google.com/maps/search/?api=1&query=${selected.latitude ?? selected.lat},${selected.longitude ?? selected.lng}`}
                                target='_blank'
                                rel='noreferrer'
                                className='rounded-2xl bg-emerald-600 px-4 py-3 text-center text-sm font-bold text-white hover:bg-emerald-700'
                            >
                                Buka Maps
                            </a>
                            {selected.website && (
                                <a
                                    href={selected.website}
                                    target='_blank'
                                    rel='noreferrer'
                                    className='rounded-2xl border border-emerald-200 px-4 py-3 text-center text-sm font-bold text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950/40'
                                >
                                    Website
                                </a>
                            )}
                        </div>
                    </div>
                )}
            </ModalShell>
        </ContentWidth>
    );
}
