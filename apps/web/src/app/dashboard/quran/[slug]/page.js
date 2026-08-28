"use client";
import { use } from "react";

import InfiniteScrollAyahPage from "@/app/quran/[...slug]/InfiniteScrollAyahPage";

const DashboardQuranReaderPage = (props) => {
    const searchParams = use(props.searchParams);
    const params = use(props.params);
    return (
        <div className='px-2 py-4'>
            <InfiniteScrollAyahPage
                params={{ slug: params.slug }}
                searchParams={searchParams}
                basePath='/dashboard/quran'
            />
        </div>
    );
};

export default DashboardQuranReaderPage;
