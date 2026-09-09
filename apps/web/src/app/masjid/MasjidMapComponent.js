"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

export default function MasjidMapComponent({ masjids = [], onSelect }) {
    const defaultCenter = [-6.2088, 106.8456];

    return (
        <div className="h-[480px] w-full overflow-hidden rounded-3xl border border-gray-100 shadow-sm dark:border-slate-700">
            <MapContainer
                center={defaultCenter}
                zoom={11}
                scrollWheelZoom={false}
                style={{ height: "100%", width: "100%" }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {masjids.map((m) => {
                    const lat = m.latitude ?? m.lat;
                    const lng = m.longitude ?? m.lng;
                    if (!lat || !lng) return null;
                    return (
                        <Marker key={m.id || m.name} position={[lat, lng]}>
                            <Popup>
                                <div className="p-1 text-slate-900">
                                    <h4 className="font-bold text-sm text-emerald-800">{m.name}</h4>
                                    <p className="text-xs text-slate-600 mt-0.5">{m.district} · {m.city}</p>
                                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{m.address}</p>
                                    {onSelect && (
                                        <button
                                            type="button"
                                            onClick={() => onSelect(m)}
                                            className="mt-2 text-xs font-bold text-emerald-600 underline"
                                        >
                                            Lihat detail
                                        </button>
                                    )}
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
}
