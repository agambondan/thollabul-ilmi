"use client";
/* eslint-disable @next/next/no-img-element */

import { useLocale } from "@/context/Locale";
import { CopyImageToClipboard, CopyToClipboard } from "@/lib/copy";
import { useCallback, useState } from "react";
import { IoClose } from "react-icons/io5";

const MAX_WHATSAPP_LENGTH = 4096;
const MAX_TELEGRAM_LENGTH = 4096;

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
        (src) => {
            if (isProcessing) return;
            SetIsProcessing(true);
            setError("");

            const fontKitab = new FontFace(
                "Kitab",
                'url("/fonts/Kitab-Regular.ttf")',
            );

            fontKitab
                .load()
                .then((loadedFace) => {
                    document.fonts.add(loadedFace);
                    processImageWithFont(src, loadedFace);
                })
                .catch(() => {
                    processImageWithFont(src, null);
                });

            function processImageWithFont(src, fontFace) {
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.onload = () => {
                    const newLines = text.split("\n");
                    const canvas = document.createElement("canvas");
                    const maxWidth = img.width - 80;

                    canvas.width = img.width;
                    canvas.height = img.height;

                    const context = canvas.getContext("2d");
                    context.globalAlpha = 0.85;
                    try {
                        context.drawImage(img, 0, 0);
                    } catch (e) {
                        SetIsProcessing(false);
                        setError(
                            "Gagal memproses gambar (CORS). Coba background lain.",
                        );
                        setTimeout(() => setError(""), 4000);
                        return;
                    }

                    let contextFont = "";
                    let contextFontKitab = "";
                    let lineHeight = 25;

                    let x = canvas.width / 2;
                    let y =
                        canvas.height / 2 - (newLines.length / 2) * lineHeight;

                    context.fillStyle = "rgb(255, 255, 255)";
                    if (canvas.width >= 1080 && canvas.width < 1920) {
                        contextFont = "24px Arial";
                        contextFontKitab = fontFace
                            ? "36px Kitab"
                            : "36px Arial";
                        lineHeight = 50;
                        context.fillRect(
                            30,
                            30,
                            img.width - 60,
                            img.height - 60,
                        );
                    } else if (canvas.width >= 1920 && canvas.width < 2048) {
                        contextFont = "30px Arial";
                        contextFontKitab = fontFace
                            ? "50px Kitab"
                            : "50px Arial";
                        lineHeight = 75;
                        context.fillRect(
                            40,
                            40,
                            img.width - 80,
                            img.height - 80,
                        );
                    } else if (canvas.width >= 2048 && canvas.width < 3840) {
                        contextFont = "40px Arial";
                        contextFontKitab = fontFace
                            ? "60px Kitab"
                            : "60px Arial";
                        lineHeight = 90;
                        context.fillRect(
                            40,
                            40,
                            img.width - 80,
                            img.height - 80,
                        );
                    } else if (canvas.width >= 3840) {
                        contextFont = "55px Arial";
                        contextFontKitab = fontFace
                            ? "80px Kitab"
                            : "80px Arial";
                        lineHeight = 110;
                        context.fillRect(
                            40,
                            40,
                            img.width - 80,
                            img.height - 80,
                        );
                    } else {
                        contextFont = "20px Arial";
                        contextFontKitab = fontFace
                            ? "28px Kitab"
                            : "28px Arial";
                        lineHeight = 30;
                        context.fillRect(
                            20,
                            20,
                            img.width - 40,
                            img.height - 40,
                        );
                    }

                    let calculationHeight = 0;
                    newLines.forEach((newLine, index) => {
                        let words = newLine.split(" ");
                        let line = "";
                        for (let n = 0; n < words.length; n++) {
                            let testLine = line + words[n] + " ";
                            let metrics = context.measureText(testLine);
                            let testWidth = metrics.width;
                            if (testWidth > maxWidth && n > 0) {
                                line = words[n] + " ";
                                y += lineHeight;
                                calculationHeight += y;
                            } else {
                                line = testLine;
                            }
                        }
                        calculationHeight += index * lineHeight;
                    });

                    context.fillStyle = "black";
                    context.textAlign = "center";
                    context.textBaseline = "middle";
                    newLines.forEach((newLine, index) => {
                        if (index === 1) {
                            y += lineHeight / 4;
                            context.direction = "rtl";
                            context.font = contextFontKitab;
                        } else {
                            context.direction = "ltr";
                            context.font = contextFont;
                        }
                        if (index === 5) {
                            y -= lineHeight / 4;
                        }
                        y += lineHeight / 4;
                        let words = newLine.split(" ");
                        let line = "";
                        for (let n = 0; n < words.length; n++) {
                            let testLine = line + words[n] + " ";
                            let metrics = context.measureText(testLine);
                            let testWidth = metrics.width;
                            if (testWidth > maxWidth && n > 0) {
                                context.fillText(
                                    line,
                                    x,
                                    y + index * lineHeight,
                                );
                                line = words[n] + " ";
                                if (index === 1) {
                                    y += lineHeight * 2;
                                } else {
                                    y += lineHeight;
                                }
                            } else {
                                line = testLine;
                            }
                        }
                        context.fillText(line, x, y + index * lineHeight);
                    });

                    CopyImageToClipboard(canvas)
                        .then(() => {
                            SetIsCopied(true);
                            SetIsProcessing(false);
                            setTimeout(() => {
                                SetIsCopied(false);
                            }, 2000);
                        })
                        .catch(() => {
                            SetIsProcessing(false);
                            setError(
                                "Gambar disimpan sebagai file (clipboard tidak didukung).",
                            );
                            setTimeout(() => setError(""), 3000);
                        });
                };
                img.onerror = () => {
                    SetIsProcessing(false);
                    setError("Gagal memuat gambar background.");
                    setTimeout(() => setError(""), 3000);
                };
                img.src = src;
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

    const whatsAppText = getTruncatedText(MAX_WHATSAPP_LENGTH);
    const telegramText = getTruncatedText(MAX_TELEGRAM_LENGTH);
    const encodedWhatsApp = encodeURIComponent(whatsAppText);
    const encodedTelegram = encodeURIComponent(telegramText);

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
                                `https://wa.me/?text=${encodedWhatsApp}`,
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
                                `https://t.me/share/url?url=${encodedUrl}&text=${encodedTelegram}`,
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
                                `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
                            )
                        }
                        className='rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-700 dark:text-gray-300'
                    >
                        LinkedIn
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
