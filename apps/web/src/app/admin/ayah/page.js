"use client";

import GenericAdminCRUD from "@/components/panel/GenericAdminCRUD";
import { adminAyahApi } from "@/lib/api";
import { useState } from "react";

const AYAH_FIELDS = [
    {
        key: "number",
        label: "Nomor Ayat",
        type: "number",
        required: true,
    },
    {
        key: "surah_id",
        label: "Surah ID",
        type: "number",
        required: true,
    },
    {
        key: "translation_id",
        label: "Translation ID",
        type: "number",
    },
    {
        key: "juz_number",
        label: "Juz",
        type: "number",
    },
    {
        key: "manzil",
        label: "Manzil",
        type: "number",
    },
    {
        key: "page",
        label: "Halaman Mushaf",
        type: "number",
    },
    {
        key: "ruku",
        label: "Ruku",
        type: "number",
    },
    {
        key: "hizb_quarter",
        label: "Hizb Quarter",
        type: "number",
    },
    {
        key: "sajda",
        label: "Sajda",
        type: "boolean",
        default: false,
    },
];

export default function AdminAyahPage() {
    const [surahNumber, setSurahNumber] = useState(1);

    return (
        <div className='p-6 space-y-6'>
            <div className='flex items-center gap-4 mb-4'>
                <label className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                    Surah:
                </label>
                <select
                    value={surahNumber}
                    onChange={(e) => setSurahNumber(Number(e.target.value))}
                    className='px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white'
                >
                    {Array.from({ length: 114 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                            {n}
                        </option>
                    ))}
                </select>
            </div>

            <GenericAdminCRUD
                title='Ayat Al-Quran'
                description={`Kelola data ayat surah ${surahNumber} (field non-konten sensitif).`}
                api={adminAyahApi}
                searchableFields={["number", "surah_id"]}
                defaultPageSize={50}
                customListParams={{ surahNumber, page: 0, size: 200 }}
                fields={AYAH_FIELDS}
                listTransformer={(res) => res?.data?.items ?? res?.items ?? res?.data ?? []}
            />
        </div>
    );
}