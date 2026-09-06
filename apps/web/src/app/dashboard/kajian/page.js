"use client";

import { useLocale } from "@/context/Locale";
import KajianClient from "@/app/kajian/KajianClient";
import { useEffect, useState } from "react";

export default function DashboardKajianPage() {
    const { t } = useLocale();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const apiUrl =
            process.env.NEXT_PUBLIC_API_URL ||
            "https://api-thollabul.jangkauin.site";
        fetch(`${apiUrl}/api/v1/kajian?page=0&size=50`)
            .then((res) => res.json())
            .then((data) => {
                const list = data?.data?.items ?? data?.items ?? data ?? [];
                setItems(Array.isArray(list) ? list : []);
            })
            .catch(() => setItems([]))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className='p-4 sm:p-6 max-w-4xl mx-auto'>
            {loading ? (
                <p className='text-center text-gray-400 py-10'>
                    {t("kajian.loading") || "Memuat..."}
                </p>
            ) : (
                <KajianClient kajian={items} />
            )}
        </div>
    );
}
