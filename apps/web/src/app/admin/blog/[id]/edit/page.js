"use client";

export const dynamic = "force-dynamic";

import { Spinner3 } from "@/components/spinner/Spinner";
import { useLocale } from "@/context/Locale";
import { adminBlogApi } from "@/lib/api";
import Link from "next/link";
import { useEffect, useState, use } from "react";
import BlogForm from "../../_BlogForm";

const EditBlogPage = (props) => {
    const params = use(props.params);
    const { t } = useLocale();
    const [post, setPost] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        adminBlogApi
            .listAll()
            .then((r) => r.json())
            .then((data) => {
                const items = data?.items ?? data ?? [];
                const found = items.find(
                    (p) => String(p.id) === String(params.id),
                );
                if (found) setPost(found);
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
                    href='/admin/blog'
                    className='text-sm font-medium text-emerald-700 hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-300'
                >
                    &larr; {t("admin.blog.back_to_list")}
                </Link>
                <p className='text-red-500 dark:text-red-400 mt-3'>
                    {t("admin.blog.not_found")}
                </p>
            </div>
        );
    }

    return (
        <div className='p-8'>
            <div className='mb-6'>
                <Link
                    href='/admin/blog'
                    className='text-sm font-medium text-emerald-700 hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-300'
                >
                    &larr; {t("admin.blog.back_to_list")}
                </Link>
                <h1 className='text-2xl font-bold text-gray-900 dark:text-white mt-3'>
                    {t("admin.blog.edit_article")}
                </h1>
            </div>
            <BlogForm initialData={post} postId={params.id} />
        </div>
    );
};

export default EditBlogPage;
