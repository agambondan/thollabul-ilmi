"use client";

import { ZakatContent } from "@/app/zakat/page";

export default function DashboardZakatPage() {
    return (
        <div className='py-2'>
            <ZakatContent basePath='/dashboard/zakat' />
        </div>
    );
}
