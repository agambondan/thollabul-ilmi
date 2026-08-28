"use client";

import { AsbabunNuzulContent } from "@/app/asbabun-nuzul/page";

export default function DashboardAsbabunNuzulPage() {
    return (
        <div className='py-2'>
            <AsbabunNuzulContent quranBasePath='/dashboard/quran' />
        </div>
    );
}
