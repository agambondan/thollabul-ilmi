"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useState } from "react";
import { useLocale } from "@/context/Locale";
import InlineError from "@/components/InlineError";
import { BsGeoAltFill } from "react-icons/bs";

function MapCenterController({ center, zoom }) {
    const map = useMap();
    useEffect(() => {
        if (center && Number.isFinite(center[0]) && Number.isFinite(center[1])) {
            map.flyTo(center, zoom || 12, { duration: 1.2 });
        }
    }, [center, zoom, map]);
    return null;
}

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

const CATEGORIES = [
    { value: "", labelKey: "peta.cat.all" },
    { value: "kota", labelKey: "peta.cat.city" },
    { value: "masjid", labelKey: "peta.cat.mosque" },
    { value: "situs", labelKey: "peta.cat.site" },
    { value: "universitas", labelKey: "peta.cat.university" },
];

// Dynasty names stay untranslated: they are proper nouns in both languages.
const ERAS = [
    { value: "", labelKey: "peta.era.all" },
    { value: "pra-islam", labelKey: "peta.era.pre_islam" },
    { value: "khulafa", labelKey: "peta.era.khulafa" },
    { value: "umayyah", label: "Umayyah" },
    { value: "abbasiyah", label: "Abbasiyah" },
    { value: "fatimiyah", label: "Fatimiyah" },
    { value: "andallus", labelKey: "peta.era.andalusia" },
    { value: "utsmaniyah", label: "Utsmaniyah" },
    { value: "klasik", labelKey: "peta.era.classical" },
];

const hasValidCoordinate = (loc) =>
    Number.isFinite(Number(loc?.latitude)) &&
    Number.isFinite(Number(loc?.longitude));

export default function MapComponent() {
    const { t } = useLocale();
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("");
    const [era, setEra] = useState("");
    const [selectedCenter, setSelectedCenter] = useState(null);

    useEffect(() => {
        const params = new URLSearchParams();
        if (search) params.set("q", search);
        if (category) params.set("category", category);
        if (era) params.set("era", era);
        params.set("size", "100");

        setLoading(true);
        fetch(`${API_URL}/api/v1/locations?${params}`)
            .then((r) => r.json())
            .then((d) => {
                setLocations(d?.items ?? []);
                setLoadError(false);
            })
            .catch(() => setLoadError(true))
            .finally(() => setLoading(false));
    }, [search, category, era]);

    const visibleLocations = locations.filter(hasValidCoordinate);

    return (
        <div className='flex flex-col gap-4'>
            <div className='flex flex-wrap items-center gap-3'>
                <input
                    type='text'
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t("peta.search_placeholder")}
                    className='flex-1 min-w-[200px] rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500'
                />
                <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className='rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500'
                >
                    {CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>
                            {c.labelKey ? t(c.labelKey) : c.label}
                        </option>
                    ))}
                </select>
                <select
                    value={era}
                    onChange={(e) => setEra(e.target.value)}
                    className='rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500'
                >
                    {ERAS.map((e) => (
                        <option key={e.value} value={e.value}>
                            {e.labelKey ? t(e.labelKey) : e.label}
                        </option>
                    ))}
                </select>
                {loading && (
                    <span className='text-xs text-gray-400'>
                        {t("peta.loading")}
                    </span>
                )}
                {!loading && !loadError && (
                    <span className='text-xs text-gray-400'>
                        {t("peta.count", { count: locations.length })}
                    </span>
                )}
            </div>

            {loadError && !loading ? <InlineError /> : null}

            <div
                className='isolate bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden'
                style={{ height: "500px" }}
            >
                <MapContainer
                    center={[24.5, 43]}
                    zoom={4}
                    scrollWheelZoom={true}
                    style={{ height: "100%", width: "100%" }}
                >
                    <MapCenterController center={selectedCenter} zoom={13} />
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
                    />
                    {visibleLocations.map((loc) => (
                        <Marker
                            key={loc.id || loc.name}
                            position={[
                                Number(loc.latitude),
                                Number(loc.longitude),
                            ]}
                        >
                            <Popup>
                                <div className='min-w-[200px]'>
                                    <strong className='text-sm'>
                                        {loc.name}
                                    </strong>
                                    <p className='text-xs text-gray-500 dark:text-gray-300 mt-1'>
                                        {loc.description}
                                    </p>
                                    <div className='flex gap-2 mt-2'>
                                        {loc.category && (
                                            <span className='inline-block rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400'>
                                                {loc.category}
                                            </span>
                                        )}
                                        {loc.era && (
                                            <span className='inline-block rounded-full bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:text-blue-400'>
                                                {loc.era}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>

            {/* Interactive Location Navigator Cards */}
            {visibleLocations.length > 0 && (
                <div className='mt-2'>
                    <h3 className='text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3'>
                        Jelajahi Titik Lokasi Sirah & Sejarah ({visibleLocations.length} Tempat)
                    </h3>
                    <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[360px] overflow-y-auto pr-1'>
                        {visibleLocations.map((loc) => (
                            <button
                                key={loc.id || loc.name}
                                onClick={() =>
                                    setSelectedCenter([
                                        Number(loc.latitude),
                                        Number(loc.longitude),
                                    ])
                                }
                                className='flex flex-col items-start p-3 rounded-xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 text-left hover:border-emerald-500 hover:shadow-xs transition group'
                            >
                                <div className='flex items-center justify-between w-full mb-1'>
                                    <span className='text-xs font-bold text-gray-800 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 flex items-center gap-1'>
                                        <BsGeoAltFill className='text-emerald-600 text-[11px] shrink-0' />
                                        {loc.name}
                                    </span>
                                    {loc.era && (
                                        <span className='text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-1.5 py-0.5 rounded'>
                                            {loc.era}
                                        </span>
                                    )}
                                </div>
                                {loc.description && (
                                    <p className='text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed'>
                                        {loc.description}
                                    </p>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
