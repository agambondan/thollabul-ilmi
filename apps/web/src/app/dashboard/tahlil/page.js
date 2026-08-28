"use client";

import { TahlilContent } from "@/app/tahlil/TahlilClient";

export default function DashboardTahlilPage() {
    return (
        <div className='py-2'>
            <TahlilContent quranBasePath='/dashboard/quran' />
        </div>
    );
}
