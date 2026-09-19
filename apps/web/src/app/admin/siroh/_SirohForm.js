"use client";

import { adminSirohApi, parseApiError } from "@/lib/api";
import { useLocale } from "@/context/Locale";
import { useLayoutMode } from "@/lib/useLayoutMode";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import MarkdownEditor from "@/components/MarkdownEditor";

const slugify = (str) =>
    str
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");

const SirahForm = ({ initialData = null, contentId = null }) => {
    const router = useRouter();
    const { t } = useLocale();
    const { isWide } = useLayoutMode();
    const isEdit = !!contentId;

    const [title, setTitle] = useState(initialData?.title ?? "");
    const [slug, setSlug] = useState(initialData?.slug ?? "");
    const [content, setContent] = useState(initialData?.content ?? "");
    const [source, setSource] = useState(initialData?.source ?? "");
    const [categoryId, setCategoryId] = useState(
        initialData?.category_id ? String(initialData.category_id) : "",
    );
    const [order, setOrder] = useState(String(initialData?.order ?? "0"));
    const [slugEdited, setSlugEdited] = useState(isEdit);

    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        adminSirohApi
            .listCategories()
            .then((r) => r.json())
            .then((data) => setCategories(data?.items ?? data ?? []))
            .catch((e) => console.error(e));
    }, []);

    const handleTitleChange = (val) => {
        setTitle(val);
        if (!slugEdited) setSlug(slugify(val));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!categoryId) {
            setError(t("admin.form.select_category_first"));
            return;
        }
        setError("");
        setIsLoading(true);
        const payload = {
            title,
            slug,
            content,
            source,
            category_id: Number(categoryId),
            order: Number(order) || 0,
        };
        try {
            const res = isEdit
                ? await adminSirohApi.updateContent(contentId, payload)
                : await adminSirohApi.createContent(payload);
            if (!res.ok)
                throw new Error(
                    await parseApiError(res, t("admin.error.save")),
                );
            router.push("/admin/siroh");
        } catch (err) {
            setError(err.message || t("admin.error.save"));
        } finally {
            setIsLoading(false);
        }
    };

    const inputCls =
        "w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all";

    return (
        <form
            onSubmit={handleSubmit}
            className={`w-full ${isWide ? "max-w-7xl" : "max-w-4xl"} bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6 sm:p-8 shadow-sm space-y-6`}
        >
            {error && (
                <div className='p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400'>
                    {error}
                </div>
            )}

            <div className='grid sm:grid-cols-2 gap-5'>
                <div>
                    <label
                        htmlFor='sirohform-field-1'
                        className='block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2'
                    >
                        {t("admin.field.category")}{" "}
                        <span className='text-red-500'>*</span>
                    </label>
                    <select
                        id='sirohform-field-1'
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className={inputCls}
                        required
                    >
                        <option value=''>
                            — {t("admin.form.select_category")} —
                        </option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.title}
                            </option>
                        ))}
                    </select>
                    {categories.length === 0 && (
                        <p className='text-xs text-amber-500 mt-1.5'>
                            {t("admin.sirah.create_category_first")}{" "}
                            <Link href='/admin/siroh' className='underline'>
                                {t("admin.nav.sirah")}
                            </Link>
                            .
                        </p>
                    )}
                </div>

                <div>
                    <label
                        htmlFor='sirohform-order'
                        className='block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2'
                    >
                        {t("admin.field.order")}
                    </label>
                    <input
                        id='sirohform-order'
                        type='number'
                        value={order}
                        onChange={(e) => setOrder(e.target.value)}
                        className={inputCls}
                        placeholder={t("admin.sirah.year_placeholder")}
                        min='0'
                    />
                </div>
            </div>

            <div>
                <label
                    htmlFor='sirohform-field-2'
                    className='block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2'
                >
                    {t("admin.field.title")}{" "}
                    <span className='text-red-500'>*</span>
                </label>
                <input
                    id='sirohform-field-2'
                    required
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className={inputCls}
                    placeholder={t("admin.sirah.title_placeholder")}
                />
            </div>

            <div>
                <label
                    htmlFor='sirohform-slug'
                    className='block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2'
                >
                    {t("admin.field.slug")}
                </label>
                <input
                    id='sirohform-slug'
                    value={slug}
                    onChange={(e) => {
                        setSlugEdited(true);
                        setSlug(e.target.value);
                    }}
                    className={inputCls}
                    placeholder={t("admin.sirah.slug_placeholder")}
                />
                <p className='text-xs text-gray-400 mt-1.5'>
                    /siroh/{slug || "..."}
                </p>
            </div>

            <div>
                <MarkdownEditor
                    value={content}
                    onChange={setContent}
                    label={t("admin.field.content")}
                    placeholder={t("admin.sirah.content_placeholder")}
                    minRows={14}
                />
            </div>

            <div>
                <label
                    htmlFor='sirohform-source'
                    className='block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2'
                >
                    {t("admin.field.source")}
                </label>
                <input
                    id='sirohform-source'
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className={inputCls}
                    placeholder='Sirah Ibnu Hisyam; Ar-Raheeq Al-Makhtum (Shafiyyurrahman Al-Mubarakfuri); HR. Bukhari No. ...'
                />
                <p className='text-xs text-gray-400 mt-1.5'>
                    {t("admin.sirah.source_hint")}
                </p>
            </div>

            <div className='flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-slate-700'>
                <button
                    type='submit'
                    disabled={isLoading}
                    className='px-6 py-2.5 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-60 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors'
                >
                    {isLoading
                        ? t("common.saving")
                        : isEdit
                          ? t("admin.form.save_changes")
                          : t("admin.sirah.create_content")}
                </button>
                <Link
                    href='/admin/siroh'
                    className='px-6 py-2.5 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-medium transition-colors'
                >
                    {t("common.cancel")}
                </Link>
            </div>
        </form>
    );
};

export default SirahForm;
