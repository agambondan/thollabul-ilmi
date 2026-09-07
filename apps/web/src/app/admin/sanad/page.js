"use client";

import GenericAdminCRUD from "@/components/panel/GenericAdminCRUD";
import { adminSanadApi } from "@/lib/api";

const JENIS = ["musnad", "mursal", "munqathi", "mudhal", "muallaq"];
const STATUS = ["muttashil", "munqathi"];

export default function AdminSanadPage() {
    return (
        <GenericAdminCRUD
            title='Master Sanad'
            description='Kelola data sanad (rantai periwayatan) per hadis.'
            api={adminSanadApi}
            searchableFields={["hadith_id", "catatan"]}
            defaultPageSize={15}
            fields={[
                { key: "hadith_id", label: "Hadith ID", type: "number", required: true },
                { key: "nomor_jalur", label: "Nomor Jalur", type: "number" },
                {
                    key: "jenis",
                    label: "Jenis",
                    type: "select",
                    options: JENIS,
                },
                {
                    key: "status_sanad",
                    label: "Status",
                    type: "select",
                    options: STATUS,
                },
                { key: "catatan", label: "Catatan", type: "textarea", rows: 3 },
            ]}
            transformPayload={(payload) => {
                const out = { ...payload };
                for (const k of ["hadith_id", "nomor_jalur"]) {
                    if (out[k] === "" || out[k] === null) out[k] = null;
                }
                return out;
            }}
        />
    );
}
