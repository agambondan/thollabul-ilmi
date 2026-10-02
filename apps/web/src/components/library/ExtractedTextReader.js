"use client";

import { useState, useMemo, useCallback } from "react";
import {
    BsDownload,
    BsCheck2,
    BsFiles,
    BsFiletypeMd,
    BsEye,
    BsType,
    BsFullscreen,
    BsFullscreenExit,
    BsSun,
    BsMoon,
    BsBookHalf,
} from "react-icons/bs";
import {
    parseExtractedText,
    blocksToMarkdown,
    downloadMarkdownFile,
} from "@/lib/pdfTextFormatter";

export default function ExtractedTextReader({
    text = "",
    pageNumber = 1,
    totalPages,
    bookTitle,
    fontSize = 16,
    fontFamily = "serif",
    viewMode = "doc",
    onViewModeChange,
    isFullWidth = false,
    onFullWidthChange,
}) {
    const [localViewMode, setLocalViewMode] = useState(viewMode || "doc");
    const [paperTheme, setPaperTheme] = useState("light");
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

    const wordCount = useMemo(() => {
        if (!text) return 0;
        return text.trim().split(/\s+/).filter(Boolean).length;
    }, [text]);

    const readingTimeMin = useMemo(() => {
        return Math.max(1, Math.ceil(wordCount / 180));
    }, [wordCount]);

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
            /^(Dan\s+)?(Allah(?:\s+Ta'?ala)?\s+berfirman|Firman\s+Allah|Rasulullah\s+.*bersabda|Sabda\s+beliau|Dari\s+.*radhiyallahu\s+'anhu|Ibnu\s+Abbas\s+.*berkata)\s*:\s*(.*)$/i,
        );

        if (dalilPrefixMatch) {
            const prefix = (dalilPrefixMatch[1] || "") + dalilPrefixMatch[2] + ":";
            const remainder = dalilPrefixMatch[3];
            return (
                <p key={idx} className='my-4 leading-relaxed'>
                    <strong className='font-semibold text-emerald-800 dark:text-emerald-300'>
                        {prefix}
                    </strong>{" "}
                    {remainder}
                </p>
            );
        }

        return (
            <p key={idx} className='my-4 leading-relaxed'>
                {rawText}
            </p>
        );
    };

    const paperStyles = {
        light: "bg-slate-50/70 text-gray-800 dark:bg-slate-950/60 dark:text-gray-200",
        sepia: "bg-[#faf6ee] text-[#2e261a] border-[#e8ddc7] dark:bg-[#1a1712] dark:text-[#f4ede1]",
        dark: "bg-slate-950 text-slate-100 border-slate-800",
    };

    const rawParagraphs = useMemo(() => {
        if (!text) return [];
        return text
            .split(/\n{2,}/)
            .map((p) => p.trim())
            .filter(Boolean);
    }, [text]);

    return (
        <div className='flex flex-1 flex-col overflow-hidden'>
            <div className='flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 bg-white px-3 py-2 text-xs text-gray-600 dark:border-slate-800 dark:bg-slate-900 dark:text-gray-300'>
                <div className='flex flex-wrap items-center gap-1'>
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

                <div className='flex flex-wrap items-center gap-1.5'>
                    <div className='hidden sm:flex items-center rounded-md border border-gray-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-800 text-[11px]'>
                        <button
                            type='button'
                            onClick={() => setPaperTheme("light")}
                            className={`px-1.5 py-0.5 rounded transition ${
                                paperTheme === "light"
                                    ? "bg-emerald-700 text-white font-bold"
                                    : "text-gray-600 hover:text-gray-900 dark:text-gray-300"
                            }`}
                            title='Tema Terang'
                        >
                            <BsSun size={11} />
                        </button>
                        <button
                            type='button'
                            onClick={() => setPaperTheme("sepia")}
                            className={`px-1.5 py-0.5 rounded transition ${
                                paperTheme === "sepia"
                                    ? "bg-amber-700 text-white font-bold"
                                    : "text-amber-800 dark:text-amber-300"
                            }`}
                            title='Tema Kertas Sepia (Nyaman untuk membaca lama)'
                        >
                            <BsBookHalf size={11} />
                        </button>
                        <button
                            type='button'
                            onClick={() => setPaperTheme("dark")}
                            className={`px-1.5 py-0.5 rounded transition ${
                                paperTheme === "dark"
                                    ? "bg-slate-800 text-white font-bold"
                                    : "text-gray-600 hover:text-gray-900 dark:text-gray-300"
                            }`}
                            title='Tema Gelap'
                        >
                            <BsMoon size={11} />
                        </button>
                    </div>

                    {onFullWidthChange && (
                        <button
                            type='button'
                            onClick={() => onFullWidthChange(!isFullWidth)}
                            title={
                                isFullWidth
                                    ? "Kembali ke tampilan split (Esc / F)"
                                    : "Mode Lebar Penuh / Fokus Belajar (F)"
                            }
                            className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-semibold transition ${
                                isFullWidth
                                    ? "border-emerald-600 bg-emerald-700 text-white"
                                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-200"
                            }`}
                        >
                            {isFullWidth ? (
                                <>
                                    <BsFullscreenExit size={12} />
                                    <span className='hidden md:inline'>Split</span>
                                </>
                            ) : (
                                <>
                                    <BsFullscreen size={12} />
                                    <span className='hidden md:inline'>Lebar Penuh</span>
                                </>
                            )}
                        </button>
                    )}

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
                        <span className='hidden sm:inline'>Unduh</span> .md
                    </button>
                </div>
            </div>

            <div
                className={`flex-1 overflow-y-auto p-5 md:p-8 select-text transition-colors duration-200 ${paperStyles[paperTheme] || paperStyles.light}`}
            >
                <div className='mx-auto w-full max-w-3xl lg:max-w-4xl'>
                    <div className='mb-4 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 border-b border-gray-200/50 pb-2 dark:border-slate-800/60'>
                        <span>
                            Halaman {pageNumber}
                            {totalPages ? ` dari ${totalPages}` : ""}
                        </span>
                        <span>
                            {wordCount} kata · ~{readingTimeMin} mnt baca
                        </span>
                    </div>

                    {activeViewMode === "markdown" ? (
                        <div className='rounded-xl border border-gray-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900'>
                            <pre
                                className='whitespace-pre-wrap font-mono leading-relaxed text-gray-800 dark:text-gray-200'
                                style={{
                                    fontSize: `${Math.max(12, fontSize - 2)}px`,
                                }}
                            >
                                {markdown}
                            </pre>
                        </div>
                    ) : activeViewMode === "raw" ? (
                        <div
                            className={`leading-relaxed text-justify ${
                                fontFamily === "serif"
                                    ? "font-serif"
                                    : "font-sans"
                            }`}
                            style={{
                                fontSize: `${fontSize}px`,
                                lineHeight: 1.95,
                            }}
                        >
                            {rawParagraphs.length > 0 ? (
                                rawParagraphs.map((para, idx) => (
                                    <p
                                        key={idx}
                                        className='my-4 whitespace-pre-wrap'
                                    >
                                        {para}
                                    </p>
                                ))
                            ) : (
                                <div className='whitespace-pre-wrap'>{text}</div>
                            )}
                        </div>
                    ) : (
                        <div
                            className={`leading-relaxed ${
                                fontFamily === "serif"
                                    ? "font-serif"
                                    : "font-sans"
                            }`}
                            style={{
                                fontSize: `${fontSize}px`,
                                lineHeight: 1.95,
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
                                            className='my-4 rounded-xl border border-amber-200/60 bg-amber-50/50 p-4 text-right font-serif text-xl leading-loose text-gray-900 shadow-2xs dark:border-slate-700/60 dark:bg-slate-800/40 dark:text-amber-100'
                                        >
                                            {b.text}
                                        </div>
                                    );
                                }

                                if (b.type === "quote") {
                                    return (
                                        <blockquote
                                            key={idx}
                                            className='my-4 rounded-r-xl border-l-4 border-emerald-600 bg-emerald-50/70 p-4 shadow-2xs dark:border-emerald-500 dark:bg-emerald-950/30'
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
                                            className='my-4 space-y-2 pl-5'
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
        </div>
    );
}
