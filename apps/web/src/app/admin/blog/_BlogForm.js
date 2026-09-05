"use client";
/* eslint-disable @next/next/no-img-element */

import { adminBlogApi, blogApi, parseApiError } from "@/lib/api";
import { useLocale } from "@/context/Locale";
import { renderBlogContent, calculateReadStats } from "@/lib/blogContent";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo, useRef } from "react";
import {
    BsTypeBold,
    BsTypeItalic,
    BsTypeH2,
    BsTypeH3,
    BsQuote,
    BsListUl,
    BsListOl,
    BsLink45Deg,
    BsImage,
    BsCodeSquare,
    BsEye,
    BsPencilSquare,
    BsClock,
    BsBook,
} from "react-icons/bs";

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

    const [title, setTitle] = useState(
        initialData?.title ||
            initialData?.translation?.idn ||
            initialData?.translation?.en ||
            "",
    );
    const [slug, setSlug] = useState(initialData?.slug ?? "");
    const [excerpt, setExcerpt] = useState(
        initialData?.excerpt ||
            initialData?.translation?.description_idn ||
            initialData?.translation?.description_en ||
            "",
    );
    const [content, setContent] = useState(
        initialData?.content ||
            initialData?.body ||
            initialData?.translation?.description_idn ||
            initialData?.translation?.description_en ||
            "",
    );
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
    const [activeTab, setActiveTab] = useState("editor"); // 'editor' | 'preview' | 'split'

    const textareaRef = useRef(null);

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

    // Toolbar insertion helpers
    const insertFormatting = (prefix, suffix = "", defaultText = "") => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const currentText = textarea.value;
        const selectedText = currentText.substring(start, end) || defaultText;

        const replacement = `${prefix}${selectedText}${suffix}`;
        const nextValue =
            currentText.substring(0, start) +
            replacement +
            currentText.substring(end);

        setContent(nextValue);

        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(
                start + prefix.length,
                start + prefix.length + selectedText.length,
            );
        }, 0);
    };

    const insertBlock = (prefix) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const currentText = textarea.value;
        const selectedText = currentText.substring(start, end);

        // Prepend prefix to each line if multi-line selection
        let replacement;
        if (selectedText) {
            replacement = selectedText
                .split("\n")
                .map((line) => `${prefix}${line}`)
                .join("\n");
        } else {
            replacement = `${prefix} `;
        }

        const nextValue =
            currentText.substring(0, start) +
            replacement +
            currentText.substring(end);

        setContent(nextValue);

        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(
                start + replacement.length,
                start + replacement.length,
            );
        }, 0);
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
            if (!res.ok) throw new Error(await parseApiError(res, t("admin.error.save")));
            router.push("/admin/blog");
        } catch (err) {
            setError(err.message || t("admin.error.save"));
        } finally {
            setIsLoading(false);
        }
    };

    // Live preview stats and HTML
    const previewHtml = useMemo(() => renderBlogContent(content), [content]);
    const readStats = useMemo(() => calculateReadStats(content), [content]);

    const selectedCategoryObj = useMemo(
        () => categories.find((c) => String(c.id) === String(categoryId)),
        [categories, categoryId],
    );

    const inputCls =
        "w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all";

    return (
        <div className='w-full'>
            {/* View Mode Switcher on Mobile/Desktop */}
            <div className='flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700 dark:border-slate-800'>
                <div className='flex items-center gap-2'>
                    <button
                        type='button'
                        onClick={() => setActiveTab("editor")}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                            activeTab === "editor"
                                ? "bg-emerald-700 text-white"
                                : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700"
                        }`}
                    >
                        <BsPencilSquare />
                        Editor
                    </button>
                    <button
                        type='button'
                        onClick={() => setActiveTab("preview")}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                            activeTab === "preview"
                                ? "bg-emerald-700 text-white"
                                : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700"
                        }`}
                    >
                        <BsEye />
                        Preview
                    </button>
                    <button
                        type='button'
                        onClick={() => setActiveTab("split")}
                        className={`hidden lg:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                            activeTab === "split"
                                ? "bg-emerald-700 text-white"
                                : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700"
                        }`}
                    >
                        Dual Pane
                    </button>
                </div>

                <div className='flex items-center gap-3 text-xs text-gray-500 dark:text-gray-300 dark:text-gray-400'>
                    <span className='inline-flex items-center gap-1'>
                        <BsBook /> {readStats.words.toLocaleString()} kata
                    </span>
                    <span className='inline-flex items-center gap-1'>
                        <BsClock /> ~{readStats.minutes} menit baca
                    </span>
                </div>
            </div>

            {error && (
                <div className='mb-6 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-2xl text-sm text-red-600 dark:text-red-400'>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div
                    className={`grid gap-8 items-start ${
                        activeTab === "split"
                            ? "lg:grid-cols-[1.1fr_0.9fr]"
                            : activeTab === "preview"
                              ? "grid-cols-1"
                              : "grid-cols-1 max-w-3xl"
                    }`}
                >
                    {/* LEFT COLUMN: EDITOR FORM */}
                    <div
                        className={`space-y-6 ${
                            activeTab === "preview" ? "hidden" : "block"
                        }`}
                    >
                        {/* Title */}
                        <div>
                            <label
                                htmlFor='blogform-field-1'
                                className='block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-2'
                            >
                                {t("admin.field.title")}{" "}
                                <span className='text-red-500'>*</span>
                            </label>
                            <input
                                id='blogform-field-1'
                                required
                                value={title}
                                onChange={(e) => handleTitleChange(e.target.value)}
                                className={`${inputCls} text-base font-semibold`}
                                placeholder={t("admin.blog.title_placeholder")}
                            />
                        </div>

                        {/* Slug & Summary */}
                        <div className='grid sm:grid-cols-2 gap-4'>
                            <div>
                                <label
                                    htmlFor='blogform-slug'
                                    className='block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-2'
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
                                <p className='text-[11px] text-gray-400 mt-1 truncate'>
                                    /blog/{slug || "..."}
                                </p>
                            </div>

                            <div>
                                <label
                                    htmlFor='blogform-status'
                                    className='block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-2'
                                >
                                    {t("common.status")}
                                </label>
                                <select
                                    id='blogform-status'
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className={inputCls}
                                >
                                    <option value='draft'>
                                        {t("admin.status.draft")}
                                    </option>
                                    <option value='published'>
                                        {t("admin.status.published")}
                                    </option>
                                    <option value='archived'>
                                        {t("admin.status.archived")}
                                    </option>
                                </select>
                            </div>
                        </div>

                        {/* Summary / Excerpt */}
                        <div>
                            <label
                                htmlFor='blogform-summary'
                                className='block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-2'
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

                        {/* Rich Content Editor with Toolbar */}
                        <div className='space-y-2'>
                            <label
                                htmlFor='blogform-content'
                                className='block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300'
                            >
                                {t("admin.field.content")}{" "}
                                <span className='text-red-500'>*</span>
                            </label>

                            {/* Toolbar */}
                            <div className='flex flex-wrap items-center gap-1 p-2 rounded-xl bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 dark:border-slate-700'>
                                <button
                                    type='button'
                                    onClick={() => insertFormatting("**", "**", "teks tebal")}
                                    className='p-1.5 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-slate-700 transition-colors'
                                    title='Tebal (Bold)'
                                    aria-label='Bold'
                                >
                                    <BsTypeBold className='text-sm' />
                                </button>
                                <button
                                    type='button'
                                    onClick={() => insertFormatting("*", "*", "teks miring")}
                                    className='p-1.5 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-slate-700 transition-colors'
                                    title='Miring (Italic)'
                                    aria-label='Italic'
                                >
                                    <BsTypeItalic className='text-sm' />
                                </button>
                                <div className='w-px h-4 bg-gray-300 dark:bg-slate-600 mx-1' />
                                <button
                                    type='button'
                                    onClick={() => insertBlock("## ")}
                                    className='p-1.5 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-slate-700 transition-colors'
                                    title='Judul Seksi (H2)'
                                    aria-label='H2'
                                >
                                    <BsTypeH2 className='text-sm' />
                                </button>
                                <button
                                    type='button'
                                    onClick={() => insertBlock("### ")}
                                    className='p-1.5 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-slate-700 transition-colors'
                                    title='Sub-judul (H3)'
                                    aria-label='H3'
                                >
                                    <BsTypeH3 className='text-sm' />
                                </button>
                                <div className='w-px h-4 bg-gray-300 dark:bg-slate-600 mx-1' />
                                <button
                                    type='button'
                                    onClick={() => insertBlock("> ")}
                                    className='p-1.5 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-slate-700 transition-colors'
                                    title='Kutipan (Quote)'
                                    aria-label='Quote'
                                >
                                    <BsQuote className='text-sm' />
                                </button>
                                <button
                                    type='button'
                                    onClick={() => insertBlock("- ")}
                                    className='p-1.5 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-slate-700 transition-colors'
                                    title='Daftar Poin (List)'
                                    aria-label='Unordered List'
                                >
                                    <BsListUl className='text-sm' />
                                </button>
                                <button
                                    type='button'
                                    onClick={() => insertBlock("1. ")}
                                    className='p-1.5 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-slate-700 transition-colors'
                                    title='Daftar Berurutan (Numbered List)'
                                    aria-label='Ordered List'
                                >
                                    <BsListOl className='text-sm' />
                                </button>
                                <div className='w-px h-4 bg-gray-300 dark:bg-slate-600 mx-1' />
                                <button
                                    type='button'
                                    onClick={() => insertFormatting("`", "`", "kode")}
                                    className='p-1.5 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-slate-700 transition-colors'
                                    title='Inline Code'
                                    aria-label='Inline Code'
                                >
                                    <BsCodeSquare className='text-xs' />
                                </button>
                                <button
                                    type='button'
                                    onClick={() =>
                                        insertFormatting(
                                            "```\n",
                                            "\n```",
                                            "// kode blok",
                                        )
                                    }
                                    className='px-2 py-1 text-xs font-mono rounded-lg text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-slate-700 transition-colors'
                                    title='Code Block'
                                    aria-label='Code Block'
                                >
                                    {"{ }"}
                                </button>
                                <button
                                    type='button'
                                    onClick={() =>
                                        insertFormatting(
                                            "[",
                                            "](https://)",
                                            "tautan",
                                        )
                                    }
                                    className='p-1.5 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-slate-700 transition-colors'
                                    title='Sisipkan Link'
                                    aria-label='Insert Link'
                                >
                                    <BsLink45Deg className='text-sm' />
                                </button>
                                <button
                                    type='button'
                                    onClick={() =>
                                        insertFormatting(
                                            "![",
                                            "](https://url-gambar.jpg)",
                                            "keterangan gambar",
                                        )
                                    }
                                    className='p-1.5 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-slate-700 transition-colors'
                                    title='Sisipkan Gambar'
                                    aria-label='Insert Image'
                                >
                                    <BsImage className='text-xs' />
                                </button>
                            </div>

                            <textarea
                                id='blogform-content'
                                ref={textareaRef}
                                required
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                rows={18}
                                className={`${inputCls} font-mono text-xs leading-relaxed`}
                                placeholder={t("admin.blog.content_placeholder")}
                            />
                            <p className='text-[11px] text-gray-400'>
                                Mendukung format Markdown (# Judul, **tebal**, *miring*, `kode`, &gt; kutipan) dan HTML.
                            </p>
                        </div>

                        {/* Cover Image */}
                        <div>
                            <label
                                htmlFor='blogform-cover-image-url'
                                className='block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-2'
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
                                <div className='mt-2 relative rounded-xl overflow-hidden h-40 border border-gray-200 dark:border-gray-700 dark:border-slate-700'>
                                    <img
                                        src={coverImage}
                                        alt='Cover preview'
                                        className='w-full h-full object-cover'
                                        onError={(e) => (e.target.style.display = "none")}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Category & Tags */}
                        <div>
                            <label
                                htmlFor='blogform-category'
                                className='block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-2'
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

                        {tags.length > 0 && (
                            <div>
                                <p
                                    id='blogform-tags-label'
                                    className='block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-2'
                                >
                                    {t("admin.field.tag")}
                                </p>
                                <div
                                    role='group'
                                    aria-labelledby='blogform-tags-label'
                                    className='flex flex-wrap gap-2'
                                >
                                    {tags.map((tag) => (
                                        <button
                                            key={tag.id}
                                            type='button'
                                            onClick={() => toggleTag(tag.id)}
                                            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                                                selectedTags.includes(tag.id)
                                                    ? "bg-emerald-700 border-emerald-700 text-white"
                                                    : "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:border-emerald-500"
                                            }`}
                                        >
                                            #{tag.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className='flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 dark:border-slate-800'>
                            <button
                                type='submit'
                                disabled={isLoading}
                                className='px-6 py-3 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-60 text-white rounded-xl text-sm font-semibold shadow-md shadow-emerald-700/20 transition-all'
                            >
                                {isLoading
                                    ? t("common.saving")
                                    : isEdit
                                      ? t("admin.form.save_changes")
                                      : t("admin.blog.create_article")}
                            </button>
                            <Link
                                href='/admin/blog'
                                className='px-6 py-3 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-medium transition-colors'
                            >
                                {t("common.cancel")}
                            </Link>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: LIVE PREVIEW */}
                    <div
                        className={`space-y-4 ${
                            activeTab === "editor" ? "hidden lg:block" : "block"
                        }`}
                    >
                        <div className='flex items-center justify-between'>
                            <div className='text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 dark:text-gray-300'>
                                Live Preview
                            </div>
                            <span className='px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 dark:text-emerald-300'>
                                {status.toUpperCase()}
                            </span>
                        </div>

                        <div className='bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-gray-700/80 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6 overflow-hidden'>
                            {/* Cover Preview */}
                            {coverImage && (
                                <div className='w-full h-48 sm:h-64 rounded-2xl overflow-hidden bg-gray-100 dark:bg-slate-800'>
                                    <img
                                        src={coverImage}
                                        alt='Cover'
                                        className='w-full h-full object-cover'
                                        onError={(e) => (e.target.style.display = "none")}
                                    />
                                </div>
                            )}

                            <div>
                                {selectedCategoryObj && (
                                    <span className='inline-block px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 dark:text-emerald-300 mb-3'>
                                        {selectedCategoryObj.name}
                                    </span>
                                )}

                                <h2 className='text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100 dark:text-white leading-tight mb-3'>
                                    {title || "Judul Artikel Akan Muncul Di Sini"}
                                </h2>

                                {excerpt && (
                                    <p className='text-sm text-gray-500 dark:text-gray-300 dark:text-gray-400 italic mb-4 leading-relaxed'>
                                        {excerpt}
                                    </p>
                                )}

                                <div className='flex items-center gap-3 text-xs text-gray-400 pb-4 border-b border-gray-100 dark:border-slate-800'>
                                    <span>~{readStats.minutes} menit baca</span>
                                    <span>•</span>
                                    <span>{readStats.words} kata</span>
                                </div>
                            </div>

                            {/* Rendered Markdown Body */}
                            <div
                                className='blog-content text-gray-700 dark:text-gray-200 min-h-[160px]'
                                dangerouslySetInnerHTML={{
                                    __html:
                                        previewHtml ||
                                        "<p class='text-gray-400 italic text-sm'>Konten artikel akan ditampilkan di sini saat Anda mengetik...</p>",
                                }}
                            />
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default BlogForm;
