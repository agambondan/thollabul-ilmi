"use client";

import ContentWidth from "@/components/layout/ContentWidth";
import { useLocale } from "@/context/Locale";
import dynamic from "next/dynamic";
import { MdMap } from "react-icons/md";

const MapComponent = dynamic(() => import("./MapComponent"), { ssr: false });

export function PetaContent({ className = "" }) {
    const { t } = useLocale();
    return (
        <ContentWidth compact='max-w-4xl' className={`px-4 py-6 ${className}`}>
            <div className='text-center mb-8'>
                <div className='inline-flex items-center justify-center w-16 h-16 bg-emerald-100 dark:bg-emerald-900/40 rounded-2xl mb-4'>
                    <MdMap className='text-3xl text-emerald-600 dark:text-emerald-400' />
                </div>
                <h1 className='text-2xl font-bold text-gray-900 dark:text-gray-100 dark:text-white mb-1'>
                    {t("peta.title") ?? "Peta Islam Interaktif"}
                </h1>
                <p className='text-sm text-gray-500 dark:text-gray-300 dark:text-gray-400'>
                    {t("peta.subtitle") ??
                        "Lokasi bersejarah dalam peradaban Islam"}
                </p>
            </div>
            <MapComponent />
        </ContentWidth>
    );
}

export default function PetaPage() {
    return (
        <main className='min-h-screen flex flex-col bg-parchment-50 dark:bg-slate-900'>
            <PetaContent className='pt-navbar' />
        </main>
    );
}
