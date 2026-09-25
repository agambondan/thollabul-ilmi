"use client";

import { LibraryDetailContent } from "@/app/library/[slug]/LibraryDetailPageClient";
import { use } from "react";

export default function DashboardLibraryDetailPage({ params }) {
    const resolvedParams = use(params);
    return (
        <div className='py-2'>
            <LibraryDetailContent
                params={resolvedParams}
                basePath='/dashboard/library'
            />
        </div>
    );
}
