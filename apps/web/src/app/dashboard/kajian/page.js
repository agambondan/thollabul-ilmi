"use client";

import { useLocale } from "@/context/Locale";
import KajianClient from "@/app/kajian/KajianClient";
import { useEffect, useState } from "react";

export default function DashboardKajianPage() {
    const { t } = useLocale();
    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const apiUrl =
            process.env.NEXT_PUBLIC_API_URL ||
            "https://api-thollabul.jangkauin.site";
        fetch(`${apiUrl}/api/v1/kajian?page=0&size=10`)
            .then((res) => res.json())
            .then((data) => {
                const list = data?.items ?? data?.data?.items ?? (Array.isArray(data) ? data : []);
                setItems(Array.isArray(list) ? list : []);
                setTotal(data?.total ?? (Array.isArray(list) ? list.length : 0));
            })
            .catch(() => {
                setItems([]);
                setTotal(0);
            })
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className='p-4 sm:p-6 w-full'>
            {loading ? (
                <p className='text-center text-gray-400 py-10'>
                    {t("kajian.loading") || "Memuat..."}
                </p>
            ) : (
                <KajianClient kajian={items} initialTotal={total} />
            )}
        </div>
    );
}
