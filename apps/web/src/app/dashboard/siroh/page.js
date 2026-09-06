"use client";

import SirohClient from "@/app/siroh/SirohClient";

export default function DashboardSirohPage() {
    return (
        <div className='py-2'>
            <SirohClient basePath='/dashboard/siroh' />
        </div>
    );
}
