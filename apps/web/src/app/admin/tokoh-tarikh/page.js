"use client";

import GenericAdminCRUD from "@/components/panel/GenericAdminCRUD";
import { adminTokohTarikhApi } from "@/lib/api";

const KATEGORI = [
    "sahabat",
    "khalifah",
    "ulama",
    "ilmuwan",
    "pengusaha",
    "filsuf",
    "penyair",
    "panglima",
];
const ERA = [
    "Makkah",
    "Madinah",
    "Khulafaur Rasyidin",
    "Umayyah",
    "Abbasiyah",
    "Utsmaniyah",
    "Modern",
];

export default function AdminTokohTarikhPage() {
    return (
        <GenericAdminCRUD
            title='Master Tokoh Tarikh'
            description='Kelola data tokoh sejarah Islam.'
            api={adminTokohTarikhApi}
            searchableFields={["nama", "kategori", "era", "biografi"]}
            defaultPageSize={15}
            fields={[
                { key: "nama", label: "Nama", type: "text", required: true },
                { key: "era", label: "Era", type: "select", options: ERA },
                {
                    key: "kategori",
                    label: "Kategori",
                    type: "select",
                    options: KATEGORI,
                },
                { key: "tahun_lahir", label: "Tahun Lahir", type: "text" },
                { key: "tahun_wafat", label: "Tahun Wafat", type: "text" },
                { key: "image_url", label: "URL Foto", type: "text" },
                {
                    key: "biografi",
                    label: "Biografi",
                    type: "textarea",
                    rows: 4,
                    required: true,
                },
                {
                    key: "kontribusi",
                    label: "Kontribusi",
                    type: "textarea",
                    rows: 3,
                },
            ]}
        />
    );
}
