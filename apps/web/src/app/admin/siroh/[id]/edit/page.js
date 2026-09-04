"use client";

export const dynamic = "force-dynamic";

import { Spinner3 } from "@/components/spinner/Spinner";
import { useLocale } from "@/context/Locale";
import { adminSirohApi } from "@/lib/api";
import Link from "next/link";
import { useEffect, useState, use } from "react";
import SirahForm from "../../_SirohForm";

const EditSirahPage = (props) => {
    const params = use(props.params);
    const { t } = useLocale();
    const [item, setItem] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        adminSirohApi
            .listContents()
            .then((r) => r.json())
            .then((data) => {
                const items = data?.items ?? data ?? [];
                const found = items.find(
                    (c) => String(c.id) === String(params.id),
                );
                if (found) setItem(found);
                else setError(true);
            })
            .catch(() => setError(true))
            .finally(() => setIsLoading(false));
    }, [params.id]);

    if (isLoading) return <Spinner3 />;

    if (error) {
        return (
            <div className='p-8'>
                <Link
                    href='/admin/siroh'
                    className='text-sm font-medium text-emerald-700 hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-300'
                >
                    &larr; {t("admin.sirah.back_to_list")}
                </Link>
                <p className='text-red-500 dark:text-red-400 mt-3'>
                    {t("admin.sirah.content_not_found")}
                </p>
            </div>
        );
    }

    return (
        <div className='p-8'>
            <div className='mb-6'>
                <Link
                    href='/admin/siroh'
                    className='text-sm font-medium text-emerald-700 hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-300'
                >
                    &larr; {t("admin.sirah.back_to_list")}
                </Link>
                <h1 className='text-2xl font-bold text-gray-900 dark:text-gray-100 dark:text-white mt-3'>
                    {t("admin.sirah.edit_content")}
                </h1>
            </div>
            <SirahForm initialData={item} contentId={params.id} />
        </div>
    );
};

export default EditSirahPage;
