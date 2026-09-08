"use client";

import dynamic from "next/dynamic";

const TajweedTable = dynamic(() => import("@/components/table/Tajweed"), {
    loading: () => (
        <div className='h-48 rounded-xl bg-emerald-900/10 animate-pulse' />
    ),
});

export default function TajweedSection() {
    return <TajweedTable />;
}
