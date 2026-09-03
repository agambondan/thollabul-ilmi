import { useCallback, useEffect, useState } from "react";
import { BellRing, Flame, Trash2 } from "lucide-react-native";
import {
    ActivityIndicator,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
    deleteNotificationInboxItem,
    getNotificationInbox,
    getNotificationSettings,
    getPushTokenStatus,
    markAllNotificationsRead,
    markNotificationRead,
    registerPushToken,
    saveNotificationSettings,
    sendPushTest,
} from "../api/personal";
import { useFeedback } from "../context/FeedbackContext";
import { useSession } from "../context/SessionContext";
import { colors, radius, spacing } from "../theme";
import {
    getPushNotificationAvailability,
    getPushNotificationRegistration,
    pushNotificationsSupported,
} from "../utils/pushNotifications";
import {
    getSmartReminderSchedule,
    scheduleSmartReminders,
    smartNotificationsSupported,
} from "../utils/smartNotifications";
import { Card, CardTitle } from "./Card";
import { SectionHeader } from "./SectionHeader";
import {
    preferenceKeys,
    readPreference,
    writePreference,
} from "../storage/preferences";

const defaultSettings = [
    {
        body: "Buka satu ayat untuk memulai hari.",
        is_active: true,
        label: "Quran Harian",
        serverSync: true,
        time: "06:00",
        type: "daily_quran",
    },
    {
        body: "Satu hadis ringkas untuk pengingat harian.",
        is_active: true,
        label: "Hadis Harian",
        serverSync: true,
        time: "07:00",
        type: "daily_hadith",
    },
    {
        body: "Jaga streak belajarmu agar tidak putus.",
        is_active: true,
        label: "Streak Risk",
        serverSync: true,
        time: "20:00",
        type: "streak_risk",
    },
    {
        body: "Baca doa harian pilihanmu.",
        is_active: true,
        label: "Doa Harian",
        serverSync: true,
        time: "18:00",
        type: "doa",
    },
    {
        body: "Lanjutkan sesi belajar kajian.",
        is_active: false,
        label: "Kajian",
        serverSync: false,
        time: "19:30",
        type: "kajian",
    },
    {
        body: "Waktu murojaah singkat hari ini.",
        is_active: false,
        label: "Murojaah",
        serverSync: false,
        time: "20:15",
        type: "murojaah",
    },
];
const defaultQuietHours = { end: "05:00", is_active: false, start: "22:00" };

const labelForType = (type) =>
    defaultSettings.find((item) => item.type === type)?.label ?? type;
const presentationForNotification = (item) => {
    if (item.type === "streak_risk") {
        return {
            Icon: Flame,
            body:
                item.body ||
                "Streak belajarmu berisiko putus. Buka satu sesi singkat hari ini.",
            label: "Streak Risk",
            title: item.title || "Streak Belajar Berisiko",
        };
    }

    return {
        Icon: BellRing,
        body: item.body,
        label: labelForType(item.type),
        title: item.title || labelForType(item.type),
    };
};
const cleanPushMessage = (value = "") =>
    `${value}`
        .replace(/backend/gi, "cloud")
        .replace(/perangkat ini/gi, "HP ini")
        .replace(/perangkat aktif/gi, "sesi aktif");

const toTimeDate = (value) => {
    const now = new Date();
    const match = /^(\d{1,2}):(\d{2})$/.exec(`${value ?? ""}`);
    if (!match) return now;

    const next = new Date(now);
    next.setHours(
        Math.min(23, Number(match[1])),
        Math.min(59, Number(match[2])),
        0,
        0,
    );
    return next;
};
const toTimeString = (date) =>
    `${date.getHours()}`.padStart(2, "0") +
    ":" +
    `${date.getMinutes()}`.padStart(2, "0");

const normalizeSettings = (items) =>
    defaultSettings.map((defaultItem) => {
        const saved = items.find((item) => item.type === defaultItem.type);
        return {
            ...defaultItem,
            is_active: saved?.is_active ?? defaultItem.is_active,
            time: saved?.time ?? defaultItem.time,
        };
    });

const normalizeQuietHours = (value) => ({
    end: value?.end ?? defaultQuietHours.end,
    is_active: Boolean(value?.is_active),
    start: value?.start ?? defaultQuietHours.start,
});

const toServerSettings = (items) =>
    items
        .filter((item) => item.serverSync)
        .map((item) => ({
            is_active: Boolean(item.is_active),
            time: item.time,
            type: item.type,
        }));

const NOTIF_TABS = [
    { key: "settings", label: "Pengaturan" },
    { key: "inbox", label: "Kotak Masuk" },
];

const WEB_APP_NOTIF_SURFACE = "#111827";
const WEB_APP_NOTIF_TILE = "#1e293b";
const WEB_APP_NOTIF_BORDER = "#243044";
const WEB_APP_NOTIF_ACCENT = "#34d399";
const WEB_APP_NOTIF_MUTED = "#94a3b8";

