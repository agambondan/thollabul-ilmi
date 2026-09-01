"use client";
/* eslint-disable @next/next/no-img-element */

import { adminBlogApi, blogApi } from "@/lib/api";
import { useLocale } from "@/context/Locale";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const slugify = (str) =>
    str
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");

const BlogForm = ({ initialData = null, postId = null }) => {
    const router = useRouter();
    const { t } = useLocale();
    const isEdit = !!postId;

    const [title, setTitle] = useState(initialData?.title ?? "");
    const [slug, setSlug] = useState(initialData?.slug ?? "");
    const [excerpt, setExcerpt] = useState(initialData?.excerpt ?? "");
    const [content, setContent] = useState(initialData?.content ?? "");
    const [coverImage, setCoverImage] = useState(
        initialData?.cover_image ?? "",
    );
    const [categoryId, setCategoryId] = useState(
        initialData?.category_id ?? "",
    );
    const [selectedTags, setSelectedTags] = useState(
        (initialData?.tags ?? []).map((t) => t.id ?? t),
    );
    const [status, setStatus] = useState(initialData?.status ?? "draft");

    const [categories, setCategories] = useState([]);
    const [tags, setTags] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [slugEdited, setSlugEdited] = useState(isEdit);

    useEffect(() => {
        Promise.all([
            blogApi.listCategories().then((r) => r.json()),
            blogApi.listTags().then((r) => r.json()),
        ])
            .then(([cats, tgs]) => {
                setCategories(cats?.items ?? cats ?? []);
                setTags(tgs?.items ?? tgs ?? []);
            })
            .catch((e) => console.error(e));
    }, []);

    const handleTitleChange = (val) => {
        setTitle(val);
        if (!slugEdited) setSlug(slugify(val));
    };

    const toggleTag = (id) => {
        setSelectedTags((prev) =>
            prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);
        const payload = {
            title,
            slug,
            excerpt,
            content,
            cover_image: coverImage || null,
            category_id: categoryId ? Number(categoryId) : null,
            tags: selectedTags,
            status,
        };
        try {
            const res = isEdit
                ? await adminBlogApi.update(postId, payload)
                : await adminBlogApi.create(payload);
            if (!res.ok) throw new Error(t("admin.error.save"));
            router.push("/admin/blog");
        } catch (err) {
            setError(err.message || t("admin.error.save"));
        } finally {
            setIsLoading(false);
        }
    };

    const inputCls =
        "w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500";

    return (
        <form onSubmit={handleSubmit} className='max-w-3xl space-y-5'>
            {error && (
                <div className='p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400'>
                    {error}
                </div>
            )}

            <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                    {t("admin.field.title")}{" "}
                    <span className='text-red-500'>*</span>
                </label>
                <input
                    required
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className={inputCls}
                    placeholder={t("admin.blog.title_placeholder")}
                />
            </div>

            <div>
                <label
                    htmlFor='blogform-slug'
                    className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
                >
                    {t("admin.field.slug")}
                </label>
                <input
                    id='blogform-slug'
                    value={slug}
                    onChange={(e) => {
                        setSlugEdited(true);
                        setSlug(e.target.value);
                    }}
                    className={inputCls}
                    placeholder={t("admin.blog.slug_placeholder")}
                />
                <p className='text-xs text-gray-400 mt-1'>
                    /blog/{slug || "..."}
                </p>
            </div>

            <div>
                <label
                    htmlFor='blogform-summary'
                    className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
                >
                    {t("admin.field.summary")}
                </label>
                <textarea
                    id='blogform-summary'
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    rows={2}
                    className={inputCls}
                    placeholder={t("admin.blog.summary_placeholder")}
                />
            </div>

            <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                    {t("admin.field.content")}{" "}
                    <span className='text-red-500'>*</span>
                </label>
                <textarea
                    required
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={16}
                    className={`${inputCls} font-mono leading-relaxed`}
                    placeholder={t("admin.blog.content_placeholder")}
                />
                <p className='text-xs text-gray-400 mt-1'>
                    {t("admin.form.paragraph_hint")}
                </p>
            </div>

            <div>
                <label
                    htmlFor='blogform-cover-image-url'
                    className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
                >
                    {t("admin.field.cover_image_url")}
                </label>
                <input
                    id='blogform-cover-image-url'
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    className={inputCls}
                    placeholder={t("admin.blog.cover_image_placeholder")}
                />
                {coverImage && (
                    <img
                        src={coverImage}
                        alt='preview'
                        className='mt-2 h-32 w-full object-cover rounded-lg'
                        onError={(e) => (e.target.style.display = "none")}
                    />
                )}
            </div>

            <div className='grid sm:grid-cols-2 gap-4'>
                <div>
                    <label
                        htmlFor='blogform-category'
                        className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
                    >
                        {t("admin.field.category")}
                    </label>
                    <select
                        id='blogform-category'
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className={inputCls}
                    >
                        <option value=''>
                            — {t("admin.form.select_category")} —
                        </option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label
                        htmlFor='blogform-status'
                        className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
                    >
                        {t("common.status")}
                    </label>
                    <select
                        id='blogform-status'
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className={inputCls}
                    >
                        <option value='draft'>{t("admin.status.draft")}</option>
                        <option value='published'>
                            {t("admin.status.published")}
                        </option>
                        <option value='archived'>
                            {t("admin.status.archived")}
                        </option>
                    </select>
                </div>
            </div>

            {tags.length > 0 && (
                <div>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                        {t("admin.field.tag")}
                    </label>
                    <div className='flex flex-wrap gap-2'>
                        {tags.map((tag) => (
                            <button
                                key={tag.id}
                                type='button'
                                onClick={() => toggleTag(tag.id)}
                                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                                    selectedTags.includes(tag.id)
                                        ? "bg-emerald-700 border-emerald-700 text-white"
                                        : "bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-600 dark:text-gray-300 hover:border-emerald-500"
                                }`}
                            >
                                #{tag.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className='flex gap-3 pt-2'>
                <button
                    type='submit'
                    disabled={isLoading}
                    className='px-6 py-2.5 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors'
                >
                    {isLoading
                        ? t("common.saving")
                        : isEdit
                          ? t("admin.form.save_changes")
                          : t("admin.blog.create_article")}
                </button>
                <Link
                    href='/admin/blog'
                    className='px-6 py-2.5 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-medium transition-colors'
                >
                    {t("common.cancel")}
                </Link>
            </div>
        </form>
    );
};

export default BlogForm;
