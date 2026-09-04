"use client";

import { useLocale } from "@/context/Locale";
import { CopyToClipboard } from "@/lib/copy";
import { getLocalizedField } from "@/lib/translation";
import { useState } from "react";
import Dialog from "@/components/Dialog";

const buildShareUrls = ({ text, url, title }) => {
    const encodedText = encodeURIComponent(text);
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title || "Thullaabul 'Ilmi");

    return [
        ["WhatsApp", `https://wa.me/?text=${encodedText}`],
        [
            "Telegram",
            `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
        ],
        [
            "Facebook",
            `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
        ],
        [
            "X",
            `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
        ],
        [
            "Threads",
            `https://www.threads.net/intent/post?text=${encodeURIComponent(`${text}\n${url}`)}`,
        ],
        [
            "LinkedIn",
            `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
        ],
        ["Email", `mailto:?subject=${encodedTitle}&body=${encodedText}`],
    ];
};

export function ShareDoaModal({ isOpen, onClose, doa }) {
    const { t, lang } = useLocale();
    const [copied, setCopied] = useState(false);

    if (!isOpen || !doa) return null;

    const shareUrl = typeof window !== "undefined" ? window.location.href : "";
    const title = getLocalizedField(doa, "title", lang, ["name"]);
    const desc = getLocalizedField(doa, "description", lang, [
        "meaning",
        "translation",
    ]);
    const arabic = doa.translation?.ar || "";
    const latin = doa.translation?.latin_idn || "";
    const shareText = [
        t("doa.share_title", { title }),
        arabic,
        latin,
        desc,
        `${t("doa.via")} ${typeof window !== "undefined" ? window.location.origin : ""}/doa`,
    ]
        .filter(Boolean)
        .join("\n");

    const copyShareText = async () => {
        await CopyToClipboard(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    const openShareWindow = (url) =>
        window.open(url, "_blank", "noopener,noreferrer");

    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            title={t("doa.share_modal_title")}
            size='sm'
        >
            <>
                <div className='space-y-3 text-sm text-gray-700 dark:text-gray-200 dark:text-gray-300 mb-4'>
                    <p className='font-medium text-gray-900 dark:text-gray-100 dark:text-white'>
                        {title}
                    </p>
                    {arabic && (
                        <p className='text-emerald-700 dark:text-emerald-400 text-right font-amiri text-lg leading-relaxed'>
                            {arabic}
                        </p>
                    )}
                    {latin && (
                        <p className='italic text-gray-600 dark:text-gray-300 dark:text-gray-400'>
                            {latin}
                        </p>
                    )}
                    <p>{desc}</p>
                </div>

                <div className='grid grid-cols-2 sm:grid-cols-3 gap-2'>
                    {typeof navigator !== "undefined" && navigator.share && (
                        <button
                            type='button'
                            onClick={async () => {
                                try {
                                    await navigator.share({
                                        title: "Thullaabul 'Ilmi",
                                        text: shareText,
                                        url: shareUrl,
                                    });
                                    onClose();
                                } catch (err) {
                                    if (err.name !== "AbortError")
                                        copyShareText();
                                }
                            }}
                            className='rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-300'
                        >
                            {t("common.share_sheet")}
                        </button>
                    )}
                    {buildShareUrls({
                        text: shareText,
                        url: shareUrl,
                        title,
                    }).map(([label, url]) => (
                        <button
                            key={label}
                            type='button'
                            onClick={() => openShareWindow(url)}
                            className='rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:border-emerald-300 hover:text-emerald-700 hover:dark:text-emerald-400 dark:border-slate-700 dark:text-gray-300'
                        >
                            {label}
                        </button>
                    ))}
                    <button
                        type='button'
                        onClick={copyShareText}
                        className='rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:border-emerald-300 hover:text-emerald-700 hover:dark:text-emerald-400 dark:border-slate-700 dark:text-gray-300'
                    >
                        {copied ? t("common.copied") : t("common.copy_text")}
                    </button>
                </div>
            </>
        </Dialog>
    );
}
