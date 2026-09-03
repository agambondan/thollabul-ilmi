"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "@/context/Locale";
import { adzanSoundApi, uploadWithProgress } from "@/lib/api";
import { ADZAN_SOUNDS, useSettings } from "@/lib/useSettings";
import { PRAYER_MADHABS, PRAYER_METHODS } from "@/lib/prayerTimes";
import { useTheme } from "@/lib/useTheme";
import { QURAN_FONTS, useQuranFont } from "@/lib/useQuranFont";
import { useLayoutMode } from "@/lib/useLayoutMode";
import SettingRow from "./_components/SettingRow";
import { toast } from "react-hot-toast";

const REMINDER_LEAD_OPTIONS = [0, 5, 10, 15, 30];
const PRAYER_REMINDER_ROWS = [
    ["fajr", "prayer.fajr"],
    ["dhuhr", "prayer.dhuhr"],
    ["asr", "prayer.asr"],
    ["maghrib", "prayer.maghrib"],
    ["isha", "prayer.isha"],
];

export default function SettingsPage() {
    const { t, lang, setLang } = useLocale();
    const { settings, updateSetting, syncWithBackend } = useSettings();
    const { setTheme } = useTheme();
    const {
        arabicFontSize,
        fontId,
        setArabicFontSize,
        setFont,
        setTranslationFontSize,
        translationFontSize,
    } = useQuranFont();
    const { isWide } = useLayoutMode();
    const previewAudioRef = useRef(null);
    const [customSounds, setCustomSounds] = useState([]);
    const [uploadName, setUploadName] = useState("");
    const [uploadProgress, setUploadProgress] = useState(0);

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
    const selectedAdzan =
        adzanOptions.find((s) => s.value === settings.adzanSound) ||
        adzanOptions[0];

    const loadAdzanSounds = async () => {
        const res = await adzanSoundApi.list();
        if (!res.ok) return;
        const data = await res.json();
        setCustomSounds(data?.data ?? data ?? []);
    };

    useEffect(() => {
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
    }, []);

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

    const [isPlayingPreview, setIsPlayingPreview] = useState(false);

    const updateAdzanReminderLead = (value) =>
        updateSetting("adzanReminderLead", Number(value));

    const updateAdzanReminderLeadForPrayer = (key, value) => {
        const next = { ...(settings.adzanReminderLeadByPrayer || {}) };
        if (value === "global") delete next[key];
        else next[key] = Number(value);
        updateSetting("adzanReminderLeadByPrayer", next);
    };

    const updateAdzanSound = (sound) => {
        updateSetting("adzanSound", sound.value);
        updateSetting("adzanSoundUrl", sound.src);
        updateSetting("adzanSoundLabel", sound.label);
    };

    const stopAdzanPreview = () => {
        if (previewAudioRef.current) {
            previewAudioRef.current.pause();
            previewAudioRef.current.currentTime = 0;
            previewAudioRef.current = null;
        }
        setIsPlayingPreview(false);
    };

    const playAdzanPreview = () => {
        if (!selectedAdzan || !selectedAdzan.src) {
            toast.error("Sumber audio tidak valid");
            return;
        }

        if (isPlayingPreview) {
            stopAdzanPreview();
            return;
        }

        try {
            if (previewAudioRef.current) {
                previewAudioRef.current.pause();
            }
            const audio = new Audio(selectedAdzan.src);
            previewAudioRef.current = audio;
            setIsPlayingPreview(true);

            audio.onended = () => {
                setIsPlayingPreview(false);
            };

            audio.onerror = (e) => {
                setIsPlayingPreview(false);
                toast.error("Gagal memutar audio (URL tidak dapat diakses)");
            };

            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch((err) => {
                    setIsPlayingPreview(false);
                    if (err.name === "NotAllowedError") {
                        toast.error(t("settings.sound_blocked"));
                    } else {
                        toast.error(
                            `Error: ${err.message || "Gagal memutar audio"}`,
                        );
                    }
                });
            }
        } catch (err) {
            setIsPlayingPreview(false);
            toast.error("Audio player error");
        }
    };

    const handleAdzanUpload = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        const formData = new FormData();
        formData.append("file", file);
        formData.append(
            "name",
            uploadName || file.name.replace(/\.[^.]+$/, ""),
        );
        setUploadProgress(1);
        try {
            const res = await uploadWithProgress(
                "/api/v1/adzan-sounds",
                formData,
                (percent) => setUploadProgress(percent),
            );
            setUploadProgress(0);
            if (!res.ok) {
                let msg = t("settings.upload_adzan_limit");
                try {
                    const err = await res.json();
                    msg = err?.message || err?.error || msg;
                } catch {}
                toast.error(msg);
                return;
            }
            const data = await res.json();
            const sound = data?.data ?? data;
            await loadAdzanSounds();
            updateAdzanSound({
                value: `custom:${sound.id}`,
                label: sound.name,
                src: sound.url,
            });
            setUploadName("");
            toast.success(t("settings.upload_adzan_success"));
        } catch (err) {
            setUploadProgress(0);
            toast.error("Upload gagal. Periksa koneksi internet.");
        }
    };

    const deleteAdzanSound = async (sound) => {
        const res = await adzanSoundApi.remove(sound.id);
        if (!res.ok) return;
        await loadAdzanSounds();
        if (settings.adzanSound === `custom:${sound.id}`)
            updateAdzanSound(ADZAN_SOUNDS[0]);
    };

    const handleThemeChange = (val) => {
        updateSetting("theme", val);
        const prefersDark =
            typeof window !== "undefined" &&
            window.matchMedia("(prefers-color-scheme: dark)").matches;
        setTheme(val === "dark" || (val === "system" && prefersDark));
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
                        {t("settings.section_appearance")}
                    </h2>
                    <SettingRow label={t("settings.theme")}>
                        <select
                            value={settings.theme}
                            onChange={(e) => handleThemeChange(e.target.value)}
                            className='w-full sm:w-auto sm:min-w-[10rem] bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-sm text-gray-900 dark:text-white rounded-lg px-3 py-1.5 focus:ring-emerald-500'
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
                            className='w-full sm:w-auto sm:min-w-[10rem] bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-sm text-gray-900 dark:text-white rounded-lg px-3 py-1.5 focus:ring-emerald-500'
                        >
                            <option value='ID'>{t("settings.lang_id")}</option>
                            <option value='EN'>{t("settings.lang_en")}</option>
                        </select>
                    </SettingRow>
                </section>

                {/* Bacaan */}
                <section className='bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5'>
                    <h2 className='text-sm font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-wider'>
                        {t("settings.section_reading")}
                    </h2>
                    {/*
                     * These write through useQuranFont, which every reader
                     * reads from — the options here used to be a separate,
                     * inert set that named faces the readers do not offer.
                     */}
                    <SettingRow label={t("settings.quran_font")}>
                        <select
                            value={fontId}
                            onChange={(e) => setFont(e.target.value)}
                            className='w-full sm:w-auto sm:min-w-[10rem] bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-sm text-gray-900 dark:text-white rounded-lg px-3 py-1.5 focus:ring-emerald-500'
                        >
                            {QURAN_FONTS.map((font) => (
                                <option key={font.id} value={font.id}>
                                    {font.label}
                                </option>
                            ))}
                        </select>
                    </SettingRow>
                    <SettingRow label={t("settings.reader_size")}>
                        <div className='flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto'>
                            <input
                                type='range'
                                min='14'
                                max='64'
                                step='2'
                                value={arabicFontSize}
                                onChange={(e) =>
                                    setArabicFontSize(Number(e.target.value))
                                }
                                className='flex-1 sm:w-32 accent-emerald-600'
                            />
                            <span className='w-10 text-right sm:text-left text-xs text-gray-500 dark:text-gray-300'>
                                {arabicFontSize}px
                            </span>
                        </div>
                    </SettingRow>
                    <SettingRow label={t("settings.translation_size")}>
                        <div className='flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto'>
                            <input
                                type='range'
                                min='12'
                                max='28'
                                step='2'
                                value={translationFontSize}
                                onChange={(e) =>
                                    setTranslationFontSize(Number(e.target.value))
                                }
                                className='flex-1 sm:w-32 accent-emerald-600'
                            />
                            <span className='w-10 text-right sm:text-left text-xs text-gray-500 dark:text-gray-300'>
                                {translationFontSize}px
                            </span>
                        </div>
                    </SettingRow>
                    <SettingRow label={t("settings.high_contrast")}>
                        <input
                            type='checkbox'
                            checked={!!settings.highContrast}
                            onChange={(e) =>
                                updateSetting("highContrast", e.target.checked)
                            }
                            className='w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500 dark:bg-gray-700 dark:border-gray-600'
                        />
                    </SettingRow>
                    <SettingRow label={t("settings.reduce_motion")}>
                        <input
                            type='checkbox'
                            checked={!!settings.reduceMotion}
                            onChange={(e) =>
                                updateSetting("reduceMotion", e.target.checked)
                            }
                            className='w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500 dark:bg-gray-700 dark:border-gray-600'
                        />
                    </SettingRow>
                </section>

                {/* Waktu Sholat */}
                <section className='bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5'>
                    <h2 className='text-sm font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-wider'>
                        {t("settings.section_prayer")}
                    </h2>
                    <SettingRow label={t("prayer_schedule.method")}>
                        <select
                            value={settings.prayerMethod}
                            onChange={(e) =>
                                updateSetting("prayerMethod", e.target.value)
                            }
                            className='w-full sm:w-auto sm:min-w-[12rem] bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-sm text-gray-900 dark:text-white rounded-lg px-3 py-1.5 focus:ring-emerald-500'
                        >
                            {PRAYER_METHODS.map((m) => (
                                <option key={m.value} value={m.value}>
                                    {m.label}
                                </option>
                            ))}
                        </select>
                    </SettingRow>
                    <SettingRow label={t("prayer_schedule.madhab")}>
                        <select
                            value={settings.prayerMadhab}
                            onChange={(e) =>
                                updateSetting("prayerMadhab", e.target.value)
                            }
                            className='w-full sm:w-auto sm:min-w-[12rem] bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-sm text-gray-900 dark:text-white rounded-lg px-3 py-1.5 focus:ring-emerald-500'
                        >
                            {PRAYER_MADHABS.map((m) => (
                                <option key={m.value} value={m.value}>
                                    {t(m.labelKey)}
                                </option>
                            ))}
                        </select>
                    </SettingRow>
                    <p className='mt-2 text-xs text-gray-400'>
                        {t("settings.prayer_scope")}
                    </p>
                </section>

                {/* Notifikasi */}
                <section className='bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5'>
                    <h2 className='text-sm font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-wider'>
                        {t("settings.section_notifications")}
                    </h2>
                    <SettingRow label={t("settings.notif_adzan")}>
                        <input
                            type='checkbox'
                            checked={settings.notifAdzan}
                            onChange={handleAdzanToggle}
                            className='w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500 dark:focus:ring-emerald-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600'
                        />
                    </SettingRow>
                    <SettingRow label={t("settings.adzan_reminder_lead")}>
                        <select
                            value={settings.adzanReminderLead ?? 10}
                            onChange={(e) =>
                                updateAdzanReminderLead(e.target.value)
                            }
                            className='w-full sm:w-auto sm:min-w-[12rem] bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-sm text-gray-900 dark:text-white rounded-lg px-3 py-1.5 focus:ring-emerald-500'
                            aria-label={t("prayer.reminder_lead")}
                        >
                            {REMINDER_LEAD_OPTIONS.map((m) => (
                                <option key={m} value={m}>
                                    {m === 0
                                        ? t("settings.adzan_at_time")
                                        : `${m} ${t("settings.minutes_before")}`}
                                </option>
                            ))}
                        </select>
                    </SettingRow>
                    <SettingRow label={t("settings.adzan_reminder_per_prayer")}>
                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-2 w-full'>
                            {PRAYER_REMINDER_ROWS.map(([key, labelKey]) => (
                                <div
                                    key={key}
                                    className='flex items-center justify-between gap-2 bg-gray-50 dark:bg-slate-700/50 rounded-lg px-3 py-2'
                                >
                                    <span className='text-xs font-medium text-gray-700 dark:text-gray-300 shrink-0'>
                                        {t(labelKey)}
                                    </span>
                                    <select
                                        value={
                                            settings.adzanReminderLeadByPrayer?.[
                                                key
                                            ] ?? "global"
                                        }
                                        onChange={(e) =>
                                            updateAdzanReminderLeadForPrayer(
                                                key,
                                                e.target.value,
                                            )
                                        }
                                        className='min-w-0 flex-1 sm:flex-initial sm:w-32 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-xs text-gray-900 dark:text-white rounded-md px-2 py-1 focus:ring-emerald-500'
                                        aria-label={t(
                                            "prayer.reminder_lead_prayer",
                                            {
                                                prayer: key,
                                            },
                                        )}
                                    >
                                        <option value='global'>
                                            {t("settings.global")}
                                        </option>
                                        {REMINDER_LEAD_OPTIONS.map((m) => (
                                            <option key={m} value={m}>
                                                {m === 0
                                                    ? t(
                                                          "settings.adzan_at_time",
                                                      )
                                                    : `${m} ${t(
                                                          "settings.minutes_before",
                                                      )}`}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>
                    </SettingRow>
                    <SettingRow label={t("settings.adzan_sound")}>
                        <div className='flex flex-col gap-1.5 w-full'>
                            <div className='flex flex-col sm:flex-row sm:items-center gap-2 w-full'>
                                <select
                                    value={settings.adzanSound}
                                    onChange={(e) => {
                                        const next = adzanOptions.find(
                                            (s) => s.value === e.target.value,
                                        );
                                        if (next) updateAdzanSound(next);
                                    }}
                                    className='w-full sm:flex-1 sm:min-w-0 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-sm text-gray-900 dark:text-white rounded-lg px-3 py-1.5 focus:ring-emerald-500'
                                >
                                    {adzanOptions.map((s) => (
                                        <option key={s.value} value={s.value}>
                                            {s.label}
                                            {s.qari ? ` · ${s.qari}` : ""}
                                            {s.region ? ` (${s.region})` : ""}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type='button'
                                    onClick={playAdzanPreview}
                                    className={`shrink-0 px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                                        isPlayingPreview
                                            ? "border-amber-500 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-semibold"
                                            : "border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                                    }`}
                                >
                                    {isPlayingPreview
                                        ? "Stop"
                                        : t("settings.test_sound")}
                                </button>
                            </div>
                            {selectedAdzan?.qari && (
                                <p className='text-xs text-emerald-700 dark:text-emerald-400'>
                                    Muadzin/Qari: <span className='font-medium'>{selectedAdzan.qari}</span>
                                    {selectedAdzan.region && ` • ${selectedAdzan.region}`}
                                </p>
                            )}
                        </div>
                    </SettingRow>
                    <div className='mt-3 flex flex-col gap-2'>
                        <p className='text-xs text-gray-500 dark:text-gray-400'>
                            {t("settings.upload_adzan_limit")} (
                            {customSounds.length}/3)
                        </p>
                        <div className='flex flex-col sm:flex-row sm:items-center gap-2'>
                            <input
                                type='text'
                                value={uploadName}
                                onChange={(e) => setUploadName(e.target.value)}
                                placeholder={t("settings.upload_adzan_name")}
                                className='w-full sm:flex-1 sm:min-w-0 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-sm text-gray-900 dark:text-white rounded-lg px-3 py-1.5 focus:ring-emerald-500'
                            />
                            <label
                                className={`shrink-0 px-3 py-1.5 text-xs rounded-lg border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 cursor-pointer text-center ${uploadProgress > 0 || customSounds.length >= 3 ? "opacity-50 pointer-events-none" : ""}`}
                            >
                                {uploadProgress > 0
                                    ? `${uploadProgress}%`
                                    : t("settings.upload_adzan")}
                                <input
                                    type='file'
                                    accept='audio/*'
                                    className='hidden'
                                    onChange={handleAdzanUpload}
                                    disabled={uploadProgress > 0}
                                />
                            </label>
                        </div>
                        {uploadProgress > 0 && (
                            <div className='w-full bg-gray-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden mt-1'>
                                <div
                                    className='bg-emerald-600 h-1.5 rounded-full transition-all duration-200'
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                        )}
                        {customSounds.length > 0 && (
                            <ul className='mt-1 space-y-1'>
                                {customSounds.map((s) => (
                                    <li
                                        key={s.id}
                                        className='flex items-center justify-between text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-slate-700/40 rounded-lg px-3 py-1.5'
                                    >
                                        <span className='truncate'>
                                            {s.name}
                                        </span>
                                        <button
                                            type='button'
                                            onClick={() => deleteAdzanSound(s)}
                                            className='text-red-600 dark:text-red-400 hover:underline'
                                        >
                                            {t("settings.delete_adzan")}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
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
