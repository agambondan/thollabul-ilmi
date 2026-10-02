"use client";

import GenericAdminCRUD from "@/components/panel/GenericAdminCRUD";
import { adminSurahAudioApi, adminAyahAudioApi } from "@/lib/api";
import { useState } from "react";
import { BsMusicNoteBeats } from "react-icons/bs";

const SURAH_FIELDS = [
    {
        key: "surah_id",
        label: "Surah ID / Nomor",
        type: "number",
        required: true,
        placeholder: "1 - 114",
    },
    {
        key: "qari_name",
        label: "Nama Qari",
        type: "text",
        required: true,
        placeholder: "Misyari Rasyid Al-Afasy",
    },
    {
        key: "qari_slug",
        label: "Slug Qari",
        type: "text",
        required: true,
        placeholder: "misyari-alafasy",
    },
    {
        key: "audio_url",
        label: "URL Audio MP3",
        type: "text",
        required: true,
        placeholder: "https://...",
    },
];

const AYAH_FIELDS = [
    {
        key: "ayah_id",
        label: "Ayat ID",
        type: "number",
        required: true,
        placeholder: "ID global ayat",
    },
    {
        key: "qari_name",
        label: "Nama Qari",
        type: "text",
        required: true,
        placeholder: "Misyari Rasyid Al-Afasy",
    },
    {
        key: "qari_slug",
        label: "Slug Qari",
        type: "text",
        required: true,
        placeholder: "misyari-alafasy",
    },
    {
        key: "audio_url",
        label: "URL Audio MP3",
        type: "text",
        required: true,
        placeholder: "https://...",
    },
];

export default function AdminAudioPage() {
    const [tab, setTab] = useState("surah");

    return (
        <div className='p-6 space-y-6'>
            <div className='flex items-center gap-2 border-b border-gray-100 dark:border-slate-800 pb-4'>
                <button
                    type='button'
                    onClick={() => setTab("surah")}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                        tab === "surah"
                            ? "bg-emerald-700 text-white"
                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800"
                    }`}
                >
                    Audio Surah
                </button>
                <button
                    type='button'
                    onClick={() => setTab("ayah")}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                        tab === "ayah"
                            ? "bg-emerald-700 text-white"
                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800"
                    }`}
                >
                    Audio Ayat
                </button>
            </div>

            {tab === "surah" ? (
                <GenericAdminCRUD
                    key='surah-audio'
                    title='Audio Murotal Surah'
                    description='Kelola file audio murotal lengkap per surah Al-Quran.'
                    api={adminSurahAudioApi}
                    searchableFields={["qari_name", "qari_slug", "surah_id"]}
                    defaultPageSize={15}
                    fields={SURAH_FIELDS}
                    transformPayload={(payload) => {
                        const out = { ...payload };
                        if (out.surah_id !== undefined && out.surah_id !== "") {
                            out.surah_id = Number(out.surah_id);
                        }
                        return out;
                    }}
                />
            ) : (
                <GenericAdminCRUD
                    key='ayah-audio'
                    title='Audio Murotal Ayat'
                    description='Kelola file audio murotal per ayat Al-Quran.'
                    api={adminAyahAudioApi}
                    searchableFields={["qari_name", "qari_slug", "ayah_id"]}
                    defaultPageSize={15}
                    fields={AYAH_FIELDS}
                    transformPayload={(payload) => {
                        const out = { ...payload };
                        if (out.ayah_id !== undefined && out.ayah_id !== "") {
                            out.ayah_id = Number(out.ayah_id);
                        }
                        return out;
                    }}
                />
            )}
        </div>
    );
}