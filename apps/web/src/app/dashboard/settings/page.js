"use client";

import { useRef } from "react";
import { useLocale } from "@/context/Locale";
import { ADZAN_SOUNDS, useSettings } from "@/lib/useSettings";
import { useLayoutMode } from "@/lib/useLayoutMode";
import SettingRow from "./_components/SettingRow";
import { toast } from "react-hot-toast";

export default function SettingsPage() {
    const { t, lang, setLang } = useLocale();
    const { settings, updateSetting, syncWithBackend } = useSettings();
    const { isWide } = useLayoutMode();
    const previewAudioRef = useRef(null);

    const handleAdzanToggle = async (e) => {
        const next = e.target.checked;
        if (
            next &&
            typeof window !== "undefined" &&
            typeof Notification !== "undefined" &&
            Notification.permission === "default"
        ) {
            const perm = await Notification.requestPermission();
            if (perm !== "granted") {
                toast.error(t("settings.notif_denied"));
                return;
            }
        } else if (
            next &&
            typeof Notification !== "undefined" &&
            Notification.permission === "denied"
        ) {
            toast.error(t("settings.notif_denied"));
            return;
        }
        updateSetting("notifAdzan", next);
    };

    const playAdzanPreview = () => {
        const sound =
            ADZAN_SOUNDS.find((s) => s.value === settings.adzanSound) ||
            ADZAN_SOUNDS[0];
        if (!sound) return;
        try {
            previewAudioRef.current?.pause();
        } catch {}
        const audio = new Audio(sound.src);
        previewAudioRef.current = audio;
        audio.play().catch(() => toast.error(t("settings.sound_blocked")));
    };

    const handleThemeChange = (val) => {
        updateSetting("theme", val);
        if (
            val === "dark" ||
            (val === "system" &&
                window.matchMedia("(prefers-color-scheme: dark)").matches)
        ) {
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "dark");
        } else {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("theme", "light");
        }
    };

    const handleSync = async () => {
        try {
            await syncWithBackend();
            toast.success(t("profile.update_success") || "Tersimpan");
        } catch (e) {
            toast.error(t("profile.update_error") || "Gagal");
        }
    };

    return (
        <div className={isWide ? "px-4 py-6" : "px-4 py-6 max-w-md mx-auto"}>
            <h1 className='text-xl font-bold text-gray-900 dark:text-white mb-6'>
                {t("settings.title")}
            </h1>

            <div className='space-y-6'>
                {/* Tampilan */}
                <section className='bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5'>
                    <h2 className='text-sm font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-wider'>
                        Tampilan & Aksesibilitas
                    </h2>
                    <SettingRow label={t("settings.theme")}>
                        <select
                            value={settings.theme}
                            onChange={(e) => handleThemeChange(e.target.value)}
                            className='bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-sm text-gray-900 dark:text-white rounded-lg px-3 py-1.5 focus:ring-emerald-500'
                        >
                            <option value='system'>
                                {t("settings.theme_system")}
                            </option>
                            <option value='light'>
                                {t("settings.theme_light")}
                            </option>
                            <option value='dark'>
                                {t("settings.theme_dark")}
                            </option>
                        </select>
                    </SettingRow>
                    <SettingRow label={t("settings.lang")}>
                        <select
                            value={lang}
                            onChange={(e) => {
                                setLang(e.target.value);
                                updateSetting("lang", e.target.value);
                            }}
                            className='bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-sm text-gray-900 dark:text-white rounded-lg px-3 py-1.5 focus:ring-emerald-500'
                        >
                            <option value='ID'>{t("settings.lang_id")}</option>
                            <option value='EN'>{t("settings.lang_en")}</option>
                        </select>
                    </SettingRow>
                </section>

                {/* Bacaan */}
                <section className='bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5'>
                    <h2 className='text-sm font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-wider'>
                        Preferensi Bacaan
                    </h2>
                    <SettingRow label={t("settings.quran_font")}>
                        <select
                            value={settings.quranFont}
                            onChange={(e) =>
                                updateSetting("quranFont", e.target.value)
                            }
                            className='bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-sm text-gray-900 dark:text-white rounded-lg px-3 py-1.5 focus:ring-emerald-500'
                        >
                            <option value='LPMQ'>LPMQ Isep Misbah</option>
                            <option value='Amiri'>Amiri Quran</option>
                            <option value='Scheherazade'>Scheherazade</option>
                        </select>
                    </SettingRow>
                    <SettingRow label={t("settings.reader_size")}>
                        <input
                            type='range'
                            min='16'
                            max='48'
                            step='2'
                            value={settings.readerSize}
                            onChange={(e) =>
                                updateSetting(
                                    "readerSize",
                                    Number(e.target.value),
                                )
                            }
                            className='w-32 accent-emerald-600'
                        />
                        <span className='ml-2 text-xs text-gray-500 dark:text-gray-300 w-8'>
                            {settings.readerSize}px
                        </span>
                    </SettingRow>
                </section>

                {/* Notifikasi */}
                <section className='bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5'>
                    <h2 className='text-sm font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-wider'>
                        Notifikasi
                    </h2>
                    <SettingRow label={t("settings.notif_adzan")}>
                        <input
                            type='checkbox'
                            checked={settings.notifAdzan}
                            onChange={handleAdzanToggle}
                            className='w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500 dark:focus:ring-emerald-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600'
                        />
                    </SettingRow>
                    <SettingRow label={t("settings.adzan_sound")}>
                        <div className='flex items-center gap-2'>
                            <select
                                value={settings.adzanSound}
                                onChange={(e) =>
                                    updateSetting("adzanSound", e.target.value)
                                }
                                className='bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-sm text-gray-900 dark:text-white rounded-lg px-3 py-1.5 focus:ring-emerald-500'
                            >
                                {ADZAN_SOUNDS.map((s) => (
                                    <option key={s.value} value={s.value}>
                                        {s.label}
                                    </option>
                                ))}
                            </select>
                            <button
                                type='button'
                                onClick={playAdzanPreview}
                                className='px-2.5 py-1.5 text-xs rounded-lg border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'
                            >
                                {t("settings.test_sound")}
                            </button>
                        </div>
                    </SettingRow>
                    <SettingRow label={t("settings.notif_kajian")}>
                        <input
                            type='checkbox'
                            checked={settings.notifKajian}
                            onChange={(e) =>
                                updateSetting("notifKajian", e.target.checked)
                            }
                            className='w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500 dark:focus:ring-emerald-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600'
                        />
                    </SettingRow>
                </section>

                <div className='flex justify-end'>
                    <button
                        onClick={handleSync}
                        className='px-6 py-2.5 bg-emerald-700 text-white rounded-xl text-sm font-medium hover:bg-emerald-800 transition-colors shadow-sm'
                    >
                        {t("settings.save")}
                    </button>
                </div>
            </div>
        </div>
    );
}
