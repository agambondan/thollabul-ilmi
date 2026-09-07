"use client";

import GenericAdminCRUD from "@/components/panel/GenericAdminCRUD";
import { adminAchievementApi } from "@/lib/api";

const CATEGORIES = [
    "streak",
    "hafalan",
    "bookmark",
    "tahfiz",
    "sedekah",
    "lainnya",
];

export default function AdminAchievementPage() {
    return (
        <GenericAdminCRUD
            title='Master Pencapaian'
            description='Kelola badge pencapaian yang bisa di-unlock oleh user.'
            api={adminAchievementApi}
            searchableFields={["name", "code", "category"]}
            fields={[
                {
                    key: "code",
                    label: "Kode",
                    type: "text",
                    required: true,
                    placeholder: "streak-7",
                },
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
                    key: "icon",
                    label: "Icon",
                    type: "text",
                    placeholder: "🏆",
                },
                {
                    key: "threshold",
                    label: "Target",
                    type: "number",
                    default: 1,
                    min: 1,
                },
                {
                    key: "description",
                    label: "Deskripsi",
                    type: "textarea",
                    rows: 3,
                },
            ]}
        />
    );
}
