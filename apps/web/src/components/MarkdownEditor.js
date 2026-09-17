"use client";

import { useRef, useState, useMemo } from "react";
import { renderBlogContent, calculateReadStats } from "@/lib/blogContent";
import {
    BsTypeBold,
    BsTypeItalic,
    BsTypeH2,
    BsTypeH3,
    BsQuote,
    BsListUl,
    BsListOl,
    BsCodeSquare,
    BsLink45Deg,
    BsImage,
    BsPencilSquare,
    BsEye,
} from "react-icons/bs";

const MarkdownEditor = ({
    value = "",
    onChange,
    placeholder = "Tulis konten di sini...",
    required = false,
    showPreview = true,
    previewClassName = "",
    textareaClassName = "",
    toolbarClassName = "",
    readOnly = false,
    label = "Konten",
    minRows = 18,
}) => {
    const textareaRef = useRef(null);
    const [activeTab, setActiveTab] = useState("editor");

    const previewHtml = useMemo(() => renderBlogContent(value), [value]);
    const readStats = useMemo(() => calculateReadStats(value), [value]);

    const insertFormatting = (prefix, suffix = "", defaultText = "") => {
        const textarea = textareaRef.current;
        if (!textarea || readOnly) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const currentText = textarea.value;
        const selectedText = currentText.substring(start, end) || defaultText;

        const replacement = `${prefix}${selectedText}${suffix}`;
        const nextValue =
            currentText.substring(0, start) +
            replacement +
            currentText.substring(end);

        onChange?.(nextValue);

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
        if (!textarea || readOnly) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const currentText = textarea.value;
        const selectedText = currentText.substring(start, end);

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

        onChange?.(nextValue);

        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(
                start + replacement.length,
                start + replacement.length,
            );
        }, 0);
    };

    return (
        <div className='w-full'>
            <label
                htmlFor='markdown-editor'
                className='block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-2'
            >
                {label} <span className='text-red-500'>*</span>
            </label>

            {/* Toolbar */}
            <div
                className={`flex flex-wrap items-center gap-1 p-2 rounded-xl bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 ${toolbarClassName}`}
            >
                <button
                    type='button'
                    onClick={() => insertFormatting("**", "**", "teks tebal")}
                    disabled={readOnly}
                    className='p-1.5 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-50 transition-colors'
                    title='Tebal (Bold)'
                    aria-label='Bold'
                >
                    <BsTypeBold className='text-sm' />
                </button>
                <button
                    type='button'
                    onClick={() => insertFormatting("*", "*", "teks miring")}
                    disabled={readOnly}
                    className='p-1.5 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-50 transition-colors'
                    title='Miring (Italic)'
                    aria-label='Italic'
                >
                    <BsTypeItalic className='text-sm' />
                </button>
                <div className='w-px h-4 bg-gray-300 dark:bg-slate-600 mx-1' />
                <button
                    type='button'
                    onClick={() => insertBlock("## ")}
                    disabled={readOnly}
                    className='p-1.5 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-50 transition-colors'
                    title='Judul Seksi (H2)'
                    aria-label='H2'
                >
                    <BsTypeH2 className='text-sm' />
                </button>
                <button
                    type='button'
                    onClick={() => insertBlock("### ")}
                    disabled={readOnly}
                    className='p-1.5 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-50 transition-colors'
                    title='Sub-judul (H3)'
                    aria-label='H3'
                >
                    <BsTypeH3 className='text-sm' />
                </button>
                <div className='w-px h-4 bg-gray-300 dark:bg-slate-600 mx-1' />
                <button
                    type='button'
                    onClick={() => insertBlock("> ")}
                    disabled={readOnly}
                    className='p-1.5 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-50 transition-colors'
                    title='Kutipan (Quote)'
                    aria-label='Quote'
                >
                    <BsQuote className='text-sm' />
                </button>
                <button
                    type='button'
                    onClick={() => insertBlock("- ")}
                    disabled={readOnly}
                    className='p-1.5 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-50 transition-colors'
                    title='Daftar Poin (List)'
                    aria-label='Unordered List'
                >
                    <BsListUl className='text-sm' />
                </button>
                <button
                    type='button'
                    onClick={() => insertBlock("1. ")}
                    disabled={readOnly}
                    className='p-1.5 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-50 transition-colors'
                    title='Daftar Berurutan (Numbered List)'
                    aria-label='Ordered List'
                >
                    <BsListOl className='text-sm' />
                </button>
                <div className='w-px h-4 bg-gray-300 dark:bg-slate-600 mx-1' />
                <button
                    type='button'
                    onClick={() => insertFormatting("`", "`", "kode")}
                    disabled={readOnly}
                    className='p-1.5 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-50 transition-colors'
                    title='Inline Code'
                    aria-label='Inline Code'
                >
                    <BsCodeSquare className='text-xs' />
                </button>
                <button
                    type='button'
                    onClick={() =>
                        insertFormatting("```\n", "\n```", "// kode blok")
                    }
                    disabled={readOnly}
                    className='px-2 py-1 text-xs font-mono rounded-lg text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-50 transition-colors'
                    title='Code Block'
                    aria-label='Code Block'
                >
                    {"{ }"}
                </button>
                <button
                    type='button'
                    onClick={() =>
                        insertFormatting("[", "](https://)", "tautan")
                    }
                    disabled={readOnly}
                    className='p-1.5 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-50 transition-colors'
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
                    disabled={readOnly}
                    className='p-1.5 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-50 transition-colors'
                    title='Sisipkan Gambar'
                    aria-label='Insert Image'
                >
                    <BsImage className='text-xs' />
                </button>
            </div>

            {/* Editor / Preview Tabs */}
            <div className='flex items-center justify-between mb-2'>
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
                    {showPreview && (
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
                    )}
                </div>
            </div>

            {/* Editor Pane */}
            {activeTab !== "preview" && (
                <textarea
                    id='markdown-editor'
                    ref={textareaRef}
                    required={required}
                    value={value}
                    onChange={(e) => onChange?.(e.target.value)}
                    rows={minRows}
                    className={`w-full font-mono text-xs leading-relaxed ${
                        textareaClassName ||
                        "px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    }`}
                    placeholder={placeholder}
                    readOnly={readOnly}
                />
            )}

            {/* Preview Pane */}
            {showPreview && activeTab !== "editor" && (
                <div
                    className={`blog-content text-gray-700 dark:text-gray-200 min-h-[160px] p-4 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 ${previewClassName}`}
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
            )}

            <p className='text-[11px] text-gray-400 mt-2'>
                Mendukung format Markdown (# Judul, **tebal**, *miring*, `kode`,
                &gt; kutipan) dan HTML.
                {readStats.words > 0 && (
                    <span className='ml-2'>
                        ~{readStats.words.toLocaleString()} kata,{" "}
                        {readStats.minutes}
                        menit baca
                    </span>
                )}
            </p>
        </div>
    );
};

export default MarkdownEditor;
