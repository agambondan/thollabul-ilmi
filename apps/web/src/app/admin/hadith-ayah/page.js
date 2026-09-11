"use client";

import GenericAdminCRUD from "@/components/panel/GenericAdminCRUD";
import { adminHadithAyahApi } from "@/lib/api";

export default function AdminHadithAyahPage() {
    return (
        <GenericAdminCRUD
            title='Relasi Hadith ⇄ Ayat'
            description='Kelola pautan antara hadis dan ayat Al-Quran yang berkaitan.'
            api={adminHadithAyahApi}
            searchableFields={["hadith_id", "ayah_id", "catatan"]}
            defaultPageSize={15}
            fields={[
                {
                    key: "hadith_id",
                    label: "Hadith ID",
                    type: "number",
                    required: true,
                },
                {
                    key: "ayah_id",
                    label: "Ayah ID",
                    type: "number",
                    required: true,
                },
                { key: "catatan", label: "Catatan", type: "text" },
            ]}
            transformPayload={(payload) => {
                const out = { ...payload };
                for (const k of ["hadith_id", "ayah_id"]) {
                    if (out[k] === "" || out[k] === null) out[k] = null;
                }
                return out;
            }}
        />
    );
}
