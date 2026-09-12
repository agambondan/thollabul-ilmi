"use client";

import GenericAdminCRUD from "@/components/panel/GenericAdminCRUD";
import { adminMasjidApi } from "@/lib/api";

export default function AdminMasjidPage() {
    return (
        <GenericAdminCRUD
            title='Masjid'
            description='Kelola direktori masjid yang tampil di /masjid.'
            api={adminMasjidApi}
            searchableFields={["name", "city", "district", "province"]}
            defaultPageSize={15}
            formLayout='grid'
            fields={[
                { key: "name", label: "Nama", type: "text", required: true },
                {
                    key: "address",
                    label: "Alamat",
                    type: "text",
                    required: true,
                },
                { key: "city", label: "Kota", type: "text", required: true },
                { key: "district", label: "Kecamatan", type: "text" },
                {
                    key: "province",
                    label: "Provinsi",
                    type: "text",
                    filterable: true,
                },
                {
                    key: "latitude",
                    label: "Latitude",
                    type: "number",
                    required: true,
                    hint: "Wajib diisi agar muncul di pencarian “masjid terdekat”.",
                },
                {
                    key: "longitude",
                    label: "Longitude",
                    type: "number",
                    required: true,
                },
                { key: "phone", label: "Telepon", type: "text" },
                { key: "capacity", label: "Kapasitas Jamaah", type: "number" },
                {
                    key: "facilities",
                    label: "Fasilitas",
                    type: "text",
                    hint: "Pisahkan dengan koma, mis. Parkir, Wudhu, Perpustakaan.",
                },
                { key: "image_url", label: "URL Foto", type: "text" },
                { key: "website", label: "Website", type: "text" },
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
