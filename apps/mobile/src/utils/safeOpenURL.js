import { Linking } from "react-native";

const ALLOWED_SCHEMES = new Set(["https:", "http:", "mailto:", "tel:", "geo:"]);

export function isSafeUrl(url) {
    if (!url || typeof url !== "string") return false;
    try {
        const parsed = new URL(url.trim());
        return ALLOWED_SCHEMES.has(parsed.protocol);
    } catch {
        return false;
    }
}

export function sanitizeUrl(url) {
    if (!isSafeUrl(url)) return null;
    try {
        const parsed = new URL(url.trim());
        return parsed.toString();
    } catch {
        return null;
    }
}

export async function safeOpenURL(url, options = {}) {
    const { onError } = options;
    if (!isSafeUrl(url)) {
        const err = new Error(`Blocked unsafe or invalid URL: ${url}`);
        if (onError) onError(err);
        return false;
    }
    try {
        await Linking.openURL(url.trim());
        return true;
    } catch (err) {
        if (onError) onError(err);
        return false;
    }
}
