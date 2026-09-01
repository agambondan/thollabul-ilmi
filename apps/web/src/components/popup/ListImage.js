"use client";
/* eslint-disable @next/next/no-img-element */

import { useLocale } from "@/context/Locale";
import { CopyImageToClipboard, CopyToClipboard } from "@/lib/copy";
import { renderShareImage } from "@/lib/shareImage";
import { useCallback, useState } from "react";
import { IoClose } from "react-icons/io5";

const MAX_SHARE_LENGTH = 4096;

const loadImage = (src) =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = "anonymous";
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = src;
    });

export const ShareAyah = ({ images, isCopiedCallback, text }) => {
    const { t } = useLocale();
    const [isCopied, SetIsCopied] = useState(false);
    const [isProcessing, SetIsProcessing] = useState(false);
    const [status, setStatus] = useState("");
    const [error, setError] = useState("");

    const shareUrl = typeof window !== "undefined" ? window.location.href : "";
    const shareText = text || shareUrl;
    const encodedUrl = encodeURIComponent(shareUrl);

    const openShareWindow = useCallback((url) => {
        window.open(url, "_blank", "noopener,noreferrer");
    }, []);

    const nativeShare = useCallback(async () => {
        if (!navigator?.share) {
            setError("Share sheet tidak tersedia di browser ini.");
            setTimeout(() => setError(""), 3000);
            return;
        }
        try {
            await navigator.share({
                title: "Thullaabul 'Ilmi",
                text: shareText,
                url: shareUrl,
            });
            isCopiedCallback();
        } catch (err) {
            if (err.name !== "AbortError") {
                setError("Gagal membuka share sheet.");
                setTimeout(() => setError(""), 3000);
            }
        }
    }, [shareText, shareUrl, isCopiedCallback]);

    const copyShareText = useCallback(async () => {
        try {
            await CopyToClipboard(shareText);
            setStatus("Teks siap dibagikan sudah disalin.");
            setTimeout(() => setStatus(""), 2200);
        } catch {
            setError("Gagal menyalin teks.");
            setTimeout(() => setError(""), 3000);
        }
    }, [shareText]);

    const copyImageToClipboard = useCallback(
        async (src) => {
            if (isProcessing) return;
            SetIsProcessing(true);
            setError("");

            let hasKitab = false;
            try {
                const fontKitab = new FontFace(
                    "Kitab",
                    'url("/fonts/Kitab-Regular.ttf")',
                );
                const loadedFace = await fontKitab.load();
                document.fonts.add(loadedFace);
                hasKitab = true;
            } catch {
                hasKitab = false;
            }

            let image;
            try {
                image = await loadImage(src);
            } catch {
                SetIsProcessing(false);
                setError("Gagal memuat gambar background.");
                setTimeout(() => setError(""), 3000);
                return;
            }

            let canvas;
            try {
                canvas = renderShareImage({ image, text, hasKitab });
            } catch {
                SetIsProcessing(false);
                setError(
                    "Gagal memproses gambar (CORS). Coba background lain.",
                );
                setTimeout(() => setError(""), 4000);
                return;
            }

            try {
                await CopyImageToClipboard(canvas);
                SetIsCopied(true);
                setTimeout(() => SetIsCopied(false), 2000);
            } catch {
                setError(
                    "Gambar disimpan sebagai file (clipboard tidak didukung).",
                );
                setTimeout(() => setError(""), 3000);
            } finally {
                SetIsProcessing(false);
            }
        },
        [isProcessing, text],
    );

    const getTruncatedText = useCallback(
        (maxLen) => {
            if (shareText.length <= maxLen) return shareText;
            return shareText.slice(0, maxLen - 30) + "\n... (dipotong)";
        },
        [shareText],
    );

    const shortText = getTruncatedText(MAX_SHARE_LENGTH);
    const encodedText = encodeURIComponent(shortText);
    const combinedText = encodeURIComponent(`${shortText}\n${shareUrl}`);

    return (
        <>
            <div
                className='fixed inset-0 bg-black/50 z-40'
                onClick={isCopiedCallback}
            />
            <div
                id='PlaceTextToImage'
                className='fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl w-[90vw] max-w-lg max-h-[90vh] overflow-y-auto'
            >
                <div className='flex items-center justify-between mb-3'>
                    <h3 className='text-sm font-semibold text-emerald-900 dark:text-white'>
                        Bagikan Ayat
                    </h3>
                    <button
                        onClick={isCopiedCallback}
                        className='p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-gray-400 transition-colors'
                    >
                        <IoClose size={20} />
                    </button>
                </div>

                {error && (
                    <div className='mb-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-xs'>
                        {error}
                    </div>
                )}

                <div className='grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4'>
                    {typeof navigator !== "undefined" && navigator.share && (
                        <button
                            type='button'
                            onClick={nativeShare}
                            className='rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-300'
                        >
                            Share Sheet
                        </button>
                    )}
                    <button
                        type='button'
                        onClick={() =>
                            openShareWindow(
                                `https://wa.me/?text=${encodedText}`,
                            )
                        }
                        className='rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-700 dark:text-gray-300'
                    >
                        WhatsApp
                    </button>
                    <button
                        type='button'
                        onClick={() =>
                            openShareWindow(
                                `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
                            )
                        }
                        className='rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-700 dark:text-gray-300'
                    >
                        Telegram
                    </button>
                    <button
                        type='button'
                        onClick={() =>
                            openShareWindow(
                                `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
                            )
                        }
                        className='rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-700 dark:text-gray-300'
                    >
                        Facebook
                    </button>
                    <button
                        type='button'
                        onClick={() =>
                            openShareWindow(
                                `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
                            )
                        }
                        className='rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-700 dark:text-gray-300'
                    >
                        X
                    </button>
                    <button
                        type='button'
                        onClick={() =>
                            openShareWindow(
                                `https://www.threads.net/intent/post?text=${combinedText}`,
                            )
                        }
                        className='rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-700 dark:text-gray-300'
                    >
                        Threads
                    </button>
                    <button
                        type='button'
                        onClick={() =>
                            openShareWindow(
                                `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
                            )
                        }
                        className='rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-700 dark:text-gray-300'
                    >
                        LinkedIn
                    </button>
                    <button
                        type='button'
                        onClick={() =>
                            openShareWindow(
                                `mailto:?subject=Thullaabul%20'Ilmi&body=${encodedText}`,
                            )
                        }
                        className='rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-700 dark:text-gray-300'
                    >
                        Email
                    </button>
                    <button
                        type='button'
                        onClick={copyShareText}
                        className='rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-700 dark:text-gray-300'
                    >
                        Copy Text
                    </button>
                </div>
                <p className='mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400'>
                    {t("share_image.pick_background")}
                </p>
                <div className='grid grid-cols-3 md:grid-cols-4 gap-2'>
                    {images.map((image, index) => (
                        <button
                            key={index}
                            disabled={isProcessing}
                            className='relative rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-wait'
                            onClick={() => copyImageToClipboard(image.src)}
                        >
                            <img
                                className='h-20 w-full object-cover transition-transform duration-200 hover:scale-105'
                                src={image.src}
                                alt={image.alt}
                            />
                        </button>
                    ))}
                </div>
                {isProcessing && (
                    <p className='text-center text-sm text-gray-500 dark:text-gray-400 mt-3'>
                        {t("share_image.processing")}
                    </p>
                )}
                {isCopied && (
                    <p className='text-center text-sm text-emerald-600 dark:text-emerald-400 font-semibold mt-3'>
                        {t("share_image.copied_clipboard")}
                    </p>
                )}
                {status && (
                    <p className='text-center text-sm text-emerald-600 dark:text-emerald-400 font-semibold mt-3'>
                        {status}
                    </p>
                )}
            </div>
        </>
    );
};

export const PopUpIsCopied = () => {
    const { t } = useLocale();

    return (
        <div className='fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-full shadow-lg'>
            {t("share_image.copied")}
        </div>
    );
};
