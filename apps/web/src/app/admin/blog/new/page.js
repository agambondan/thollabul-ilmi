"use client";

import BlogForm from "../_BlogForm";
import { useLocale } from "@/context/Locale";
import Link from "next/link";

const NewBlogPage = () => {
    const { t } = useLocale();

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
                    {t("admin.blog.new_article")}
                </h1>
            </div>
            <BlogForm />
        </div>
    );
};

export default NewBlogPage;
