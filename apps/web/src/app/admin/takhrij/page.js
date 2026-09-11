"use client";

import GenericAdminCRUD from "@/components/panel/GenericAdminCRUD";
import { adminTakhrijApi } from "@/lib/api";

export default function AdminTakhrijPage() {
    return (
        <GenericAdminCRUD
            title='Master Takhrij'
            description='Kelola catatan kitab lain yang juga memuat sebuah hadis.'
            api={adminTakhrijApi}
            searchableFields={["hadith_id", "nomor_hadis_kitab", "catatan"]}
            defaultPageSize={15}
            fields={[
                {
                    key: "hadith_id",
                    label: "Hadith ID",
                    type: "number",
                    required: true,
                },
                { key: "book_id", label: "Book ID", type: "number" },
                {
                    key: "nomor_hadis_kitab",
                    label: "Nomor Hadis di Kitab",
                    type: "text",
                },
                { key: "halaman", label: "Halaman", type: "text" },
                { key: "jilid", label: "Jilid", type: "text" },
                { key: "catatan", label: "Catatan", type: "textarea", rows: 3 },
            ]}
            transformPayload={(payload) => {
                const out = { ...payload };
                for (const k of ["hadith_id", "book_id"]) {
                    if (out[k] === "" || out[k] === null) out[k] = null;
                }
                return out;
            }}
        />
    );
}