export function NotificationCenter({ variant = "classic" }) {
    const { session } = useSession();
    const { showError, showSuccess } = useFeedback();
    const isWebApp = variant === "webApp";
    const hasSession = Boolean(session?.token);
    const [activeTab, setActiveTab] = useState("settings");
    const [settings, setSettings] = useState(defaultSettings);
    const [quietHours, setQuietHours] = useState(defaultQuietHours);
    const [inbox, setInbox] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [saving, setSaving] = useState(false);
    const [pendingSync, setPendingSync] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const pushAvailability = getPushNotificationAvailability();
    const [pushState, setPushState] = useState({
        activeCount: 0,
        loading: false,
        message: pushAvailability.message,
        status: "idle",
        testLoading: false,
    });
    const [unreadCount, setUnreadCount] = useState(0);
    const [pickerState, setPickerState] = useState({
        open: false,
        type: null,
        value: toTimeDate("06:00"),
    });
    const activeReminderCount = settings.filter(
        (item) => item.is_active,
    ).length;
    const reminderPreview = getSmartReminderSchedule({
        quietHours,
        reminders: settings,
    });
    const visibleTabs = hasSession
        ? NOTIF_TABS
        : NOTIF_TABS.filter((tab) => tab.key === "settings");

    const syncLocalPreferences = useCallback(
        async (nextSettings, nextQuietHours, nextScheduled = null) => {
            await writePreference(
                preferenceKeys.smartNotifSettings,
                nextSettings,
            );
            await writePreference(
                preferenceKeys.smartNotifQuietHours,
                nextQuietHours,
            );
            if (nextScheduled !== null) {
                await writePreference(
                    preferenceKeys.smartNotifLocalIds,
                    nextScheduled,
                );
            }
        },
        [],
    );

    const queuePendingSync = useCallback(async (serverSettings) => {
        await writePreference(preferenceKeys.smartNotifPendingSync, {
            queued_at: new Date().toISOString(),
            settings: serverSettings,
        });
        setPendingSync(true);
    }, []);

    const clearPendingSync = useCallback(async () => {
        await writePreference(preferenceKeys.smartNotifPendingSync, null);
        setPendingSync(false);
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        setMessage("");
        try {
            const [storedSettings, storedQuietHours, pendingPayload] =
                await Promise.all([
                    readPreference(preferenceKeys.smartNotifSettings, null),
                    readPreference(
                        preferenceKeys.smartNotifQuietHours,
                        defaultQuietHours,
                    ),
                    readPreference(preferenceKeys.smartNotifPendingSync, null),
                ]);

            const localSettings = normalizeSettings(storedSettings ?? []);
            const localQuietHours = normalizeQuietHours(storedQuietHours);
            setSettings(localSettings);
            setQuietHours(localQuietHours);
            setPendingSync(Boolean(pendingPayload?.settings?.length));
            setInbox([]);
            setUnreadCount(0);

            if (!session?.token) return;

            let pendingMessage = "";
            if (pendingPayload?.settings?.length) {
                try {
                    await saveNotificationSettings(pendingPayload.settings);
                    await clearPendingSync();
                    pendingMessage = "Pengaturan lokal berhasil disinkronkan.";
                } catch {
                    setPendingSync(true);
                }
            } else {
                setPendingSync(false);
            }

            const [nextSettings, nextInbox, nextPush] = await Promise.all([
                getNotificationSettings(),
                getNotificationInbox(),
                getPushTokenStatus(),
            ]);
            const mergedSettings = pendingPayload?.settings?.length
                ? normalizeSettings([
                      ...(storedSettings ?? []),
                      ...(nextSettings ?? []),
                  ])
                : normalizeSettings([
                      ...(nextSettings ?? []),
                      ...(storedSettings ?? []),
                  ]);
            setSettings(mergedSettings);
            setQuietHours(localQuietHours);
            setInbox(nextInbox.items);
            setUnreadCount(nextInbox.unreadCount);
            if (pendingMessage) setMessage(pendingMessage);
            if (nextPush.hasActive) {
                setPushState((current) => ({
                    ...current,
                    activeCount: nextPush.activeCount,
                    message:
                        nextPush.activeCount > 1
                            ? `${nextPush.activeCount} perangkat aktif untuk push native.`
                            : "Push native aktif untuk perangkat ini.",
                    status: "enabled",
                }));
            }
        } catch (error) {
            setMessage(
                error?.message ??
                    "Pengaturan lokal dipakai. Sinkron cloud belum bisa dimuat.",
            );
        } finally {
            setLoading(false);
        }
    }, [clearPendingSync, session?.token]);

    const updateSetting = (type, patch) => {
        setSettings((current) =>
            current.map((item) =>
                item.type === type ? { ...item, ...patch } : item,
            ),
        );
    };

    const updateWebTime = (type, raw) => {
        if (type === "quiet_start") {
            setQuietHours((current) => ({ ...current, start: raw }));
        } else if (type === "quiet_end") {
            setQuietHours((current) => ({ ...current, end: raw }));
        } else {
            updateSetting(type, { time: raw });
        }

        if (/^\d{1,2}:\d{2}$/.test(raw)) {
            const [h, m] = raw.split(":").map(Number);
            if (h >= 0 && h <= 23 && m >= 0 && m <= 59) return;
        }
        if (raw.length > 0 && !/^\d{0,2}:?\d{0,2}$/.test(raw)) {
            setMessage("Format waktu: HH:MM (contoh: 07:00)");
        } else {
            setMessage("");
        }
    };

    const openTimePicker = (type, time) => {
        if (Platform.OS === "web") return;
        setPickerState({
            open: true,
            type,
            value: toTimeDate(time),
        });
    };

    const onTimeChange = (event, selectedDate) => {
        if (Platform.OS !== "ios") {
            setPickerState((current) => ({ ...current, open: false }));
        }
        if (event?.type === "dismissed") return;
        if (!pickerState.type) return;

        const nextDate = selectedDate ?? pickerState.value;
        const nextTime = toTimeString(nextDate);
        setPickerState((current) => ({ ...current, value: nextDate }));
        if (pickerState.type === "quiet_start") {
            setQuietHours((current) => ({ ...current, start: nextTime }));
            return;
        }
        if (pickerState.type === "quiet_end") {
            setQuietHours((current) => ({ ...current, end: nextTime }));
            return;
        }
        updateSetting(pickerState.type, { time: nextTime });
    };

    const saveSettings = async () => {
        setSaving(true);
        setMessage("");
        try {
            const previousScheduled = await readPreference(
                preferenceKeys.smartNotifLocalIds,
                [],
            );
            const localSchedule = await scheduleSmartReminders({
                previous: previousScheduled,
                quietHours,
                reminders: settings,
            });

            if (!smartNotificationsSupported()) {
                setMessage(
                    "Reminder lokal hanya tersedia di Android atau iOS.",
                );
            } else if (localSchedule.status === "denied") {
                setMessage(
                    "Izin notifikasi belum diberikan. Reminder lokal belum aktif.",
                );
            } else if (localSchedule.status === "scheduled") {
                setMessage(
                    `${localSchedule.scheduled.length} reminder lokal dijadwalkan.`,
                );
            }

            await syncLocalPreferences(
                settings,
                quietHours,
                localSchedule.status === "scheduled"
                    ? localSchedule.scheduled
                    : previousScheduled,
            );

            const serverSettings = toServerSettings(settings);
            if (!session?.token) {
                await queuePendingSync(serverSettings);
                const localOnlyMessage =
                    "Pengingat lokal disimpan. Sinkron cloud aktif setelah login atau online.";
                setMessage(localOnlyMessage);
                showSuccess("Pengingat lokal disimpan.");
                return;
            }

            try {
                const saved = await saveNotificationSettings(serverSettings);
                const merged = normalizeSettings([
                    ...(saved?.data ?? saved ?? []),
                    ...settings,
                ]);
                setSettings(merged);
                await clearPendingSync();
                await writePreference(
                    preferenceKeys.smartNotifSettings,
                    merged,
                );
                setMessage("Pengaturan notifikasi disimpan.");
                showSuccess("Pengaturan notifikasi disimpan.");
            } catch (syncError) {
                await queuePendingSync(serverSettings);
                const queuedMessage = syncError?.message
                    ?.toLowerCase()
                    .includes("network request failed")
                    ? "Pengaturan disimpan lokal. Akan sinkron otomatis saat online."
                    : (syncError?.message ??
                      "Sinkron cloud gagal. Pengaturan lokal tetap aktif.");
                setMessage(queuedMessage);
                showSuccess("Pengaturan lokal disimpan.");
            }
        } catch (error) {
            const nextMessage =
                error?.message ?? "Pengaturan belum bisa disimpan.";
            setMessage(nextMessage);
            showError(nextMessage);
        } finally {
            setSaving(false);
        }
    };

    const retryPendingSync = async () => {
        if (!session?.token) {
            setMessage("Login dulu untuk menyinkronkan pengaturan ke cloud.");
            return;
        }

        setSaving(true);
        setMessage("");
        try {
            const serverSettings = toServerSettings(settings);
            const saved = await saveNotificationSettings(serverSettings);
            const merged = normalizeSettings([
                ...(saved?.data ?? saved ?? []),
                ...settings,
            ]);
            setSettings(merged);
            await clearPendingSync();
            await writePreference(preferenceKeys.smartNotifSettings, merged);
            setMessage("Pengaturan berhasil disinkronkan ke cloud.");
            showSuccess("Pengaturan berhasil disinkronkan.");
        } catch (error) {
            await queuePendingSync(toServerSettings(settings));
            const nextMessage =
                error?.message ??
                "Sinkron cloud belum berhasil. Pengaturan lokal tetap aktif.";
            setMessage(nextMessage);
            showError(nextMessage);
        } finally {
            setSaving(false);
        }
    };

    const enablePush = async () => {
        if (!session?.token) return;

        setPushState((current) => ({
            ...current,
            loading: true,
            message: "Meminta izin notifikasi...",
            status: "loading",
        }));
        try {
            const registration = await getPushNotificationRegistration();
            if (!registration.granted) {
                const nextMessage =
                    registration.message ??
                    "Izin notifikasi belum diberikan dari sistem.";
                setPushState((current) => ({
                    ...current,
                    loading: false,
                    message: nextMessage,
                    status: registration.reason ?? "denied",
                }));
                return;
            }

            if (!registration.token) {
                setPushState((current) => ({
                    ...current,
                    loading: false,
                    message:
                        registration.message ??
                        "Token push belum tersedia. Pastikan app berjalan di device native.",
                    status: "token_unavailable",
                }));
                return;
            }

            await registerPushToken(registration);
            const nextPush = await getPushTokenStatus();
            setPushState((current) => ({
                ...current,
                activeCount: nextPush.activeCount || 1,
                loading: false,
                message: "Push native aktif untuk perangkat ini.",
                status: "enabled",
            }));
            showSuccess("Push native aktif untuk perangkat ini.");
        } catch (error) {
            showError(error?.message ?? "Push native belum bisa diaktifkan.");
            setPushState((current) => ({
                ...current,
                loading: false,
                message: error?.message ?? "Push native belum bisa diaktifkan.",
                status: "error",
            }));
        }
    };

    const testPush = async () => {
        if (!session?.token) return;

        setPushState((current) => ({
            ...current,
            message: "Mengirim test push ke perangkat...",
            testLoading: true,
        }));
        try {
            const result = await sendPushTest();
            setPushState((current) => ({
                ...current,
                message: result?.sent
                    ? `Test push terkirim ke ${result.sent} perangkat.`
                    : "Test push terkirim.",
                status: "enabled",
                testLoading: false,
            }));
            showSuccess(
                result?.sent
                    ? `Test push terkirim ke ${result.sent} perangkat.`
                    : "Test push terkirim.",
            );
            load();
        } catch (error) {
            showError(error?.message ?? "Test push belum bisa dikirim.");
            setPushState((current) => ({
                ...current,
                message: error?.message ?? "Test push belum bisa dikirim.",
                testLoading: false,
            }));
        }
    };

    const markRead = async (id) => {
        if (!id) return;

        try {
            await markNotificationRead(id);
            setInbox((current) =>
                current.map((item) =>
                    item.id === id ? { ...item, is_read: true } : item,
                ),
            );
            setUnreadCount((current) => Math.max(0, current - 1));
        } catch (error) {
            const nextMessage =
                error?.message ?? "Notifikasi belum bisa ditandai terbaca.";
            setMessage(nextMessage);
            showError(nextMessage);
        }
    };

    const markAllRead = async () => {
        try {
            await markAllNotificationsRead();
            setInbox((current) =>
                current.map((item) => ({ ...item, is_read: true })),
            );
            setUnreadCount(0);
            setMessage("Semua notifikasi ditandai terbaca.");
            showSuccess("Semua notifikasi ditandai terbaca.");
        } catch (error) {
            const nextMessage =
                error?.message ?? "Notifikasi belum bisa ditandai terbaca.";
            setMessage(nextMessage);
            showError(nextMessage);
        }
    };

    const deleteInboxItem = async (item) => {
        if (!item?.id || deletingId) return;

        const wasUnread = !item.is_read;
        setDeletingId(item.id);
        setInbox((current) =>
            current.filter((currentItem) => currentItem.id !== item.id),
        );
        if (wasUnread) {
            setUnreadCount((current) => Math.max(0, current - 1));
        }
        try {
            await deleteNotificationInboxItem(item.id);
            setMessage("Notifikasi dihapus.");
            showSuccess("Notifikasi dihapus.");
        } catch (error) {
            if (error?.status === 404) {
                setMessage("Notifikasi sudah tidak tersedia.");
                return;
            }
            setInbox((current) =>
                current.some((currentItem) => currentItem.id === item.id)
                    ? current
                    : [item, ...current],
            );
            if (wasUnread) {
                setUnreadCount((current) => current + 1);
            }
            const nextMessage =
                error?.message ?? "Notifikasi belum bisa dihapus.";
            setMessage(nextMessage);
            showError(nextMessage);
        } finally {
            setDeletingId(null);
        }
    };

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        if (!hasSession && activeTab !== "settings") {
            setActiveTab("settings");
        }
    }, [activeTab, hasSession]);

    return (
        <View
            testID={
                isWebApp
                    ? "notification-center-web-app"
                    : "notification-center-classic"
            }
        >
            <View style={[styles.tabs, isWebApp ? styles.webAppTabs : null]}>
                {visibleTabs.map((tab) => (
                    <Pressable
                        accessibilityRole='tab'
                        accessibilityState={{ selected: activeTab === tab.key }}
                        android_ripple={{
                            color: "rgba(91, 110, 91, 0.12)",
                            borderless: false,
                        }}
                        key={tab.key}
                        onPress={() => {
                            setActiveTab(tab.key);
                            setMessage("");
                        }}
                        style={[
                            styles.tab,
                            isWebApp ? styles.webAppTab : null,
                            activeTab === tab.key ? styles.tabActive : null,
                            isWebApp && activeTab === tab.key
                                ? styles.webAppTabActive
                                : null,
                        ]}
                    >
                        <Text
                            style={[
                                styles.tabText,
                                isWebApp ? styles.webAppTabText : null,
                                activeTab === tab.key
                                    ? styles.tabTextActive
                                    : null,
                                isWebApp && activeTab === tab.key
                                    ? styles.webAppTabTextActive
                                    : null,
                            ]}
                        >
                            {tab.label}
                            {tab.key === "inbox" && unreadCount > 0
                                ? ` (${unreadCount})`
                                : ""}
                        </Text>
                    </Pressable>
                ))}
            </View>

            {activeTab === "settings" ? (
                <Card style={isWebApp ? styles.webAppCard : null}>
                    <CardTitle
                        meta={
                            hasSession
                                ? `${activeReminderCount} aktif · sinkron cloud`
                                : `${activeReminderCount} aktif · lokal`
                        }
                        metaStyle={isWebApp ? styles.webAppCardMeta : null}
                        titleStyle={isWebApp ? styles.webAppCardTitle : null}
                    >
                        Pengaturan Notifikasi
                    </CardTitle>
                    {!hasSession ? (
                        <View
                            style={[
                                styles.localNotice,
                                isWebApp ? styles.webAppPanel : null,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.localNoticeTitle,
                                    isWebApp ? styles.webAppTextStrong : null,
                                ]}
                            >
                                Reminder lokal tetap aktif
                            </Text>
                            <Text
                                style={[
                                    styles.localNoticeText,
                                    isWebApp ? styles.webAppTextMuted : null,
                                ]}
                            >
                                Simpan jadwal di HP ini. Login diperlukan hanya
                                untuk push cloud dan kotak masuk.
                            </Text>
                        </View>
                    ) : null}
                    <View
                        style={[
                            styles.pushBox,
                            isWebApp ? styles.webAppPanel : null,
                        ]}
                    >
                        <View
                            style={[
                                styles.pushIcon,
                                isWebApp ? styles.webAppIconBox : null,
                            ]}
                        >
                            <BellRing
                                color={
                                    isWebApp
                                        ? WEB_APP_NOTIF_ACCENT
                                        : colors.primary
                                }
                                size={18}
                                strokeWidth={2.2}
                            />
                        </View>
                        <View style={styles.pushCopy}>
                            <Text
                                style={[
                                    styles.settingTitle,
                                    isWebApp ? styles.webAppTextStrong : null,
                                ]}
                            >
                                Push native
                            </Text>
                            <Text
                                style={[
                                    styles.settingMeta,
                                    isWebApp ? styles.webAppTextMuted : null,
                                ]}
                            >
                                {hasSession
                                    ? cleanPushMessage(pushState.message)
                                    : "Login untuk push cloud. Reminder lokal tidak perlu login."}
                            </Text>
                        </View>
                        <Pressable
                            accessibilityRole='button'
                            android_ripple={{
                                color: "rgba(91, 110, 91, 0.12)",
                                borderless: false,
                            }}
                            disabled={
                                !hasSession ||
                                pushState.loading ||
                                !pushNotificationsSupported()
                            }
                            onPress={enablePush}
                            style={[
                                styles.pushButton,
                                isWebApp ? styles.webAppSecondaryButton : null,
                                !hasSession ||
                                pushState.loading ||
                                !pushNotificationsSupported()
                                    ? styles.disabled
                                    : null,
                            ]}
                        >
                            {pushState.loading ? (
                                <ActivityIndicator
                                    color={colors.primary}
                                    size='small'
                                />
                            ) : (
                                <Text
                                    style={[
                                        styles.pushButtonText,
                                        isWebApp
                                            ? styles.webAppSecondaryText
                                            : null,
                                    ]}
                                >
                                    {!hasSession
                                        ? "Login"
                                        : pushState.status === "enabled"
                                          ? "Aktif"
                                          : "Aktifkan"}
                                </Text>
                            )}
                        </Pressable>
                    </View>
                    <View style={styles.pushActions}>
                        <Pressable
                            accessibilityRole='button'
                            android_ripple={{
                                color: "rgba(91, 110, 91, 0.12)",
                                borderless: false,
                            }}
                            disabled={
                                !hasSession ||
                                pushState.testLoading ||
                                pushState.status !== "enabled"
                            }
                            onPress={testPush}
                            style={[
                                styles.secondaryButtonCompact,
                                isWebApp ? styles.webAppSecondaryButton : null,
                                !hasSession ||
                                pushState.testLoading ||
                                pushState.status !== "enabled"
                                    ? styles.disabled
                                    : null,
                            ]}
                        >
                            {pushState.testLoading ? (
                                <ActivityIndicator
                                    color={colors.primary}
                                    size='small'
                                />
                            ) : (
                                <Text
                                    style={[
                                        styles.secondaryText,
                                        isWebApp
                                            ? styles.webAppSecondaryText
                                            : null,
                                    ]}
                                >
                                    Kirim test push
                                </Text>
                            )}
                        </Pressable>
                        <Text
                            style={[
                                styles.pushHint,
                                isWebApp ? styles.webAppTextMuted : null,
                            ]}
                        >
                            {!hasSession
                                ? "Pengingat lokal akan dijadwalkan dari tombol simpan di bawah."
                                : pushState.activeCount
                                  ? `${pushState.activeCount} sesi push aktif tersimpan di cloud.`
                                  : "Aktifkan dulu untuk menyalakan push cloud."}
                        </Text>
                    </View>
                    <View
                        style={[
                            styles.settingRow,
                            isWebApp ? styles.webAppSettingRow : null,
                        ]}
                    >
                        <View style={styles.settingBody}>
                            <Text
                                style={[
                                    styles.settingTitle,
                                    isWebApp ? styles.webAppTextStrong : null,
                                ]}
                            >
                                Quiet hours
                            </Text>
                            <Text
                                style={[
                                    styles.settingMeta,
                                    isWebApp ? styles.webAppTextMuted : null,
                                ]}
                            >
                                Tahan reminder di jam tenang
                            </Text>
                        </View>
                        <Pressable
                            accessibilityRole='button'
                            android_ripple={{
                                color: "rgba(91, 110, 91, 0.12)",
                                borderless: false,
                            }}
                            onPress={() =>
                                setQuietHours((current) => ({
                                    ...current,
                                    is_active: !current.is_active,
                                }))
                            }
                            style={[
                                styles.toggle,
                                isWebApp ? styles.webAppToggle : null,
                                quietHours.is_active
                                    ? styles.toggleActive
                                    : null,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.toggleText,
                                    isWebApp ? styles.webAppToggleText : null,
                                    quietHours.is_active
                                        ? styles.toggleTextActive
                                        : null,
                                ]}
                            >
                                {quietHours.is_active ? "On" : "Off"}
                            </Text>
                        </Pressable>
                    </View>
                    {quietHours.is_active ? (
                        <View style={styles.quietHoursRow}>
                            {Platform.OS === "web" ? (
                                <>
                                    <TextInput
                                        autoCapitalize='none'
                                        keyboardType='numbers-and-punctuation'
                                        maxLength={5}
                                        onChangeText={(time) =>
                                            updateWebTime("quiet_start", time)
                                        }
                                        placeholder='22:00'
                                        placeholderTextColor={colors.muted}
                                        style={styles.timeInput}
                                        value={quietHours.start}
                                    />
                                    <Text style={styles.quietSeparator}>
                                        sampai
                                    </Text>
                                    <TextInput
                                        autoCapitalize='none'
                                        keyboardType='numbers-and-punctuation'
                                        maxLength={5}
                                        onChangeText={(time) =>
                                            updateWebTime("quiet_end", time)
                                        }
                                        placeholder='05:00'
                                        placeholderTextColor={colors.muted}
                                        style={styles.timeInput}
                                        value={quietHours.end}
                                    />
                                </>
                            ) : (
                                <>
                                    <Pressable
                                        accessibilityRole='button'
                                        android_ripple={{
                                            color: "rgba(91, 110, 91, 0.12)",
                                            borderless: false,
                                        }}
                                        onPress={() =>
                                            openTimePicker(
                                                "quiet_start",
                                                quietHours.start,
                                            )
                                        }
                                        style={styles.timeButton}
                                    >
                                        <Text style={styles.timeButtonText}>
                                            {quietHours.start}
                                        </Text>
                                    </Pressable>
                                    <Text style={styles.quietSeparator}>
                                        sampai
                                    </Text>
                                    <Pressable
                                        accessibilityRole='button'
                                        android_ripple={{
                                            color: "rgba(91, 110, 91, 0.12)",
                                            borderless: false,
                                        }}
                                        onPress={() =>
                                            openTimePicker(
                                                "quiet_end",
                                                quietHours.end,
                                            )
                                        }
                                        style={styles.timeButton}
                                    >
                                        <Text style={styles.timeButtonText}>
                                            {quietHours.end}
                                        </Text>
                                    </Pressable>
                                </>
                            )}
                        </View>
                    ) : null}
                    {settings.map((item) => (
                        <View
                            key={item.type}
                            style={[
                                styles.settingRow,
                                isWebApp ? styles.webAppSettingRow : null,
                            ]}
                        >
                            <View style={styles.settingBody}>
                                <Text
                                    style={[
                                        styles.settingTitle,
                                        isWebApp
                                            ? styles.webAppTextStrong
                                            : null,
                                    ]}
                                >
                                    {item.label}
                                </Text>
                                <Text
                                    style={[
                                        styles.settingMeta,
                                        isWebApp
                                            ? styles.webAppTextMuted
                                            : null,
                                    ]}
                                >
                                    {item.serverSync
                                        ? "Reminder harian · sinkron cloud"
                                        : "Reminder harian · lokal aplikasi"}
                                </Text>
                            </View>
                            {Platform.OS === "web" ? (
                                <TextInput
                                    autoCapitalize='none'
                                    keyboardType='numbers-and-punctuation'
                                    maxLength={5}
                                    onChangeText={(time) =>
                                        updateWebTime(item.type, time)
                                    }
                                    placeholder='HH:MM'
                                    placeholderTextColor={colors.muted}
                                    style={[
                                        styles.timeInput,
                                        isWebApp
                                            ? styles.webAppTimeInput
                                            : null,
                                    ]}
                                    value={item.time}
                                />
                            ) : (
                                <Pressable
                                    accessibilityRole='button'
                                    android_ripple={{
                                        color: "rgba(91, 110, 91, 0.12)",
                                        borderless: false,
                                    }}
                                    onPress={() =>
                                        openTimePicker(item.type, item.time)
                                    }
                                    style={[
                                        styles.timeButton,
                                        isWebApp
                                            ? styles.webAppSecondaryButton
                                            : null,
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.timeButtonText,
                                            isWebApp
                                                ? styles.webAppSecondaryText
                                                : null,
                                        ]}
                                    >
                                        {item.time}
                                    </Text>
                                </Pressable>
                            )}
                            <Pressable
                                accessibilityRole='button'
                                android_ripple={{
                                    color: "rgba(91, 110, 91, 0.12)",
                                    borderless: false,
                                }}
                                onPress={() =>
                                    updateSetting(item.type, {
                                        is_active: !item.is_active,
                                    })
                                }
                                style={[
                                    styles.toggle,
                                    isWebApp ? styles.webAppToggle : null,
                                    item.is_active ? styles.toggleActive : null,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.toggleText,
                                        isWebApp
                                            ? styles.webAppToggleText
                                            : null,
                                        item.is_active
                                            ? styles.toggleTextActive
                                            : null,
                                    ]}
                                >
                                    {item.is_active ? "On" : "Off"}
                                </Text>
                            </Pressable>
                        </View>
                    ))}
                    {reminderPreview.length ? (
                        <View
                            style={[
                                styles.previewBox,
                                isWebApp ? styles.webAppPanel : null,
                            ]}
                        >
                            <SectionHeader
                                meta={`${reminderPreview.length} reminder`}
                                metaStyle={styles.previewMeta}
                                style={styles.previewHeader}
                                title='Jadwal aktif'
                                titleStyle={styles.previewTitle}
                            />
                            {reminderPreview.map((item) => (
                                <View
                                    key={`preview-${item.type}`}
                                    style={styles.previewRow}
                                >
                                    <View style={styles.previewDot} />
                                    <View style={styles.previewCopy}>
                                        <Text style={styles.previewName}>
                                            {item.label}
                                        </Text>
                                        <Text style={styles.previewNote}>
                                            {item.shiftedByQuietHours
                                                ? `Ditahan dari ${item.time} sampai quiet hours selesai`
                                                : item.serverSync
                                                  ? "Sinkron cloud dan reminder lokal"
                                                  : "Reminder lokal aplikasi"}
                                        </Text>
                                    </View>
                                    <Text style={styles.previewTime}>
                                        {item.scheduledTime}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <View
                            style={[
                                styles.previewBox,
                                isWebApp ? styles.webAppPanel : null,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.previewTitle,
                                    isWebApp ? styles.webAppTextStrong : null,
                                ]}
                            >
                                Belum ada reminder aktif
                            </Text>
                            <Text
                                style={[
                                    styles.previewNote,
                                    isWebApp ? styles.webAppTextMuted : null,
                                ]}
                            >
                                Aktifkan minimal satu kategori untuk
                                menjadwalkan pengingat.
                            </Text>
                        </View>
                    )}
                    <Pressable
                        accessibilityRole='button'
                        android_ripple={{
                            color: "rgba(255, 255, 255, 0.12)",
                            borderless: false,
                        }}
                        accessibilityState={{ disabled: saving }}
                        disabled={saving}
                        onPress={saveSettings}
                        style={[
                            styles.primaryButton,
                            saving ? styles.disabled : null,
                        ]}
                    >
                        {saving ? (
                            <ActivityIndicator color='#ffffff' size='small' />
                        ) : (
                            <Text style={styles.primaryText}>
                                Simpan pengaturan
                            </Text>
                        )}
                    </Pressable>
                    {pendingSync ? (
                        <View style={styles.pendingSyncBox}>
                            <Text style={styles.pendingSyncText}>
                                Ada perubahan yang belum sinkron ke cloud.
                                Pengingat lokal tetap aktif.
                            </Text>
                            <Pressable
                                accessibilityRole='button'
                                android_ripple={{
                                    color: "rgba(91, 110, 91, 0.12)",
                                    borderless: false,
                                }}
                                accessibilityState={{
                                    disabled: saving || !hasSession,
                                }}
                                disabled={saving || !hasSession}
                                onPress={retryPendingSync}
                                style={[
                                    styles.pendingSyncButton,
                                    saving || !hasSession
                                        ? styles.disabled
                                        : null,
                                ]}
                            >
                                <Text style={styles.pendingSyncButtonText}>
                                    {hasSession
                                        ? "Sinkron sekarang"
                                        : "Login untuk sinkron"}
                                </Text>
                            </Pressable>
                        </View>
                    ) : null}
                    {message ? (
                        <Text
                            style={[
                                styles.message,
                                isWebApp ? styles.webAppMessage : null,
                            ]}
                        >
                            {message}
                        </Text>
                    ) : null}
                    {pickerState.open && Platform.OS !== "web" ? (
                        <View style={styles.timePickerWrap}>
                            <DateTimePicker
                                display={
                                    Platform.OS === "ios"
                                        ? "spinner"
                                        : "default"
                                }
                                mode='time'
                                onChange={onTimeChange}
                                value={pickerState.value}
                            />
                            {Platform.OS === "ios" ? (
                                <Pressable
                                    accessibilityRole='button'
                                    android_ripple={{
                                        color: "rgba(91, 110, 91, 0.12)",
                                        borderless: false,
                                    }}
                                    onPress={() =>
                                        setPickerState((current) => ({
                                            ...current,
                                            open: false,
                                        }))
                                    }
                                    style={styles.secondaryButton}
                                >
                                    <Text style={styles.secondaryText}>
                                        Done
                                    </Text>
                                </Pressable>
                            ) : null}
                        </View>
                    ) : null}
                </Card>
            ) : (
                <Card style={isWebApp ? styles.webAppCard : null}>
                    <CardTitle
                        meta={`${unreadCount} belum dibaca`}
                        metaStyle={isWebApp ? styles.webAppCardMeta : null}
                        titleStyle={isWebApp ? styles.webAppCardTitle : null}
                    >
                        Kotak Masuk
                    </CardTitle>
                    {loading ? (
                        <ActivityIndicator color={colors.primary} />
                    ) : null}
                    {!loading && inbox.length === 0 ? (
                        <Text
                            style={[
                                styles.body,
                                isWebApp ? styles.webAppTextMuted : null,
                            ]}
                        >
                            Belum ada notifikasi masuk.
                        </Text>
                    ) : null}
                    {inbox.map((item) => {
                        const presentation = presentationForNotification(item);
                        const InboxIcon = presentation.Icon;

                        return (
                            <View
                                key={item.id}
                                style={[
                                    styles.inboxItem,
                                    isWebApp ? styles.webAppInboxItem : null,
                                    !item.is_read ? styles.unreadItem : null,
                                ]}
                            >
                                <View style={styles.inboxRow}>
                                    <View
                                        style={[
                                            styles.inboxIcon,
                                            isWebApp
                                                ? styles.webAppIconBox
                                                : null,
                                        ]}
                                    >
                                        <InboxIcon
                                            color={
                                                isWebApp
                                                    ? WEB_APP_NOTIF_ACCENT
                                                    : colors.primary
                                            }
                                            size={17}
                                            strokeWidth={2.3}
                                        />
                                    </View>
                                    <View style={styles.inboxCopy}>
                                        <SectionHeader
                                            meta={
                                                item.is_read
                                                    ? "Terbaca"
                                                    : "Baru"
                                            }
                                            metaStyle={styles.inboxType}
                                            style={styles.inboxHeader}
                                            title={presentation.title}
                                            titleStyle={[
                                                styles.inboxTitle,
                                                isWebApp
                                                    ? styles.webAppTextStrong
                                                    : null,
                                            ]}
                                        />
                                        {presentation.body ? (
                                            <Text
                                                style={[
                                                    styles.body,
                                                    isWebApp
                                                        ? styles.webAppTextMuted
                                                        : null,
                                                ]}
                                            >
                                                {presentation.body}
                                            </Text>
                                        ) : null}
                                        <Text
                                            style={[
                                                styles.settingMeta,
                                                isWebApp
                                                    ? styles.webAppTextMuted
                                                    : null,
                                            ]}
                                        >
                                            {[presentation.label, item.ref_id]
                                                .filter(Boolean)
                                                .join(" · ")}
                                        </Text>
                                        <View style={styles.inboxActions}>
                                            {!item.is_read ? (
                                                <Pressable
                                                    accessibilityRole='button'
                                                    android_ripple={{
                                                        color: "rgba(91, 110, 91, 0.12)",
                                                        borderless: false,
                                                    }}
                                                    onPress={() =>
                                                        markRead(item.id)
                                                    }
                                                    style={[
                                                        styles.inboxActionButton,
                                                        isWebApp
                                                            ? styles.webAppSecondaryButton
                                                            : null,
                                                    ]}
                                                >
                                                    <Text
                                                        style={[
                                                            styles.inboxActionText,
                                                            isWebApp
                                                                ? styles.webAppSecondaryText
                                                                : null,
                                                        ]}
                                                    >
                                                        Tandai terbaca
                                                    </Text>
                                                </Pressable>
                                            ) : null}
                                            <Pressable
                                                accessibilityRole='button'
                                                android_ripple={{
                                                    color: "rgba(190, 18, 60, 0.12)",
                                                    borderless: false,
                                                }}
                                                disabled={
                                                    deletingId === item.id
                                                }
                                                onPress={() =>
                                                    deleteInboxItem(item)
                                                }
                                                style={[
                                                    styles.inboxActionButton,
                                                    styles.inboxDeleteButton,
                                                    deletingId === item.id
                                                        ? styles.disabled
                                                        : null,
                                                ]}
                                            >
                                                {deletingId === item.id ? (
                                                    <ActivityIndicator
                                                        color='#be123c'
                                                        size='small'
                                                    />
                                                ) : (
                                                    <>
                                                        <Trash2
                                                            color='#be123c'
                                                            size={14}
                                                            strokeWidth={2.3}
                                                        />
                                                        <Text
                                                            style={
                                                                styles.inboxDeleteText
                                                            }
                                                        >
                                                            Hapus
                                                        </Text>
                                                    </>
                                                )}
                                            </Pressable>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        );
                    })}
                    {inbox.length ? (
                        <Pressable
                            accessibilityRole='button'
                            android_ripple={{
                                color: "rgba(91, 110, 91, 0.12)",
                                borderless: false,
                            }}
                            onPress={markAllRead}
                            style={styles.secondaryButton}
                        >
                            <Text style={styles.secondaryText}>
                                Tandai semua terbaca
                            </Text>
                        </Pressable>
                    ) : null}
                    {message ? (
                        <Text
                            style={[
                                styles.message,
                                isWebApp ? styles.webAppMessage : null,
                            ]}
                        >
                            {message}
                        </Text>
                    ) : null}
                </Card>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    tabs: {
        flexDirection: "row",
        borderBottomColor: colors.faint,
        borderBottomWidth: 1,
        marginBottom: 0,
    },
    tab: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        minHeight: 44,
        paddingVertical: spacing.sm,
    },
    tabActive: {
        borderBottomColor: colors.primary,
        borderBottomWidth: 2,
    },
    tabText: {
        color: colors.muted,
        fontSize: 13,
        fontWeight: "800",
    },
    tabTextActive: {
        color: colors.primary,
    },
    body: {
        color: colors.text,
        fontSize: 13,
        lineHeight: 19,
    },
    disabled: {
        opacity: 0.55,
    },
    inboxHeader: {
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: spacing.xs,
    },
    inboxItem: {
        borderBottomColor: colors.faint,
        borderBottomWidth: 1,
        paddingVertical: spacing.md,
    },
    inboxCopy: {
        flex: 1,
    },
    inboxActionButton: {
        alignItems: "center",
        backgroundColor: colors.surface,
        borderColor: colors.faint,
        borderRadius: radius.sm,
        borderWidth: 1,
        flexDirection: "row",
        gap: 5,
        justifyContent: "center",
        minHeight: 30,
        paddingHorizontal: spacing.sm,
    },
    inboxActionText: {
        color: colors.primary,
        fontSize: 11,
        fontWeight: "900",
    },
    inboxActions: {
        alignItems: "center",
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.xs,
        marginTop: spacing.sm,
    },
    inboxDeleteButton: {
        borderColor: "rgba(190, 18, 60, 0.18)",
    },
    inboxDeleteText: {
        color: "#be123c",
        fontSize: 11,
        fontWeight: "900",
    },
    inboxIcon: {
        alignItems: "center",
        backgroundColor: colors.surfaceMuted,
        borderColor: colors.faint,
        borderRadius: radius.sm,
        borderWidth: 1,
        height: 34,
        justifyContent: "center",
        marginTop: 1,
        width: 34,
    },
    inboxRow: {
        alignItems: "flex-start",
        flexDirection: "row",
        gap: spacing.sm,
    },
    inboxTitle: {
        color: colors.ink,
        flex: 1,
        fontSize: 14,
        fontWeight: "900",
    },
    inboxType: {
        color: colors.muted,
        fontSize: 12,
        fontWeight: "900",
        marginLeft: spacing.md,
        textTransform: "uppercase",
    },
    localNotice: {
        backgroundColor: colors.surfaceMuted,
        borderColor: colors.faint,
        borderRadius: radius.md,
        borderWidth: 1,
        marginBottom: spacing.sm,
        padding: spacing.md,
    },
    localNoticeText: {
        color: colors.muted,
        fontSize: 12,
        fontWeight: "700",
        lineHeight: 18,
        marginTop: 3,
    },
    localNoticeTitle: {
        color: colors.ink,
        fontSize: 13,
        fontWeight: "900",
    },
    message: {
        color: colors.primary,
        fontSize: 12,
        fontWeight: "700",
        marginTop: spacing.sm,
    },
    pendingSyncBox: {
        backgroundColor: colors.surfaceMuted,
        borderColor: colors.faint,
        borderRadius: radius.md,
        borderWidth: 1,
        marginTop: spacing.sm,
        padding: spacing.sm,
    },
    pendingSyncButton: {
        alignItems: "center",
        alignSelf: "flex-start",
        backgroundColor: colors.surface,
        borderColor: colors.faint,
        borderRadius: radius.sm,
        borderWidth: 1,
        justifyContent: "center",
        marginTop: spacing.xs,
        minHeight: 32,
        paddingHorizontal: spacing.sm,
    },
    pendingSyncButtonText: {
        color: colors.primary,
        fontSize: 12,
        fontWeight: "900",
    },
    pendingSyncText: {
        color: colors.muted,
        fontSize: 11,
        fontWeight: "700",
        lineHeight: 16,
    },
    primaryButton: {
        alignItems: "center",
        backgroundColor: colors.primary,
        borderRadius: radius.md,
        justifyContent: "center",
        marginTop: spacing.md,
        minHeight: 42,
    },
    primaryText: {
        color: "#ffffff",
        fontSize: 13,
        fontWeight: "900",
    },
    pushBox: {
        alignItems: "center",
        backgroundColor: colors.surfaceMuted,
        borderColor: colors.faint,
        borderRadius: radius.md,
        borderWidth: 1,
        flexDirection: "row",
        gap: spacing.sm,
        marginBottom: spacing.sm,
        padding: spacing.sm,
    },
    pushButton: {
        alignItems: "center",
        backgroundColor: colors.surface,
        borderColor: colors.faint,
        borderRadius: radius.sm,
        borderWidth: 1,
        justifyContent: "center",
        minHeight: 34,
        paddingHorizontal: spacing.sm,
    },
    pushButtonText: {
        color: colors.primary,
        fontSize: 12,
        fontWeight: "900",
    },
    pushCopy: {
        flex: 1,
    },
    pushIcon: {
        alignItems: "center",
        backgroundColor: colors.surface,
        borderColor: colors.faint,
        borderRadius: radius.sm,
        borderWidth: 1,
        height: 34,
        justifyContent: "center",
        width: 34,
    },
    pushActions: {
        marginBottom: spacing.sm,
    },
    pushHint: {
        color: colors.muted,
        fontSize: 11,
        fontWeight: "700",
        lineHeight: 16,
        marginTop: spacing.xs,
    },
    previewBox: {
        backgroundColor: colors.surfaceMuted,
        borderColor: colors.faint,
        borderRadius: radius.md,
        borderWidth: 1,
        marginTop: spacing.md,
        padding: spacing.md,
    },
    previewCopy: {
        flex: 1,
    },
    previewDot: {
        backgroundColor: colors.primary,
        borderRadius: 999,
        height: 8,
        marginTop: 7,
        width: 8,
    },
    previewHeader: {
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: spacing.xs,
    },
    previewMeta: {
        color: colors.primary,
        fontSize: 11,
        fontWeight: "900",
    },
    previewName: {
        color: colors.ink,
        fontSize: 13,
        fontWeight: "900",
    },
    previewNote: {
        color: colors.muted,
        fontSize: 11,
        fontWeight: "700",
        lineHeight: 16,
        marginTop: 2,
    },
    previewRow: {
        alignItems: "flex-start",
        borderTopColor: colors.faint,
        borderTopWidth: 1,
        flexDirection: "row",
        gap: spacing.sm,
        paddingVertical: spacing.sm,
    },
    previewTime: {
        color: colors.primary,
        fontSize: 13,
        fontWeight: "900",
        marginTop: 1,
    },
    previewTitle: {
        color: colors.ink,
        fontSize: 13,
        fontWeight: "900",
    },
    secondaryButton: {
        alignItems: "center",
        borderColor: colors.faint,
        borderRadius: radius.md,
        borderWidth: 1,
        justifyContent: "center",
        marginTop: spacing.md,
        minHeight: 42,
    },
    secondaryButtonCompact: {
        alignItems: "center",
        borderColor: colors.faint,
        borderRadius: radius.md,
        borderWidth: 1,
        justifyContent: "center",
        minHeight: 38,
    },
    secondaryText: {
        color: colors.primary,
        fontSize: 13,
        fontWeight: "900",
    },
    quietHoursRow: {
        alignItems: "center",
        flexDirection: "row",
        gap: spacing.sm,
        marginBottom: spacing.sm,
        marginTop: spacing.xs,
    },
    quietSeparator: {
        color: colors.muted,
        fontSize: 12,
        fontWeight: "800",
    },
    settingBody: {
        flex: 1,
    },
    settingMeta: {
        color: colors.muted,
        fontSize: 12,
        fontWeight: "700",
        marginTop: 2,
    },
    settingRow: {
        alignItems: "center",
        borderBottomColor: colors.faint,
        borderBottomWidth: 1,
        flexDirection: "row",
        gap: spacing.sm,
        paddingVertical: spacing.md,
    },
    settingTitle: {
        color: colors.ink,
        fontSize: 14,
        fontWeight: "900",
    },
    timeInput: {
        backgroundColor: colors.bg,
        borderColor: colors.faint,
        borderRadius: radius.md,
        borderWidth: 1,
        color: colors.ink,
        fontSize: 13,
        fontWeight: "800",
        minHeight: 38,
        paddingHorizontal: spacing.sm,
        textAlign: "center",
        width: 74,
    },
    timeButton: {
        alignItems: "center",
        backgroundColor: colors.bg,
        borderColor: colors.faint,
        borderRadius: radius.md,
        borderWidth: 1,
        justifyContent: "center",
        minHeight: 38,
        width: 74,
    },
    timeButtonText: {
        color: colors.ink,
        fontSize: 13,
        fontWeight: "800",
        letterSpacing: 0,
    },
    timePickerWrap: {
        borderTopColor: colors.faint,
        borderTopWidth: 1,
        marginTop: spacing.md,
        paddingTop: spacing.md,
    },
    toggle: {
        alignItems: "center",
        borderColor: colors.faint,
        borderRadius: radius.md,
        borderWidth: 1,
        justifyContent: "center",
        minHeight: 38,
        width: 54,
    },
    toggleActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    toggleText: {
        color: colors.text,
        fontSize: 12,
        fontWeight: "900",
    },
    toggleTextActive: {
        color: "#ffffff",
    },
    unreadItem: {
        backgroundColor: colors.surfaceMuted,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
    },
    webAppCard: {
        backgroundColor: WEB_APP_NOTIF_SURFACE,
        borderColor: WEB_APP_NOTIF_BORDER,
        borderRadius: radius.md,
        shadowOpacity: 0,
    },
    webAppCardMeta: {
        color: WEB_APP_NOTIF_ACCENT,
    },
    webAppCardTitle: {
        color: "#f8fafc",
        fontFamily: undefined,
    },
    webAppIconBox: {
        backgroundColor: WEB_APP_NOTIF_TILE,
        borderColor: WEB_APP_NOTIF_BORDER,
    },
    webAppInboxItem: {
        borderBottomColor: WEB_APP_NOTIF_BORDER,
    },
    webAppMessage: {
        color: WEB_APP_NOTIF_ACCENT,
    },
    webAppPanel: {
        backgroundColor: WEB_APP_NOTIF_TILE,
        borderColor: WEB_APP_NOTIF_BORDER,
    },
    webAppSecondaryButton: {
        backgroundColor: WEB_APP_NOTIF_TILE,
        borderColor: WEB_APP_NOTIF_BORDER,
    },
    webAppSecondaryText: {
        color: "#d1fae5",
    },
    webAppSettingRow: {
        borderBottomColor: WEB_APP_NOTIF_BORDER,
    },
    webAppTab: {
        backgroundColor: WEB_APP_NOTIF_SURFACE,
    },
    webAppTabActive: {
        borderBottomColor: WEB_APP_NOTIF_ACCENT,
    },
    webAppTabs: {
        borderBottomColor: WEB_APP_NOTIF_BORDER,
    },
    webAppTabText: {
        color: WEB_APP_NOTIF_MUTED,
    },
    webAppTabTextActive: {
        color: WEB_APP_NOTIF_ACCENT,
    },
    webAppTextMuted: {
        color: WEB_APP_NOTIF_MUTED,
    },
    webAppTextStrong: {
        color: "#f8fafc",
    },
    webAppTimeInput: {
        backgroundColor: WEB_APP_NOTIF_TILE,
        borderColor: WEB_APP_NOTIF_BORDER,
        color: "#f8fafc",
    },
    webAppToggle: {
        backgroundColor: WEB_APP_NOTIF_TILE,
        borderColor: WEB_APP_NOTIF_BORDER,
    },
    webAppToggleText: {
        color: WEB_APP_NOTIF_MUTED,
    },
});
