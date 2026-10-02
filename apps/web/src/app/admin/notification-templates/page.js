"use client";

import GenericAdminCRUD from "@/components/panel/GenericAdminCRUD";
import { adminNotificationTemplateApi } from "@/lib/api";

const CHANNELS = ["email", "push", "inbox"];

export default function AdminNotificationTemplatesPage() {
    return (
        <GenericAdminCRUD
            title='Template Notifikasi'
            description='Kelola template pesan notifikasi untuk email, push notification, dan inbox.'
            api={adminNotificationTemplateApi}
            searchableFields={["code", "title", "body", "channel"]}
            defaultPageSize={15}
            fields={[
                {
                    key: "code",
                    label: "Kode Template",
                    type: "text",
                    required: true,
                    placeholder: "Contoh: prayer_reminder, daily_hadith",
                },
                {
                    key: "title",
                    label: "Judul",
                    type: "text",
                    required: true,
                },
                {
                    key: "channel",
                    label: "Channel",
                    type: "select",
                    options: CHANNELS,
                    default: "email",
                },
                {
                    key: "body",
                    label: "Isi Pesan",
                    type: "textarea",
                    rows: 5,
                    required: true,
                    placeholder: "Tulis isi konten template notifikasi...",
                },
            ]}
        />
    );
}