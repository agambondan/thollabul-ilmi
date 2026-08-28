import { NativeModules, Platform } from "react-native";

export const APP_NOTIFICATION_CHANNEL_ID = "daily-reminders";

let Notifications;
let handlerReady = false;
let notificationsLoadError = null;

const isExpoGo = () => {
    const ownership = NativeModules.ExponentConstants?.appOwnership ?? "";
    const executionEnvironment =
        NativeModules.ExponentConstants?.executionEnvironment ?? "";
    return `${ownership} ${executionEnvironment}`
        .toLowerCase()
        .includes("expo");
};

const loadErrorReason = () => {
    const message = `${notificationsLoadError?.message ?? notificationsLoadError ?? ""}`;
    if (/expo go|sdk 53|remote notifications/i.test(message)) {
        return "expo_go_unsupported";
    }
    return "native_module_unavailable";
};

export const getPushNotificationAvailability = () => {
    if (Platform.OS === "web") {
        return {
            message: "Push native hanya tersedia di Android atau iOS.",
            reason: "unsupported",
            supported: false,
        };
    }

    if (isExpoGo()) {
        return {
            message: "Push remote butuh development build, bukan Expo Go.",
            reason: "expo_go_unsupported",
            supported: false,
        };
    }

    if (notificationsLoadError) {
        return {
            message:
                loadErrorReason() === "expo_go_unsupported"
                    ? "Push remote butuh development build, bukan Expo Go."
                    : "Module notifikasi native belum tersedia di build ini.",
            reason: loadErrorReason(),
            supported: false,
        };
    }

    return {
        message: "Push native belum aktif di perangkat ini.",
        reason: "ready",
        supported: true,
    };
};

export const pushNotificationsSupported = () =>
    getPushNotificationAvailability().supported;

const getNotifications = () => {
    if (Platform.OS === "web") return null;

    if (!Notifications) {
        try {
            Notifications = require("expo-notifications");
            notificationsLoadError = null;
        } catch (error) {
            notificationsLoadError = error;
            return null;
        }
    }

    if (!handlerReady) {
        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldPlaySound: true,
                shouldSetBadge: true,
                shouldShowBanner: true,
                shouldShowList: true,
            }),
        });
        handlerReady = true;
    }

    return Notifications;
};

const resolveDeviceId = () => {
    const scriptURL = NativeModules.SourceCode?.scriptURL ?? "";
    const host = /^[a-z][a-z0-9+.-]*:\/\/([^/:]+)/i.exec(scriptURL)?.[1] ?? "";
    return [Platform.OS, host].filter(Boolean).join(":");
};

const resolveExpoProjectId = () => {
    try {
        const Constants = require("expo-constants").default;
        return (
            Constants?.expoConfig?.extra?.eas?.projectId ??
            Constants?.easConfig?.projectId ??
            Constants?.manifest2?.extra?.eas?.projectId ??
            ""
        );
    } catch {
        return "";
    }
};

export const getPushNotificationRegistration = async () => {
    const availability = getPushNotificationAvailability();
    if (!availability.supported) {
        return {
            granted: false,
            message: availability.message,
            reason: availability.reason,
        };
    }

    const nativeNotifications = getNotifications();
    if (!nativeNotifications) {
        const nextAvailability = getPushNotificationAvailability();
        return {
            granted: false,
            message: nextAvailability.message,
            reason: nextAvailability.reason,
        };
    }

    const existing = await nativeNotifications.getPermissionsAsync();
    let granted =
        existing.granted ||
        existing.ios?.status ===
            nativeNotifications.IosAuthorizationStatus.PROVISIONAL;

    if (!granted) {
        const requested = await nativeNotifications.requestPermissionsAsync({
            ios: {
                allowAlert: true,
                allowBadge: true,
                allowSound: true,
            },
        });
        granted =
            requested.granted ||
            requested.ios?.status ===
                nativeNotifications.IosAuthorizationStatus.PROVISIONAL;
    }

    if (!granted) {
        return { granted: false, reason: "denied" };
    }

    if (Platform.OS === "android") {
        await nativeNotifications.setNotificationChannelAsync(
            APP_NOTIFICATION_CHANNEL_ID,
            {
                importance: nativeNotifications.AndroidImportance.HIGH,
                lightColor: "#5b6e5b",
                name: "Daily Reminders",
                sound: "default",
                vibrationPattern: [0, 250, 250, 250],
            },
        );
    }

    let token = "";
    let tokenError = null;
    try {
        const projectId = resolveExpoProjectId();
        const expoToken = projectId
            ? await nativeNotifications.getExpoPushTokenAsync({ projectId })
            : await nativeNotifications.getExpoPushTokenAsync();
        token = expoToken?.data ?? "";
    } catch (error) {
        tokenError = error;
        token = "";
    }

    if (!token) {
        return {
            deviceId: resolveDeviceId(),
            granted: true,
            message:
                tokenError?.message ??
                "Expo push token belum tersedia. Pastikan development build memakai konfigurasi Expo/EAS push.",
            platform: Platform.OS,
            provider: "expo",
            reason: "token_unavailable",
            token: "",
        };
    }

    return {
        deviceId: resolveDeviceId(),
        granted: true,
        platform: Platform.OS,
        provider: "expo",
        reason: token ? "ready" : "token_unavailable",
        token,
    };
};
