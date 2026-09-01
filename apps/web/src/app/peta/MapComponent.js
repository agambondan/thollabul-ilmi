"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useState } from "react";
import { useLocale } from "@/context/Locale";
import InlineError from "@/components/InlineError";

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
                className='bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden'
                style={{ height: "500px" }}
            >
                <MapContainer
                    center={[24.5, 43]}
                    zoom={4}
                    scrollWheelZoom={true}
                    style={{ height: "100%", width: "100%" }}
                >
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
                                    <p className='text-xs text-gray-500 mt-1'>
                                        {loc.description}
                                    </p>
                                    <div className='flex gap-2 mt-2'>
                                        {loc.category && (
                                            <span className='inline-block rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300'>
                                                {loc.category}
                                            </span>
                                        )}
                                        {loc.era && (
                                            <span className='inline-block rounded-full bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:text-blue-300'>
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
        </div>
    );
}
