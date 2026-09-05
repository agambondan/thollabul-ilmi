import { HadithContent } from "@/app/hadith/HadithContent";
import { Suspense } from "react";

export default function DashboardHadithPage() {
    return (
        <div className='py-2'>
            <Suspense fallback={<div className='py-4' />}>
                <HadithContent
                    basePath='/dashboard/hadith'
                    themeBasePath='/dashboard/hadith/theme'
                />
            </Suspense>
        </div>
    );
}
