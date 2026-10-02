"use client";

import { useState, useMemo, useCallback } from "react";
import {
    BsDownload,
    BsCheck2,
    BsFiles,
    BsFiletypeMd,
    BsEye,
    BsType,
} from "react-icons/bs";
import {
    parseExtractedText,
    blocksToMarkdown,
    downloadMarkdownFile,
} from "@/lib/pdfTextFormatter";

export default function ExtractedTextReader({
    text,
    pageNumber,
    bookTitle,
    fontSize = 16,
    fontFamily = "serif",
    viewMode = "doc",
    onViewModeChange,
}) {
    const [localViewMode, setLocalViewMode] = useState(viewMode || "doc");
    const [copied, setCopied] = useState(false);

    const activeViewMode = viewMode || localViewMode;
    const handleSetViewMode = (mode) => {
        setLocalViewMode(mode);
        onViewModeChange?.(mode);
    };

    const blocks = useMemo(() => parseExtractedText(text), [text]);
    const markdown = useMemo(
        () => blocksToMarkdown(blocks, pageNumber, bookTitle),
        [blocks, pageNumber, bookTitle],
    );

    const handleCopy = useCallback(
        (content) => {
            if (navigator?.clipboard) {
                navigator.clipboard.writeText(content);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }
        },
        [],
    );

    const handleDownloadMd = useCallback(() => {
        const safeTitle = (bookTitle || "buku")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
        const filename = `${safeTitle}-hal-${pageNumber || 1}.md`;
        downloadMarkdownFile(filename, markdown);
    }, [bookTitle, pageNumber, markdown]);

    const renderStyledParagraph = (rawText, idx) => {
        const dalilPrefixMatch = rawText.match(
            /^(Dan\s+)?(Allah(?:\s+Ta'?ala)?\s+berfirman|Firman\s+Allah|Rasulullah\s+.*bersabda|Sabda\s+beliau|Dari\s+.*radhiyallahu\s+'anhu)\s*:\s*(.*)$/i,
        );

        if (dalilPrefixMatch) {
            const prefix = (dalilPrefixMatch[1] || "") + dalilPrefixMatch[2] + ":";
            const remainder = dalilPrefixMatch[3];
            return (
                <p key={idx} className='my-3 leading-relaxed'>
                    <strong className='font-semibold text-emerald-900 dark:text-emerald-300'>
                        {prefix}
                    </strong>{" "}
                    {remainder}
                </p>
            );
        }

        return (
            <p key={idx} className='my-3 leading-relaxed'>
                {rawText}
            </p>
        );
    };

    return (
        <div className='flex flex-1 flex-col overflow-hidden'>
            <div className='flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 bg-white px-3 py-2 text-xs text-gray-600 dark:border-slate-800 dark:bg-slate-900 dark:text-gray-300'>
                <div className='flex items-center gap-1'>
                    <button
                        type='button'
                        onClick={() => handleSetViewMode("doc")}
                        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                            activeViewMode === "doc"
                                ? "bg-emerald-700 text-white shadow-xs"
                                : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-800"
                        }`}
                        title='Tampilan dokumen berformat rapi'
                    >
                        <BsEye size={13} />
                        Dokumen Rapi
                    </button>
                    <button
                        type='button'
                        onClick={() => handleSetViewMode("markdown")}
                        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                            activeViewMode === "markdown"
                                ? "bg-emerald-700 text-white shadow-xs"
                                : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-800"
                        }`}
                        title='Tampilan format Markdown (.md)'
                    >
                        <BsFiletypeMd size={13} />
                        Markdown
                    </button>
                    <button
                        type='button'
                        onClick={() => handleSetViewMode("raw")}
                        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                            activeViewMode === "raw"
                                ? "bg-emerald-700 text-white shadow-xs"
                                : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-800"
                        }`}
                        title='Teks mentah hasil ekstraksi'
                    >
                        <BsType size={13} />
                        Teks Asli
                    </button>
                </div>

                <div className='flex items-center gap-1.5'>
                    <button
                        type='button'
                        onClick={() =>
                            handleCopy(
                                activeViewMode === "markdown" ? markdown : text,
                            )
                        }
                        title={
                            activeViewMode === "markdown"
                                ? "Salin format Markdown"
                                : "Salin teks halaman ini"
                        }
                        className='inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700'
                    >
                        {copied ? (
                            <>
                                <BsCheck2 className='text-emerald-600' />
                                Tersalin
                            </>
                        ) : (
                            <>
                                <BsFiles />
                                {activeViewMode === "markdown"
                                    ? "Salin .md"
                                    : "Salin"}
                            </>
                        )}
                    </button>
                    <button
                        type='button'
                        onClick={handleDownloadMd}
                        title='Unduh halaman ini sebagai file Markdown (.md)'
                        className='inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-50 dark:border-slate-700 dark:bg-slate-800 dark:text-emerald-300 dark:hover:bg-slate-700'
                    >
                        <BsDownload size={12} />
                        Unduh .md
                    </button>
                </div>
            </div>

            <div className='flex-1 overflow-y-auto p-5 md:p-6 bg-slate-50/50 dark:bg-slate-950/40 select-text'>
                {activeViewMode === "markdown" ? (
                    <div className='rounded-xl border border-gray-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900'>
                        <pre
                            className='whitespace-pre-wrap font-mono leading-relaxed text-gray-800 dark:text-gray-200'
                            style={{ fontSize: `${Math.max(12, fontSize - 2)}px` }}
                        >
                            {markdown}
                        </pre>
                    </div>
                ) : activeViewMode === "raw" ? (
                    <div
                        className={`whitespace-pre-wrap leading-relaxed text-gray-800 dark:text-gray-200 ${
                            fontFamily === "serif" ? "font-serif" : "font-sans"
                        }`}
                        style={{
                            fontSize: `${fontSize}px`,
                            lineHeight: 1.85,
                        }}
                    >
                        {text}
                    </div>
                ) : (
                    <div
                        className={`leading-relaxed text-gray-800 dark:text-gray-200 ${
                            fontFamily === "serif" ? "font-serif" : "font-sans"
                        }`}
                        style={{
                            fontSize: `${fontSize}px`,
                            lineHeight: 1.85,
                        }}
                    >
                        {blocks.map((b, idx) => {
                            if (b.type === "heading") {
                                if (b.level === 2) {
                                    return (
                                        <h2
                                            key={idx}
                                            className='mt-6 mb-3 border-b border-emerald-100 pb-2 text-xl font-bold tracking-tight text-emerald-900 dark:border-slate-800 dark:text-emerald-300 font-sans'
                                        >
                                            {b.text}
                                        </h2>
                                    );
                                }
                                return (
                                    <h3
                                        key={idx}
                                        className='mt-4 mb-2 text-base font-bold text-gray-900 dark:text-white font-sans'
                                    >
                                        {b.text}
                                    </h3>
                                );
                            }

                            if (b.type === "arabic") {
                                return (
                                    <div
                                        key={idx}
                                        dir='rtl'
                                        className='my-4 rounded-xl border border-amber-200/60 bg-amber-50/40 p-4 text-right font-serif text-xl leading-loose text-gray-900 shadow-2xs dark:border-slate-700/60 dark:bg-slate-800/40 dark:text-amber-100'
                                    >
                                        {b.text}
                                    </div>
                                );
                            }

                            if (b.type === "quote") {
                                return (
                                    <blockquote
                                        key={idx}
                                        className='my-3 rounded-r-xl border-l-4 border-emerald-600 bg-emerald-50/70 p-4 shadow-2xs dark:border-emerald-500 dark:bg-emerald-950/30'
                                    >
                                        <p className='italic font-serif leading-relaxed text-gray-800 dark:text-gray-200'>
                                            {b.text}
                                        </p>
                                        {b.citation && (
                                            <div className='mt-2 flex items-center gap-1.5'>
                                                <span className='inline-flex items-center rounded-md bg-emerald-100/90 px-2 py-0.5 text-xs font-semibold font-sans text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'>
                                                    {b.citation}
                                                </span>
                                            </div>
                                        )}
                                    </blockquote>
                                );
                            }

                            if (b.type === "list") {
                                return (
                                    <ul
                                        key={idx}
                                        className='my-3 space-y-1.5 pl-5'
                                    >
                                        {b.items.map((it, itemIdx) => (
                                            <li
                                                key={itemIdx}
                                                className='list-disc'
                                            >
                                                <span className='font-semibold text-emerald-900 dark:text-emerald-300 mr-1'>
                                                    {it.prefix}
                                                </span>
                                                {it.text}
                                            </li>
                                        ))}
                                    </ul>
                                );
                            }

                            return renderStyledParagraph(b.text, idx);
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
