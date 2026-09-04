"use client";

import { useLocale } from "@/context/Locale";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BsPauseFill, BsPlayFill } from "react-icons/bs";
import { MdSpeed } from "react-icons/md";

const SPEED_KEY = "autoScrollSpeed";

const AutoScrollButton = () => {
    const { t } = useLocale();
    const pathname = usePathname();
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState(3);
    const [showPanel, setShowPanel] = useState(false);
    const [navBarVisible, setNavBarVisible] = useState(false);
    const [isCompactViewport, setIsCompactViewport] = useState(false);
    const [mobileControlsVisible, setMobileControlsVisible] = useState(false);

    const rafRef = useRef(null);
    const isPlayingRef = useRef(false);
    const speedRef = useRef(3);
    const userTouchingRef = useRef(false);
    const resumeTimeoutRef = useRef(null);
    const mobileControlsTimeoutRef = useRef(null);

    useEffect(() => {
        const media = window.matchMedia("(max-width: 767px)");
        const updateViewport = () => setIsCompactViewport(media.matches);
        updateViewport();
        media.addEventListener("change", updateViewport);
        return () => media.removeEventListener("change", updateViewport);
    }, []);

    // Load speed from localStorage on mount
    useEffect(() => {
        const saved = parseInt(localStorage.getItem(SPEED_KEY) ?? "3", 10);
        const valid = isNaN(saved) ? 3 : Math.min(10, Math.max(1, saved));
        setSpeed(valid);
        speedRef.current = valid;
    }, []);

    // Keep refs in sync with state
    useEffect(() => {
        isPlayingRef.current = isPlaying;
    }, [isPlaying]);

    useEffect(() => {
        speedRef.current = speed;
        localStorage.setItem(SPEED_KEY, String(speed));
    }, [speed]);

    // requestAnimationFrame scroll loop
    useEffect(() => {
        if (!isPlaying) {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            return;
        }

        const tick = () => {
            if (!isPlayingRef.current) return;
            if (!userTouchingRef.current) {
                const px = speedRef.current * 0.5;
                window.scrollBy(0, px);
                // Auto-stop when reaching the bottom
                const nearBottom =
                    window.innerHeight + window.scrollY >=
                    document.documentElement.scrollHeight - 4;
                if (nearBottom) {
                    setIsPlaying(false);
                    return;
                }
            }
            rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [isPlaying]);

    // Pause on manual wheel / touch scroll, resume after idle
    useEffect(() => {
        const pause = () => {
            userTouchingRef.current = true;
            clearTimeout(resumeTimeoutRef.current);
            resumeTimeoutRef.current = setTimeout(() => {
                userTouchingRef.current = false;
            }, 1200);
        };

        window.addEventListener("wheel", pause, { passive: true });
        window.addEventListener("touchmove", pause, { passive: true });
        return () => {
            window.removeEventListener("wheel", pause);
            window.removeEventListener("touchmove", pause);
            clearTimeout(resumeTimeoutRef.current);
        };
    }, []);

    // Track scroll activity so mobile controls only appear while useful.
    useEffect(() => {
        let tid;
        const handler = () => {
            setNavBarVisible(true);
            setMobileControlsVisible(true);
            clearTimeout(tid);
            clearTimeout(mobileControlsTimeoutRef.current);
            tid = setTimeout(() => setNavBarVisible(false), 2000);
            mobileControlsTimeoutRef.current = setTimeout(() => {
                if (!isPlayingRef.current) setMobileControlsVisible(false);
            }, 2200);
        };
        window.addEventListener("scroll", handler);
        document.addEventListener("scroll", handler, true);
        window.addEventListener("touchmove", handler, { passive: true });
        return () => {
            window.removeEventListener("scroll", handler);
            document.removeEventListener("scroll", handler, true);
            window.removeEventListener("touchmove", handler);
            clearTimeout(tid);
            clearTimeout(mobileControlsTimeoutRef.current);
        };
    }, []);

    // Close panel on outside click
    useEffect(() => {
        if (!showPanel) return;
        const handler = (e) => {
            if (!e.target.closest("#auto-scroll-panel")) setShowPanel(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [showPanel]);

    const toggle = () => {
        const next = !isPlaying;
        setIsPlaying(next);
        if (next) {
            setMobileControlsVisible(true);
            setShowPanel(true);
        } else if (isCompactViewport) {
            clearTimeout(mobileControlsTimeoutRef.current);
            mobileControlsTimeoutRef.current = setTimeout(
                () => setMobileControlsVisible(false),
                1200,
            );
        }
    };
    const isDashboard = pathname?.startsWith("/dashboard");
    const bottomClass = isDashboard
        ? navBarVisible
            ? "bottom-[84px] md:bottom-[52px]"
            : "bottom-[72px] md:bottom-2"
        : navBarVisible
          ? "bottom-[52px]"
          : "bottom-2";
    const shouldShowMobileControls =
        !isCompactViewport || mobileControlsVisible || isPlaying || showPanel;
    const visibilityClass = shouldShowMobileControls
        ? "translate-y-0 opacity-100 pointer-events-auto"
        : "translate-y-2 opacity-0 pointer-events-none";

    return (
        <div
            id='auto-scroll-panel'
            className={`fixed left-2 z-10 transition-all duration-200 ${bottomClass} ${visibilityClass}`}
        >
            {showPanel && (
                <div className='absolute left-0 bottom-16 bg-white dark:bg-slate-800 border border-emerald-100 dark:border-slate-700 rounded-xl w-52 p-3 shadow-lg text-sm text-emerald-900 dark:text-emerald-300 dark:text-white mb-1'>
                    <div className='flex items-center gap-1.5 mb-3'>
                        <MdSpeed size={14} className='text-gray-400' />
                        <p className='font-semibold text-xs text-gray-500 dark:text-gray-300 dark:text-gray-400 uppercase tracking-wide'>
                            {t("auto_scroll.speed")}
                        </p>
                    </div>
                    <input
                        type='range'
                        min={1}
                        max={10}
                        value={speed}
                        onChange={(e) => setSpeed(parseInt(e.target.value, 10))}
                        className='w-full accent-emerald-600 cursor-pointer'
                    />
                    <div className='flex justify-between text-xs text-gray-400 mt-1'>
                        <span>{t("auto_scroll.slow")}</span>
                        <span className='font-medium text-emerald-600 dark:text-emerald-400'>
                            {speed}
                        </span>
                        <span>{t("auto_scroll.fast")}</span>
                    </div>
                    {isPlaying && (
                        <p className='text-center text-xs text-emerald-600 dark:text-emerald-400 mt-2 animate-pulse'>
                            ● {t("auto_scroll.running")}
                        </p>
                    )}
                    <button
                        type='button'
                        title={
                            isPlaying
                                ? t("auto_scroll.pause")
                                : t("auto_scroll.start")
                        }
                        onClick={toggle}
                        className={`mt-3 flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold shadow-sm transition-colors ${
                            isPlaying
                                ? "bg-emerald-600 text-white hover:bg-emerald-500"
                                : "bg-slate-800 text-white hover:opacity-90 dark:bg-slate-200 dark:text-black"
                        }`}
                    >
                        {isPlaying ? (
                            <BsPauseFill size={18} />
                        ) : (
                            <BsPlayFill size={18} />
                        )}
                        {isPlaying
                            ? t("auto_scroll.pause")
                            : t("auto_scroll.start")}
                    </button>
                </div>
            )}

            <div className='flex items-center gap-2'>
                <button
                    title={t("auto_scroll.speed_settings")}
                    onClick={() => setShowPanel((p) => !p)}
                    className={`rounded-full p-2.5 shadow transition-colors hover:opacity-90 ${
                        isPlaying
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-800 text-white dark:bg-slate-200 dark:text-black"
                    }`}
                >
                    <MdSpeed size={18} />
                </button>
            </div>
        </div>
    );
};

export default AutoScrollButton;
