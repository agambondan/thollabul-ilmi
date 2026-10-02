"use client";

import GenericAdminCRUD from "@/components/panel/GenericAdminCRUD";
import { adminMunasabahApi } from "@/lib/api";

export default function AdminMunasabahPage() {
    return (
        <GenericAdminCRUD
            title='Munasabah (Hubungan Ayat)'
            description='Kelola data hubungan ayat (munasabah) antar ayat Al-Quran.'
            api={adminMunasabahApi}
            searchableFields={["description", "ayah_from_id", "ayah_to_id"]}
            defaultPageSize={15}
            fields={[
                {
                    key: "ayah_from_id",
                    label: "Ayat Asal (ID)",
                    type: "number",
                    required: true,
                },
                {
                    key: "ayah_to_id",
                    label: "Ayat Tujuan (ID)",
                    type: "number",
                    required: true,
                },
                {
                    key: "description",
                    label: "Deskripsi Hubungan",
                    type: "textarea",
                    rows: 4,
                    required: true,
                    placeholder: "Jelaskan hubungan/korelasi antara ayat asal dan ayat tujuan...",
                },
            ]}
            transformPayload={(payload) => {
                const out = { ...payload };
                for (const k of ["ayah_from_id", "ayah_to_id"]) {
                    if (out[k] === "" || out[k] === null) out[k] = null;
                    else if (out[k] !== undefined) out[k] = Number(out[k]);
                }
                return out;
            }}
        />
    );
}