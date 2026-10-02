"use client";

import GenericAdminCRUD from "@/components/panel/GenericAdminCRUD";
import { adminSurahApi } from "@/lib/api";

export default function AdminSurahPage() {
    return (
        <GenericAdminCRUD
            title='Surah Al-Quran'
            description='Kelola data surah Al-Quran (hanya field non-konten sensitif).'
            api={adminSurahApi}
            searchableFields={["number", "slug", "identifier"]}
            defaultPageSize={20}
            fields={[
                {
                    key: "number",
                    label: "Nomor Surah",
                    type: "number",
                    required: true,
                    placeholder: "1 - 114",
                },
                {
                    key: "slug",
                    label: "Slug",
                    type: "text",
                    required: true,
                    placeholder: "al-fatihah",
                },
                {
                    key: "identifier",
                    label: "Identifier",
                    type: "text",
                    placeholder: "al-fatihah_1",
                },
                {
                    key: "number_of_ayahs",
                    label: "Jumlah Ayat",
                    type: "number",
                    placeholder: "7",
                },
                {
                    key: "revelation_type",
                    label: "Jenis Turun",
                    type: "select",
                    options: ["Makkiyah", "Madaniyah"],
                    default: "Makkiyah",
                },
                {
                    key: "default_language",
                    label: "Bahasa Default",
                    type: "select",
                    options: ["Ar", "Id"],
                    default: "Ar",
                },
            ]}
        />
    );
}