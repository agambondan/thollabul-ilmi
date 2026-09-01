"use client";

import { useLocale } from "@/context/Locale";
import { CopyToClipboard } from "@/lib/copy";
import { getLocalizedField } from "@/lib/translation";
import { BsShare, BsX } from "react-icons/bs";
import { useState } from "react";

export function ShareDoaModal({ isOpen, onClose, doa }) {
    if (!isOpen || !doa) return null;

    const { t, lang } = useLocale();
    const [copied, setCopied] = useState(false);

    const shareUrl = typeof window !== "undefined" ? window.location.href : "";
    const title = getLocalizedField(doa, "title", lang, ["name"]);
    const desc = getLocalizedField(doa, "description", lang, ["meaning", "translation"]);
    const arabic = doa.translation?.ar || "";
    const latin = doa.translation?.latin_idn || "";

    let shareText = `${t("doa.share_title", { title })}\n`;
    if (arabic) shareText += `${arabic}\n`;
    if (latin) shareText += `${latin}\n`;
    shareText += `${desc}\n`;
    shareText += `\n${t("doa.via")} ${window.location.origin}/doa`;

    const copyShareText = () => {
        CopyToClipboard(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    const encodedText = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent(shareUrl);

    const openShareWindow = (url) => {
        window.open(url, "_blank", "noopener,noreferrer");
    };

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
            <div
                className='absolute inset-0 bg-black/50'
                onClick={onClose}
                aria-hidden='true'
            />
            <div className='relative w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 animate-slide-up'>
                <div className='flex items-center justify-between mb-4'>
                    <h2 className='text-lg font-semibold text-gray-900 dark:text-white'>
                        {t("doa.share_modal_title") ?? "Bagikan Doa"}
                    </h2>
                    <button
                        onClick={onClose}
                        className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1'
                        aria-label={t("common.close")}
                    >
                        <BsX size={20} />
                    </button>
                </div>

                <div className='space-y-3 text-sm text-gray-700 dark:text-gray-300 mb-4'>
                    <p className='font-medium text-gray-900 dark:text-white'>{title}</p>
                    {arabic && (
                        <p className='text-emerald-700 dark:text-emerald-400 text-right font-amiri text-lg leading-relaxed'>
                            {arabic}
                        </p>
                    )}
                    {latin && (
                        <p className='italic text-gray-600 dark:text-gray-400'>{latin}</p>
                    )}
                    <p>{desc}</p>
                </div>

                <div className='grid grid-cols-3 gap-3'>
                    <button
                        onClick={() =>
                            openShareWindow(
                                `https://wa.me/?text=${encodedText}`,
                            )
                        }
                        className='flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors'
                    >
                        <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 24 24'>
                            <path d='M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.472.099-.174.05-.369-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.369-.01-.543-.01-.185 0-.36.01-.533.01-.282 0-.556.099-.798.372-.243.273-.397.586-.44.843-.043.25-.068.372-.108.52-.039.135-.12.298-.21.472-.074.135-.32.297-.52.297-.38 0-.785-.342-1.173-.882-.38-.52-.63-1.04-.737-1.274-.107-.224-.23-.358-.38-.52-.173-.149-.387-.149-.735 0-.347.149-.656.397-.966.792-.307.397-.59.824-.75 1.032-.16.207-.27.314-.446.414-.197.087-.38.11-.577.07-.38-.05-.798-.103-1.22-.297-2.18-.984-3.448-2.174-3.642-2.374-.232-.232-.39-.232-.644 0-.107.073-.244.174-.387.174-.133 0-.307-.067-.46-.2-.149-.134-.206-.298-.206-.473 0-.174.068-.387.169-.52.075-.098.372-.298.798-.669 1.065-.87 1.33-1.298 1.33-1.653 0-.207-.074-.42-.149-.62-.099-.282-.347-.61-.644-.778-.273-.149-.574-.047-.843.135-.333.232-.75.61-1.22.93-.464.313-.843.487-1.078.487-.313 0-.685-.185-.89-.343-.232-.16-.32-.32-.32-.533 0-.233.074-.5.23-.718.173-.207.67-.53.966-.743.197-.149.35-.347.464-.566.098-.174.11-.372.11-.566 0-.38-.297-.785-.767-1.22-.38-.34-.844-.473-1.065-.52-.225-.048-.54-.098-.778-.098-.333 0-.586.098-.81.207-.135.087-.244.187-.32.273-.108.12-.15.243-.15.397 0 .197.05.408.149.606.098.198.296.433.59.824.232.313.53.655.916 1.164.397.38.743.75 1.04 1.11.313.372.566.71.766 1.02.21.313.35.573.447.863.073.207.098.414.098.62 0 .149-.037.297-.099.446-.05.135-.135.273-.232.413-.108.149-.255.297-.43.433-.174.134-.357.223-.56.26-.344.048-.813.148-1.297.37-.947.43-2.11.735-2.62.735-.58 0-1.133-.29-1.62-.735-.487-.446-.93-.917-1.307-1.414-.38-.49-.61-1.04-.736-1.362-.12-.307-.14-.655-.14-.935 0-.56.282-1.16.87-1.597.32-.232.75-.38 1.053-.437.32-.06.67-.09.97-.09.307 0 .654.02.93.09.273.067.52.16.778.273.207.087.427.197.633.298.21.1.38.185.53.25.149.067.347.05.52-.05.174-.09.397-.21.62-.39.224-.187.48-.38.735-.54.255-.149.53-.288.843-.433.208-.099.428-.15.644-.15.21 0 .427.05.644.149.173.1.357.223.53.343.232.133.428.288.62.472.134.134.25.28.333.44.087.149.14.32.14.52 0 .198-.04.398-.134.58-.098.185-.255.347-.472.487-.217.14-.473.232-.778.232-.313 0-.626-.08-.92-.24-.297-.15-.574-.32-.824-.52-.25-.2-.472-.433-.669-.71-.197-.273-.369-.566-.52-.875-.14-.297-.24-.59-.313-.89-.067-.297-.108-.62-.108-.94 0-.297.04-.587.12-.876.073-.297.2-.56.37-.81.173-.24.37-.464.6-.686.24-.232.49-.44.778-.62.29-.174.61-.32.93-.44.307-.11.62-.2.92-.273.313-.073.63-.135.95-.197.313-.06.615-.1.92-.12.197-.02.397-.02.597-.02.198 0 .397.02.597.06.21.04.408.12.597.22.188.09.368.19.54.3.173.107.32.23.45.36.12.12.223.255.307.413.087.15.14.32.174.5.03.173.03.357.03.53 0 .197-.01.397-.03.59-.02.187-.06.37-.1.54-.04.174-.1.34-.16.5-.06.149-.13.29-.22.433-.087.135-.188.26-.288.38-.107.134-.24.255-.39.36-.149.107-.32.2-.52.288-.207.087-.433.15-.68.15-.174 0-.369-.04-.57-.12-.207-.08-.38-.187-.52-.288-.134-.107-.255-.223-.36-.36-.107-.134-.2-.26-.29-.397-.087-.134-.16-.28-.22-.43-.06-.14-.11-.28-.15-.42-.04-.14-.07-.28-.09-.42-.02-.134-.03-.27-.03-.40 0-.134.01-.27.03-.4.02-.134.05-.26.1-.39.04-.134.1-.26.15-.39.05-.134.11-.26.16-.39.04-.13.09-.25.13-.37.04-.12.08-.24.12-.36.04-.12.08-.23.12-.34.04-.11.09-.21.13-.31.04-.1.09-.2.13-.3.04-.1.09-.19.13-.28.04-.09.09-.18.13-.27.04-.09.09-.17.13-.26.04-.09.09-.17.13-.25.04-.08.09-.16.13-.24.04-.08.09-.15.13-.23.04-.08.09-.15.13-.22.04-.07.09-.14.13-.21.04-.07.09-.13.13-.2.04-.07.09-.13.13-.19.04-.06.09-.12.13-.18.04-.06.09-.11.13-.17.04-.06.09-.1.13-.16.04-.05.09-.09.13-.14.04-.05.09-.08.13-.13.04-.05.09-.08.13-.12.04-.04.09-.07.13-.11.04-.04.09-.06.13-.1.04-.04.09-.06.13-.09.04-.03.09-.05.13-.08.04-.03.09-.04.13-.07.04-.03.09-.04.13-.06.04-.03.09-.03.13-.05.04-.02.09-.02.13-.04.04-.02.09-.02.13-.03.04-.02.09-.01.13-.02.04-.01.09 0 .13.01.04-.01.09-.01.04-.02.08-.02.04-.02.07-.02.04-.02.06-.02.04-.02.05-.02.04-.03.05-.03.04-.03.04-.03.04-.04.03-.04.03-.03.03-.04.02-.04.02-.03.02-.03.01-.03.01-.02.01-.02 0-.01.01-.01 0-.01 0-.01 0 0 0 0 0' />
                        </svg>
                        {t("common.whatsapp")}
                    </button>
                    <button
                        onClick={() =>
                            openShareWindow(
                                `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
                            )
                        }
                        className='flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors'
                    >
                        <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 24 24'>
                            <path d='M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' />
                        </svg>
                        {t("common.facebook")}
                    </button>
                    <button
                        onClick={copyShareText}
                        className='flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors'
                    >
                        <BsShare className='w-5 h-5' />
                        {copied ? t("common.copied") : t("common.copy")}
                    </button>
                </div>
            </div>
        </div>
    );
}