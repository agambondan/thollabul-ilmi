"use client";

import GenericAdminCRUD from "@/components/panel/GenericAdminCRUD";
import { adminJarhTadilApi } from "@/lib/api";

const JENIS = ["tadil", "jarh"];
const TINGKAT_OPTIONS = [
    { value: 1, label: "1 - Sangat Kuat" },
    { value: 2, label: "2 - Kuat" },
    { value: 3, label: "3 - Cukup" },
    { value: 4, label: "4 - Lemah" },
    { value: 5, label: "5 - Sangat Lemah" },
];

export default function AdminJarhTadilPage() {
    return (
        <GenericAdminCRUD
            title='Master Jarh wa Ta’dil'
            description='Kelola catatan penilaian ulama terhadap perawi.'
            api={adminJarhTadilApi}
            searchableFields={["teks_nilai", "sumber", "perawi_id"]}
            defaultPageSize={20}
            fields={[
                {
                    key: "perawi_id",
                    label: "Perawi ID",
                    type: "number",
                    required: true,
                },
                {
                    key: "penilai_id",
                    label: "Penilai (Perawi) ID",
                    type: "number",
                },
                {
                    key: "jenis_nilai",
                    label: "Jenis",
                    type: "select",
                    required: true,
                    options: JENIS,
                },
                {
                    key: "tingkat",
                    label: "Tingkat (1-5)",
                    type: "select",
                    required: true,
                    options: TINGKAT_OPTIONS,
                },
                {
                    key: "teks_nilai",
                    label: "Teks Nilai",
                    type: "text",
                    required: true,
                },
                { key: "sumber", label: "Sumber Kitab", type: "text" },
                { key: "halaman", label: "Halaman", type: "text" },
                { key: "catatan", label: "Catatan", type: "textarea", rows: 3 },
            ]}
            transformPayload={(payload) => {
                const out = { ...payload };
                for (const k of ["perawi_id", "penilai_id", "tingkat"]) {
                    if (out[k] === "" || out[k] === null) out[k] = null;
                }
                return out;
            }}
        />
    );
}
