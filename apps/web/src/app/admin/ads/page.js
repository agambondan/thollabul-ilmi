"use client";

import GenericAdminCRUD from "@/components/panel/GenericAdminCRUD";
import { adminAdsApi } from "@/lib/api";

export default function AdminAdsPage() {
    return (
        <GenericAdminCRUD
            title="Iklan Langsung"
            description="Kelola iklan langsung (non-Google) untuk slot banner, interstitial, dan rewarded."
            api={adminAdsApi}
            searchableFields={["title", "click_url", "slot_type"]}
            defaultPageSize={20}
            formLayout="grid"
            fields={[
                { key: "title", label: "Judul", type: "text", required: true },
                { key: "click_url", label: "URL Tujuan", type: "text", required: true },
                {
                    key: "slot_type",
                    label: "Tipe Slot",
                    type: "select",
                    required: true,
                    options: [
                        { value: "banner", label: "Banner (Header/Footer)" },
                        { value: "interstitial", label: "Interstitial (Layar penuh)" },
                        { value: "rewarded", label: "Rewarded (Tonton untuk hadiah)" },
                    ],
                },
                { key: "image_url", label: "URL Gambar", type: "text", hint: "Opsional. Kosongkan jika upload file di form create." },
                { key: "priority", label: "Prioritas", type: "number", default: 0, hint: "Lebih tinggi = ditampilkan duluan." },
                {
                    key: "is_active",
                    label: "Status",
                    type: "boolean",
                    checkLabel: "Aktif (tampil di publik)",
                    default: true,
                },
                {
                    key: "start_at",
                    label: "Mulai",
                    type: "text",
                    hint: "ISO 8601, mis. 2025-12-01T00:00:00Z. Kosong = segera.",
                },
                {
                    key: "end_at",
                    label: "Berakhir",
                    type: "text",
                    hint: "ISO 8601, mis. 2025-12-31T23:59:59Z. Kosong = tidak ada batas.",
                },
            ]}
        />
    );
}
