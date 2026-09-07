"use client";

import GenericAdminCRUD from "@/components/panel/GenericAdminCRUD";
import { adminLocationApi } from "@/lib/api";

const CATEGORY = ["kota", "masjid", "situs", "universitas"];

export default function AdminLocationPage() {
    return (
        <GenericAdminCRUD
            title='Peta Islam / Lokasi'
            description='Kelola titik lokasi sejarah Islam di peta.'
            api={adminLocationApi}
            searchableFields={["name", "category", "era", "description"]}
            defaultPageSize={15}
            fields={[
                { key: "name", label: "Nama", type: "text", required: true },
                {
                    key: "category",
                    label: "Kategori",
                    type: "select",
                    options: CATEGORY,
                },
                { key: "era", label: "Era", type: "text" },
                {
                    key: "latitude",
                    label: "Latitude",
                    type: "number",
                    required: true,
                },
                {
                    key: "longitude",
                    label: "Longitude",
                    type: "number",
                    required: true,
                },
                { key: "image_url", label: "URL Foto", type: "text" },
                {
                    key: "tokoh_ids",
                    label: "ID Tokoh (koma)",
                    type: "text",
                    hint: "Contoh: 1,5,12",
                },
                {
                    key: "description",
                    label: "Deskripsi",
                    type: "textarea",
                    rows: 4,
                },
            ]}
        />
    );
}
