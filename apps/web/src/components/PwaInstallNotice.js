"use client";

import { useLocale } from "@/context/Locale";
import Image from "next/image";
import { useEffect, useState } from "react";
import { BsDownload, BsX } from "react-icons/bs";

const DISMISS_KEY = "tholabul_pwa_prompt_dismissed";
const DISMISS_TTL_MS = 14 * 24 * 60 * 60 * 1000;

const isDismissed = () => {
    if (typeof window === "undefined") return false;
    const value = Number(localStorage.getItem(DISMISS_KEY));
    return Number.isFinite(value) && Date.now() - value < DISMISS_TTL_MS;
};

const isMobileDevice = () => {
    if (typeof window === "undefined") return false;
    const ua = window.navigator.userAgent || "";
    return /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
        ua,
    );
};

const isIosDevice = () => {
    if (typeof window === "undefined") return false;
    const ua = window.navigator.userAgent || "";
    return (
        /iPad|iPhone|iPod/.test(ua) ||
        (window.navigator.platform === "MacIntel" &&
            window.navigator.maxTouchPoints > 1)
    );
};

export default function PwaInstallNotice() {
    const { t } = useLocale();
    const [prompt, setPrompt] = useState(null);
    const [isIos, setIsIos] = useState(false);
    const [showGuide, setShowGuide] = useState(false);
    const [hidden, setHidden] = useState(true);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const isStandalone =
            window.matchMedia?.("(display-mode: standalone)")?.matches ||
            window.navigator.standalone === true;

        if (isStandalone || isDismissed()) return;
        if (!isMobileDevice()) return;

        setIsIos(isIosDevice());
        setHidden(false);

        const handler = (event) => {
            event.preventDefault();
            setPrompt(event);
        };

        window.addEventListener("beforeinstallprompt", handler);
        return () =>
            window.removeEventListener("beforeinstallprompt", handler);
    }, []);

    const dismiss = () => {
        localStorage.setItem(DISMISS_KEY, String(Date.now()));
        setHidden(true);
    };

    const handleInstall = async () => {
        if (prompt) {
            prompt.prompt();
            const choice = await prompt.userChoice;
            if (choice?.outcome === "accepted") {
                setHidden(true);
            } else {
                dismiss();
            }
            return;
        }

        setShowGuide((prev) => !prev);
    };

    if (hidden) return null;

    const guideText = isIos
        ? t("pwa.install_ios")
        : t("pwa.install_android");

    return (
        <aside
            role='region'
            aria-label={t("pwa.install_title")}
            className='fixed inset-x-3 bottom-20 z-[44] mx-auto max-w-md rounded-2xl border border-emerald-200 bg-white/95 p-3.5 shadow-xl shadow-emerald-950/10 backdrop-blur transition-all md:hidden dark:border-emerald-800/80 dark:bg-slate-900/95'
        >
            <div className='flex items-center gap-3'>
                <Image
                    src='/icon-192.png'
                    alt="Thullaabul 'Ilmi"
                    width={40}
                    height={40}
                    className='rounded-xl border border-emerald-100 dark:border-emerald-800'
                />
                <div className='min-w-0 flex-1'>
                    <p className='truncate text-xs font-bold text-slate-900 dark:text-slate-100'>
                        {t("pwa.install_title")}
                    </p>
                    <p className='truncate text-[11px] text-slate-500 dark:text-slate-400'>
                        {t("pwa.install_desc")}
                    </p>
                </div>
                <div className='flex items-center gap-1'>
                    <button
                        type='button'
                        onClick={handleInstall}
                        className='inline-flex items-center gap-1 rounded-xl bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-800 active:scale-95'
                    >
                        <BsDownload className='text-xs' />
                        <span>{t("pwa.install_now")}</span>
                    </button>
                    <button
                        type='button'
                        onClick={dismiss}
                        className='rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300'
                        aria-label='Tutup'
                    >
                        <BsX className='text-lg' />
                    </button>
                </div>
            </div>

            {showGuide && (
                <div className='mt-2.5 rounded-xl border border-emerald-100 bg-emerald-50/80 p-2.5 text-[11px] leading-relaxed text-emerald-900 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-200'>
                    {guideText}
                </div>
            )}
        </aside>
    );
}
