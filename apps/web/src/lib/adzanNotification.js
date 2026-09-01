const ICON = "/icon.png";

const tryRegistrationNotify = async (title, body, url) => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
        return false;
    }
    try {
        const reg = await navigator.serviceWorker.ready;
        await reg.showNotification(title, {
            body,
            icon: ICON,
            badge: ICON,
            vibrate: [200, 100, 200],
            data: { url, type: "adzan" },
        });
        return true;
    } catch {
        return false;
    }
};

const tryControllerPost = (title, body, url) => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
        return false;
    }
    const controller = navigator.serviceWorker.controller;
    if (!controller) return false;
    controller.postMessage({ type: "ADZAN_NOTIFICATION", title, body, url });
    return true;
};

const tryPageNotification = (title, body) => {
    if (typeof window === "undefined") return false;
    if (typeof Notification === "undefined") return false;
    if (Notification.permission !== "granted") return false;
    try {
        new Notification(title, { body, icon: ICON });
        return true;
    } catch {
        return false;
    }
};

export const fireAdzanNotification = async (title, body, url = "/jadwal-sholat") => {
    if (tryControllerPost(title, body, url)) return;
    if (tryPageNotification(title, body)) return;
    await tryRegistrationNotify(title, body, url);
};
