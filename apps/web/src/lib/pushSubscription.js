const STATIC_VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, "+")
        .replace(/_/g, "/");
    const rawData = typeof window !== "undefined" ? window.atob(base64) : "";
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; i++) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export async function registerServiceWorker() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        return { supported: false, reason: "unsupported" };
    }

    try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
            scope: "/",
            updateViaCache: "none",
        });

        await navigator.serviceWorker.ready;
        return { supported: true, registration };
    } catch (error) {
        return {
            supported: false,
            reason: "registration_failed",
            error: error.message,
        };
    }
}

async function resolveVapidPublicKey(fetcher) {
    if (STATIC_VAPID_PUBLIC_KEY) return STATIC_VAPID_PUBLIC_KEY;
    if (typeof window === "undefined" || !fetcher) return "";
    try {
        const res = await fetcher();
        if (!res || !res.ok) return "";
        const json = await res.json();
        const data = json?.data ?? json ?? {};
        return data.publicKey || data.vapid_public_key || "";
    } catch {
        return "";
    }
}

export async function subscribeToPush(registration, options = {}) {
    if (!registration || !registration.pushManager) {
        return { success: false, reason: "no_registration" };
    }

    let existingSubscription = null;
    try {
        existingSubscription = await registration.pushManager.getSubscription();
    } catch {}

    if (existingSubscription) {
        return {
            success: true,
            subscription: existingSubscription,
            isExisting: true,
        };
    }

    const vapidKey = await resolveVapidPublicKey(options.vapidKeyFetcher);
    if (!vapidKey) {
        return { success: false, reason: "vapid_not_configured" };
    }

    try {
        const applicationServerKey = urlBase64ToUint8Array(vapidKey);
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey,
        });
        return { success: true, subscription, isExisting: false };
    } catch (error) {
        if (error.name === "NotAllowedError") {
            return { success: false, reason: "permission_denied" };
        }
        return {
            success: false,
            reason: "subscribe_failed",
            error: error.message,
        };
    }
}

export async function unsubscribeFromPush(registration) {
    if (!registration || !registration.pushManager) {
        return { success: false };
    }

    try {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
            await subscription.unsubscribe();
        }
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export function subscriptionToPlainObject(subscription) {
    if (!subscription) return null;

    const json = subscription.toJSON();
    return {
        endpoint: json.endpoint,
        keys: json.keys,
    };
}

export async function getPushPermissionStatus() {
    if (!("Notification" in window)) {
        return "unsupported";
    }
    return Notification.permission;
}

export async function requestNotificationPermission() {
    if (!("Notification" in window)) {
        return { granted: false, reason: "unsupported" };
    }

    if (Notification.permission === "granted") {
        return { granted: true };
    }

    if (Notification.permission === "denied") {
        return { granted: false, reason: "denied" };
    }

    try {
        const permission = await Notification.requestPermission();
        return { granted: permission === "granted", reason: permission };
    } catch {
        return { granted: false, reason: "error" };
    }
}
