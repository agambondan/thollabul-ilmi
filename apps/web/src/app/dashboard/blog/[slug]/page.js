"use client";
import { use } from "react";

import { BlogDetailContent } from "@/app/blog/[slug]/page";

export default function DashboardBlogDetailPage(props) {
    const params = use(props.params);
    return (
        <div className='py-2'>
            <BlogDetailContent params={params} basePath='/dashboard/blog' />
        </div>
    );
}
