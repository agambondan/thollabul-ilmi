"use client";

import { KhatamContent } from "@/app/khatam/page";

export default function DashboardKhatamPage() {
    return (
        <div className='py-2'>
            <KhatamContent basePath='/dashboard/quran' />
        </div>
    );
}
