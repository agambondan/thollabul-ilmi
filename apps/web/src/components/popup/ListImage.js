"use client";
/* eslint-disable @next/next/no-img-element */

import { useLocale } from "@/context/Locale";
import {
    CopyImageToClipboard,
    CopyToClipboard,
    shareCanvasWithText,
} from "@/lib/copy";
import { renderShareImage } from "@/lib/shareImage";
import { useCallback, useState } from "react";
import { IoClose } from "react-icons/io5";
import { useModalA11y } from "@/lib/useModalA11y";

const MAX_SHARE_LENGTH = 4096;

const loadImage = (src) =>
    new Promise((resolve, reject) => {
        const image = new Image();
        // crossOrigin hanya untuk image raster via CORS; SVG self-host tidak butuh
        // dan menambahkan CORS dapat bikin canvas tainting. Skip kalau src SVG.
        if (!/\.svg($|\?)/i.test(src)) image.crossOrigin = "anonymous";
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
    const [selectedImage, setSelectedImage] = useState(
        images && images.length > 0 ? images[0].src : null,
    );
    const modalA11y = useModalA11y({ onClose: isCopiedCallback });

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

    const buildImageCanvas = useCallback(
        async (src) => {
            let hasKitab = false;
            try {
                const fontKitab = new FontFace(
                    "Kitab",
                    'url("/fonts/Kitab-Regular.woff2") format("woff2")',
                );
                const loadedFace = await fontKitab.load();
                document.fonts.add(loadedFace);
                hasKitab = true;
            } catch {
                hasKitab = false;
            }
            const image = await loadImage(src);
            return renderShareImage({ image, text, hasKitab });
        },
        [text],
    );

    const downloadCanvas = useCallback((canvas, filename) => {
        const link = document.createElement("a");
        link.download = filename;
        link.href = canvas.toDataURL("image/png");
        link.click();
    }, []);

    const handleImageAction = useCallback(
        async (src, mode = "share") => {
            if (isProcessing) return;
            SetIsProcessing(true);
            setError("");
            setSelectedImage(src);

            let canvas;
            try {
                canvas = await buildImageCanvas(src);
            } catch (err) {
                SetIsProcessing(false);
                const msg =
                    err && err.name === "Error" && err.message
                        ? "Gagal memproses gambar (CORS). Coba background lain."
                        : "Gagal memuat gambar background.";
                setError(msg);
                setTimeout(() => setError(""), 4000);
                return;
            }

            if (mode === "download") {
                try {
                    downloadCanvas(canvas, "ayat.png");
                    setStatus("Gambar berhasil diunduh.");
                    setTimeout(() => setStatus(""), 2000);
                } catch {
                    setError("Gagal mengunduh gambar.");
                    setTimeout(() => setError(""), 3000);
                } finally {
                    SetIsProcessing(false);
                }
                return;
            }

            if (mode === "copy") {
                try {
                    await CopyImageToClipboard(canvas);
                    SetIsCopied(true);
                    setStatus(t("share_image.copy_instruction"));
                    setTimeout(() => SetIsCopied(false), 2000);
                    setTimeout(() => setStatus(""), 3500);
                } catch {
                    try {
                        downloadCanvas(canvas, "ayat.png");
                        setError("Clipboard tidak didukung. Gambar diunduh.");
                        setTimeout(() => setError(""), 3000);
                    } catch {
                        setError("Gagal menyalin gambar.");
                        setTimeout(() => setError(""), 3000);
                    }
                } finally {
                    SetIsProcessing(false);
                }
                return;
            }

            try {
                await shareCanvasWithText(canvas, {
                    title: "Thullaabul 'Ilmi",
                    text: shareText,
                    url: shareUrl,
                    filename: "ayat.png",
                });
                isCopiedCallback();
                return;
            } catch (err) {
                if (err && err.message === "UNSUPPORTED") {
                    try {
                        await CopyImageToClipboard(canvas);
                        SetIsCopied(true);
                        setStatus(t("share_image.copy_instruction"));
                        setTimeout(() => SetIsCopied(false), 2000);
                        setTimeout(() => setStatus(""), 3500);
                        return;
                    } catch {
                        try {
                            downloadCanvas(canvas, "ayat.png");
                            setError(
                                "Clipboard tidak didukung. Gambar diunduh.",
                            );
                            setTimeout(() => setError(""), 3000);
                            return;
                        } catch {
                            setError("Gagal membagikan gambar.");
                            setTimeout(() => setError(""), 3000);
                            return;
                        }
                    }
                }
                if (err && err.name === "AbortError") return;
                setError("Gagal membuka share sheet.");
                setTimeout(() => setError(""), 3000);
            } finally {
                SetIsProcessing(false);
            }
        },
        [
            isProcessing,
            buildImageCanvas,
            downloadCanvas,
            t,
            shareText,
            shareUrl,
            isCopiedCallback,
        ],
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
                {...modalA11y}
                id='PlaceTextToImage'
                className='fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl w-[90vw] max-w-lg max-h-[90vh] overflow-y-auto outline-none'
            >
                <div className='flex items-center justify-between mb-3'>
                    <h3 className='text-sm font-semibold text-emerald-900 dark:text-emerald-300 dark:text-white'>
                        {t("ayah.share_title")}
                    </h3>
                    <button
                        onClick={isCopiedCallback}
                        className='p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-gray-300 dark:text-gray-400 transition-colors'
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
                            className='rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-300'
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
                        className='rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:border-emerald-300 hover:text-emerald-700 hover:dark:text-emerald-400 dark:border-slate-700 dark:text-gray-300'
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
                        className='rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:border-emerald-300 hover:text-emerald-700 hover:dark:text-emerald-400 dark:border-slate-700 dark:text-gray-300'
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
                        className='rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:border-emerald-300 hover:text-emerald-700 hover:dark:text-emerald-400 dark:border-slate-700 dark:text-gray-300'
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
                        className='rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:border-emerald-300 hover:text-emerald-700 hover:dark:text-emerald-400 dark:border-slate-700 dark:text-gray-300'
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
                        className='rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:border-emerald-300 hover:text-emerald-700 hover:dark:text-emerald-400 dark:border-slate-700 dark:text-gray-300'
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
                        className='rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:border-emerald-300 hover:text-emerald-700 hover:dark:text-emerald-400 dark:border-slate-700 dark:text-gray-300'
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
                        className='rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:border-emerald-300 hover:text-emerald-700 hover:dark:text-emerald-400 dark:border-slate-700 dark:text-gray-300'
                    >
                        Email
                    </button>
                    <button
                        type='button'
                        onClick={copyShareText}
                        className='rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:border-emerald-300 hover:text-emerald-700 hover:dark:text-emerald-400 dark:border-slate-700 dark:text-gray-300'
                    >
                        Copy Text
                    </button>
                </div>
                <p className='mb-2 text-xs font-semibold text-gray-500 dark:text-gray-300 dark:text-gray-400'>
                    {t("share_image.pick_background")}
               </p>
                <div className='grid grid-cols-3 md:grid-cols-4 gap-2'>
                    {images.map((image, index) => {
                        const isSelected = image.src === selectedImage;
                        return (
                            <button
                                key={index}
                                disabled={isProcessing}
                                aria-pressed={isSelected}
                                className={`relative rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-wait transition-all ${
                                    isSelected
                                        ? "ring-4 ring-emerald-500 scale-95"
                                        : ""
                                }`}
                                onClick={() =>
                                    handleImageAction(image.src, "share")
                                }
                            >
                                <img
                                    className='h-20 w-full object-cover transition-transform duration-200 hover:scale-105'
                                    src={image.src}
                                    alt={image.alt}
                                />
                                {isSelected && (
                                    <span className='absolute top-1 right-1 bg-emerald-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold'>
                                        ✓
                                   </span>
                                )}
                           </button>
                        );
                    })}
               </div>
                {selectedImage && (
                    <div className='grid grid-cols-3 gap-2 mt-3'>
                        <button
                            type='button'
                            disabled={isProcessing}
                            onClick={() =>
                                handleImageAction(selectedImage, "share")
                            }
                            className='rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-300 disabled:opacity-50'
                        >
                            {t("share_image.share_btn")}
                       </button>
                        <button
                            type='button'
                            disabled={isProcessing}
                            onClick={() =>
                                handleImageAction(selectedImage, "copy")
                            }
                            className='rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-700 dark:text-gray-300 disabled:opacity-50'
                        >
                            {t("share_image.copy_btn")}
                       </button>
                        <button
                            type='button'
                            disabled={isProcessing}
                            onClick={() =>
                                handleImageAction(selectedImage, "download")
                            }
                            className='rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-700 dark:text-gray-300 disabled:opacity-50'
                        >
                            {t("share_image.download_btn")}
                       </button>
                   </div>
                )}
                {isProcessing && (
                    <p className='text-center text-sm text-gray-500 dark:text-gray-300 dark:text-gray-400 mt-3'>
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
