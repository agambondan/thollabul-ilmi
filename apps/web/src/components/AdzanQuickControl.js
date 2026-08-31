"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { adzanSoundApi, uploadWithProgress } from "@/lib/api";
import { ADZAN_SOUNDS, useSettings } from "@/lib/useSettings";

export default function AdzanQuickControl({
    i18n = {},
    maxCustom = 3,
    compact = false,
}) {
    const { settings, updateSetting } = useSettings();
    const t = (key, fallback) => {
        if (i18n[key] !== undefined) return i18n[key];
        return fallback;
    };
    const [customSounds, setCustomSounds] = useState([]);
    const [uploading, setUploading] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [notifChecked, setNotifChecked] = useState(
        typeof window !== "undefined" &&
            typeof Notification !== "undefined" &&
            Notification.permission === "granted",
    );
    const audioRef = useRef(null);

    const adzanOptions = useMemo(
        () => [
            ...ADZAN_SOUNDS,
            ...customSounds.map((s) => ({
                value: `custom:${s.id}`,
                label: s.name,
                src: s.url,
                custom: true,
                id: s.id,
            })),
        ],
        [customSounds],
    );
    const selected =
        adzanOptions.find((s) => s.value === settings.adzanSound) ||
        adzanOptions[0];

    const loadCustom = () => {
        let mounted = true;
        adzanSoundApi
            .list()
            .then(async (res) => {
                if (!res.ok || !mounted) return;
                const data = await res.json();
                setCustomSounds(data?.data ?? data ?? []);
            })
            .catch(() => {});
        return () => {
            mounted = false;
        };
    };

    useEffect(() => {
        const cleanup = loadCustom();
        return cleanup;
    }, []);

    const selectAdzan = (value) => {
        const next = adzanOptions.find((s) => s.value === value);
        if (!next) return;
        updateSetting("adzanSound", next.value);
        updateSetting("adzanSoundUrl", next.src);
        updateSetting("adzanSoundLabel", next.label);
    };

    const toggleNotif = async (next) => {
        if (next) {
            if (
                typeof window === "undefined" ||
                typeof Notification === "undefined"
            ) {
                updateSetting("notifAdzan", true);
                return;
            }
            if (Notification.permission === "default") {
                const perm = await Notification.requestPermission();
                if (perm !== "granted") {
                    setNotifChecked(false);
                    return;
                }
                setNotifChecked(true);
            } else if (Notification.permission === "denied") {
                setNotifChecked(false);
                return;
            } else {
                setNotifChecked(true);
            }
        }
        updateSetting("notifAdzan", next);
    };

    const stop = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current = null;
        }
        setIsPlaying(false);
    };

    const play = () => {
        if (!selected || !selected.src) return;
        if (isPlaying) {
            stop();
            return;
        }
        try {
            const a = new Audio(selected.src);
            audioRef.current = a;
            setIsPlaying(true);
            a.onended = () => setIsPlaying(false);
            a.onerror = () => setIsPlaying(false);
            const p = a.play();
            if (p && p.catch) {
                p.catch(() => setIsPlaying(false));
            }
        } catch {
            setIsPlaying(false);
        }
    };

    const onUpload = (e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        if (customSounds.length >= maxCustom) return;
        const fd = new FormData();
        fd.append("file", file);
        fd.append("name", file.name.replace(/\.[^.]+$/, ""));
        setUploading(1);
        uploadWithProgress("/api/v1/adzan-sounds", fd, (p) => setUploading(p))
            .then(async (res) => {
                setUploading(0);
                if (!res.ok) return;
                const data = await res.json();
                const sound = data?.data ?? data;
                await loadCustom()();
                selectAdzan(`custom:${sound.id}`);
            })
            .catch(() => setUploading(0));
    };

    const remove = async (sound) => {
        await adzanSoundApi.remove(sound.id);
        await loadCustom()();
        if (settings.adzanSound === `custom:${sound.id}`)
            selectAdzan(ADZAN_SOUNDS[0].value);
    };

    return (
        <div
            className={`rounded-2xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 ${compact ? "p-3" : "p-4"}`}
        >
            <div className='flex items-center justify-between gap-2 flex-wrap'>
                <p
                    className={`font-semibold text-gray-800 dark:text-white ${compact ? "text-sm" : "text-sm"}`}
                >
                    🔊 {t("adzan.quick_title", "Pengaturan Suara Adzan")}
                </p>
                <label className='inline-flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300'>
                    <input
                        type='checkbox'
                        checked={!!settings.notifAdzan}
                        onChange={(e) => toggleNotif(e.target.checked)}
                        className='w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500'
                    />
                    {t(
                        "adzan.quick_active",
                        settings.notifAdzan
                            ? "Aktif saat masuk waktu"
                            : "Non-aktif",
                    )}
                </label>
            </div>

            <div className='mt-3 flex flex-wrap items-center gap-2'>
                <select
                    value={settings.adzanSound || ADZAN_SOUNDS[0].value}
                    onChange={(e) => selectAdzan(e.target.value)}
                    className='flex-1 min-w-[180px] bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-sm text-gray-900 dark:text-white rounded-lg px-3 py-1.5 focus:ring-emerald-500'
                >
                    {adzanOptions.map((s) => (
                        <option key={s.value} value={s.value}>
                            {s.label}
                        </option>
                    ))}
                </select>
                <button
                    type='button'
                    onClick={play}
                    className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                        isPlaying
                            ? "border-amber-500 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-semibold"
                            : "border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                    }`}
                >
                    {isPlaying
                        ? t("adzan.quick_stop", "Stop")
                        : t("adzan.quick_test", "Tes")}
                </button>
                <label
                    className={`px-3 py-1.5 text-xs rounded-lg border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 cursor-pointer ${
                        uploading > 0 || customSounds.length >= maxCustom
                            ? "opacity-50 pointer-events-none"
                            : ""
                    }`}
                >
                    {uploading > 0
                        ? `${uploading}%`
                        : t("adzan.quick_upload", "Upload")}
                    <input
                        type='file'
                        accept='audio/*'
                        className='hidden'
                        onChange={onUpload}
                        disabled={uploading > 0}
                    />
                </label>
            </div>

            {uploading > 0 && (
                <div className='mt-2 w-full bg-gray-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden'>
                    <div
                        className='bg-emerald-600 h-1.5 rounded-full transition-all duration-200'
                        style={{ width: `${uploading}%` }}
                    />
                </div>
            )}

            {customSounds.length > 0 && (
                <ul className='mt-2 space-y-1'>
                    {customSounds.map((s) => (
                        <li
                            key={s.id}
                            className='flex items-center justify-between text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-slate-700/40 rounded-lg px-2.5 py-1.5'
                        >
                            <span className='truncate'>{s.name}</span>
                            <button
                                type='button'
                                onClick={() => remove(s)}
                                className='text-red-600 dark:text-red-400 hover:underline'
                            >
                                {t("adzan.quick_delete", "Hapus")}
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            <p className='mt-2 text-[11px] text-gray-400'>
                {t(
                    "adzan.quick_limit",
                    `Maks. ${maxCustom} upload adzan per pengguna (${customSounds.length}/${maxCustom})`,
                )}
            </p>
        </div>
    );
}
