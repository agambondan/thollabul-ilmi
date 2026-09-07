"use client";

import QuizContent from "@/components/QuizContent";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function DashboardQuizInner() {
    const searchParams = useSearchParams();
    const initialType = searchParams?.get("type") ?? "";
    return (
        <div className='py-2'>
            <QuizContent initialType={initialType} />
        </div>
    );
}

export default function DashboardQuizPage() {
    return (
        <Suspense
            fallback={
                <div className='py-8 text-center text-gray-400'>Memuat...</div>
            }
        >
            <DashboardQuizInner />
        </Suspense>
    );
}
