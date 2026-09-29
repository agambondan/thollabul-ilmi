import { useCallback, useRef } from "react";
import { prefetchImage, prefetchImages } from "./imagePrefetch";

export function useImagePrefetch(options = {}) {
    const { radius = 3 } = options;
    const prefetchedRef = useRef(new Set());

    const prefetch = useCallback(
        (uris) => {
            if (!Array.isArray(uris)) return;
            uris.forEach((uri) => {
                if (uri && !prefetchedRef.current.has(uri)) {
                    prefetchedRef.current.add(uri);
                    prefetchImage(uri);
                }
            });
        },
        [],
    );

    const prefetchFromList = useCallback(
        (items, extractUri, visibleIndices = []) => {
            if (!Array.isArray(items) || items.length === 0) return;

            const indices = new Set(visibleIndices);
            const maxIndex = items.length - 1;

            items.forEach((item, index) => {
                if (indices.has(index)) return;
                const distance = Math.min(
                    ...visibleIndices.map((v) => Math.abs(v - index)),
                );
                if (distance <= radius) {
                    const uri = extractUri(item);
                    if (uri) prefetch(uri);
                }
            });
        },
        [radius, prefetch],
    );

    return { prefetch, prefetchFromList, clear: () => prefetchedRef.current.clear() };
}