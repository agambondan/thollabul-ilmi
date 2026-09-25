"use client";

import { LibraryContent } from "@/app/library/LibraryPageClient";

export default function DashboardLibraryPage() {
    return (
        <div className='py-2'>
            <LibraryContent basePath='/dashboard/library' showProgressSummary />
        </div>
    );
}
