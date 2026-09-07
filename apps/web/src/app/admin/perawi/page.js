"use client";

import GenericAdminCRUD from "@/components/panel/GenericAdminCRUD";
import { adminPerawiApi } from "@/lib/api";

const STATUSES = [
    "tsiqah",
    "tsiqah_jiddan",
    "shaduq",
    "shaikh",
    "dhaif",
    "matruk",
    "kadzdzab",
];
const TABAQAT = [
    "sahabat",
    "tabiin",
    "tabiut_tabiin",
    "tabiut_tabiin_ala_tabiin",
    "salaf",
    "khalaf",
];

export default function AdminPerawiPage() {
    return (
        <GenericAdminCRUD
            title='Master Perawi'
            description='Kelola data perawi (rawi) untuk sanad dan jarh wa ta’dil.'
            api={adminPerawiApi}
            searchableFields={["nama_latin", "nama_arab", "kunyah", "nisbah"]}
            defaultPageSize={15}
            fields={[
                { key: "nama_arab", label: "Nama Arab", type: "text", required: true },
                { key: "nama_latin", label: "Nama Latin", type: "text", required: true },
                { key: "nama_lengkap", label: "Nama Lengkap", type: "text" },
                { key: "kunyah", label: "Kunyah", type: "text" },
                { key: "laqab", label: "Laqab", type: "text" },
                { key: "nisbah", label: "Nisbah", type: "text" },
                {
                    key: "tabaqah",
                    label: "Tabaqah",
                    type: "select",
                    options: TABAQAT,
                },
                {
                    key: "status",
                    label: "Status",
                    type: "select",
                    options: STATUSES,
                },
                { key: "tahun_lahir", label: "Tahun Lahir", type: "number" },
                { key: "tahun_wafat", label: "Tahun Wafat", type: "number" },
                {
                    key: "tahun_hijri",
                    label: "Tahun Hijriah",
                    type: "boolean",
                    default: true,
                },
                { key: "tempat_lahir", label: "Tempat Lahir", type: "text" },
                { key: "tempat_wafat", label: "Tempat Wafat", type: "text" },
                { key: "biografis", label: "Biografi", type: "textarea", rows: 4 },
            ]}
        />
    );
}
