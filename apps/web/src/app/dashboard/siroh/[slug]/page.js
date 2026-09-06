"use client";

import { use } from "react";
import SirohDetailContent from "@/components/SirohDetailContent";

export default function DashboardSirohDetailPage(props) {
    const params = use(props.params);
    return (
        <div className='p-4 md:p-6'>
            <SirohDetailContent slug={params.slug} basePath='/dashboard/siroh' />
        </div>
    );
}
