"use client";

import GenericAdminCRUD from "@/components/panel/GenericAdminCRUD";
import { adminHadithApi } from "@/lib/api";

const HADITH_GRADES = [
    "shahih",
    "shahih_lighairihi",
    "hasan",
    "hasan_lighairihi",
    "hasan_shahih",
    "dhaif",
    "dhaif_jiddan",
    "munkar",
    "maudhu",
    "matruk",
    "majhul",
];

const HADITH_FIELDS = [
    {
        key: "number",
        label: "Nomor Hadis",
        type: "number",
        required: true,
    },
    {
        key: "book_id",
        label: "Book ID (Kitab)",
        type: "number",
        required: true,
        placeholder: "1: Bukhari, 2: Muslim, dll",
    },
    {
        key: "grade",
        label: "Derajat / Keshahihan",
        type: "select",
        options: HADITH_GRADES,
        default: "shahih",
    },
    {
        key: "shahih_by",
        label: "Takhrij Shahih Oleh",
        type: "text",
        placeholder: "Al-Albani, Syu'aib Al-Arnauth, dll",
    },
    {
        key: "dhaif_by",
        label: "Pelemahan Oleh",
        type: "text",
    },
    {
        key: "sanad",
        label: "Teks Rantai Sanad",
        type: "textarea",
        rows: 3,
    },
    {
        key: "grade_notes",
        label: "Catatan Derajat Hadis",
        type: "textarea",
        rows: 3,
    },
];

export default function AdminHadisPage() {
    return (
        <GenericAdminCRUD
            title='Hadis (Kutubut Tis-ah)'
            description='Kelola data derajat, sanad, dan referensi hadis.'
            api={adminHadithApi}
            searchableFields={["number", "grade", "shahih_by", "sanad"]}
            defaultPageSize={20}
            fields={HADITH_FIELDS}
            transformPayload={(payload) => {
                const out = { ...payload };
                if (out.number !== undefined && out.number !== "") {
                    out.number = Number(out.number);
                }
                if (out.book_id !== undefined && out.book_id !== "") {
                    out.book_id = Number(out.book_id);
                }
                return out;
            }}
        />
    );
}