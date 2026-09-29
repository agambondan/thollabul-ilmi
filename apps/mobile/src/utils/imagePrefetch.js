import { Image, Platform } from "react-native";

const prefetchedUrls = new Set();

export async function prefetchImage(uri) {
    if (!uri || typeof uri !== "string" || prefetchedUrls.has(uri)) return false;
    prefetchedUrls.add(uri);
    if (Platform.OS === "web") {
        return true;
    }
    try {
        await Image.prefetch(uri);
        return true;
    } catch {
        return false;
    }
}

export function prefetchImages(uris = []) {
    if (!Array.isArray(uris)) return;
    uris.forEach((uri) => {
        if (uri) prefetchImage(uri);
    });
}

export function clearPrefetchCache() {
    prefetchedUrls.clear();
}
