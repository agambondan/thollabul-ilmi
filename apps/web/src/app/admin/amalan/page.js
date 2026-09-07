"use client";

import GenericAdminCRUD from "@/components/panel/GenericAdminCRUD";
import { adminAmalanApi } from "@/lib/api";

const CATEGORIES = ["sholat", "puasa", "dzikir", "sedekah", "lainnya"];

export default function AdminAmalanPage() {
    return (
        <GenericAdminCRUD
            title='Master Amalan'
            description='Kelola item checklist amalan harian yang tersedia untuk seluruh user.'
            api={adminAmalanApi}
            searchableFields={["name", "category", "source"]}
            fields={[
                {
                    key: "name",
                    label: "Nama",
                    type: "text",
                    required: true,
                },
                {
                    key: "category",
                    label: "Kategori",
                    type: "select",
                    required: true,
                    options: CATEGORIES,
                },
                {
                    key: "description",
                    label: "Deskripsi",
                    type: "textarea",
                    rows: 3,
                },
                {
                    key: "source",
                    label: "Sumber",
                    type: "text",
                    placeholder: "QS. Al-Baqarah: 183, dst.",
                },
                {
                    key: "is_active",
                    label: "Aktif",
                    type: "boolean",
                    default: true,
                    checkLabel: "Tampil untuk user",
                },
            ]}
        />
    );
}
