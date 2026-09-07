"use client";

import QuizContent from "@/components/QuizContent";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function QuizPageInner() {
    const searchParams = useSearchParams();
    const initialType = searchParams?.get("type") ?? "";
    return (
        <main className='min-h-screen flex flex-col'>
            <QuizContent initialType={initialType} />
        </main>
    );
}

export default function QuizPage() {
    return (
        <Suspense
            fallback={
                <main className='min-h-screen flex flex-col items-center justify-center text-gray-400'>
                    Memuat...
                </main>
            }
        >
            <QuizPageInner />
        </Suspense>
    );
}
