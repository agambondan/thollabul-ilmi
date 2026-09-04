"use client";

import { useLocale } from "@/context/Locale";
import { useEffect, useState } from "react";

export default function PwaInstallNotice() {
    const { t } = useLocale();
    const [prompt, setPrompt] = useState(null);
    const [hidden, setHidden] = useState(
        () =>
            typeof window !== "undefined" &&
            (window.matchMedia?.("(display-mode: standalone)")?.matches ||
                window.navigator.standalone),
    );

    useEffect(() => {
        if (hidden) return;

        const handler = (event) => {
            event.preventDefault();
            setPrompt(event);
        };

        window.addEventListener("beforeinstallprompt", handler);
        return () => window.removeEventListener("beforeinstallprompt", handler);
    }, [hidden]);

    // Without a captured beforeinstallprompt there is nothing to offer: the
    // card used to render on iOS Safari and desktop Firefox showing
    // Android-only instructions and no button at all.
    if (hidden || !prompt) return null;

    const install = async () => {
        if (!prompt) return;
        prompt.prompt();
        await prompt.userChoice;
        setPrompt(null);
        setHidden(true);
    };

    return (
        <div className='mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:text-emerald-300 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200'>
            <p className='font-semibold'>{t("pwa.install_title")}</p>
            <p className='mt-1 text-xs text-emerald-700 dark:text-emerald-400 dark:text-emerald-300'>
                {t("pwa.install_android")}
            </p>
            {prompt && (
                <button
                    type='button'
                    onClick={install}
                    className='mt-3 w-full rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-600'
                >
                    {t("pwa.install_now")}
                </button>
            )}
        </div>
    );
}
