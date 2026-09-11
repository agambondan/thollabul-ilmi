"use client";

import GenericAdminCRUD from "@/components/panel/GenericAdminCRUD";
import { adminPerawiApi } from "@/lib/api";

const STATUSES = [
    { value: "tsiqah_tsiqah", label: "Tsiqah Tsiqah" },
    { value: "tsiqah", label: "Tsiqah" },
    { value: "shaduq", label: "Shaduq" },
    { value: "la_baasa_bihi", label: "La Ba'sa Bihi" },
    { value: "maqbul", label: "Maqbul" },
    { value: "majhul", label: "Majhul" },
    { value: "layyin", label: "Layyin" },
    { value: "dhaif", label: "Dhaif" },
    { value: "matruk", label: "Matruk" },
    { value: "kadzdzab", label: "Kadzdzab" },
];
const TABAQAT = [
    { value: "sahabat", label: "Sahabat" },
    { value: "tabiin", label: "Tabi'in" },
    { value: "tabiut_tabiin", label: "Tabi'ut Tabi'in" },
    { value: "atbaut_tabiin", label: "Atba'ut Tabi'in" },
    { value: "tabaqah_5", label: "Tabaqah 5" },
    { value: "tabaqah_6", label: "Tabaqah 6" },
    { value: "tabaqah_7", label: "Tabaqah 7" },
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
                {
                    key: "nama_arab",
                    label: "Nama Arab",
                    type: "text",
                    required: true,
                },
                {
                    key: "nama_latin",
                    label: "Nama Latin",
                    type: "text",
                    required: true,
                },
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
                {
                    key: "biografis",
                    label: "Biografi",
                    type: "textarea",
                    rows: 4,
                },
            ]}
        />
    );
}
