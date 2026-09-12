"use client";

import GenericAdminCRUD from "@/components/panel/GenericAdminCRUD";
import { adminRadioIslamicApi } from "@/lib/api";

export default function AdminRadioIslamicPage() {
    return (
        <GenericAdminCRUD
            title='Radio Islam'
            description='Kelola direktori radio dakwah/tilawah yang tampil di /radio-islamic.'
            api={adminRadioIslamicApi}
            searchableFields={["name", "frequency", "city", "province", "tags"]}
            defaultPageSize={15}
            formLayout='grid'
            fields={[
                { key: "name", label: "Nama", type: "text", required: true },
                {
                    key: "frequency",
                    label: "Frekuensi",
                    type: "text",
                    required: true,
                    hint: "Mis. 106.0 FM, atau “Digital Stream” untuk radio online.",
                },
                { key: "city", label: "Kota", type: "text", required: true },
                {
                    key: "province",
                    label: "Provinsi",
                    type: "text",
                    filterable: true,
                },
                {
                    key: "stream_url",
                    label: "URL Streaming",
                    type: "text",
                    hint: "Kosongkan kalau belum ada siaran online.",
                },
                { key: "logo_url", label: "URL Logo", type: "text" },
                { key: "website", label: "Website", type: "text" },
                {
                    key: "tags",
                    label: "Tag",
                    type: "text",
                    hint: "Pisahkan dengan koma, mis. Kajian, Murottal, Nasional.",
                },
                {
                    key: "is_active",
                    label: "Status",
                    type: "boolean",
                    checkLabel: "Aktif (tampil di publik)",
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
