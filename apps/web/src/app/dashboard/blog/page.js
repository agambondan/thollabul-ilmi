"use client";

import { BlogContent } from "@/app/blog/page";

export default function DashboardBlogPage() {
    return (
        <div className='py-2'>
            <BlogContent basePath='/dashboard/blog' />
        </div>
    );
}
