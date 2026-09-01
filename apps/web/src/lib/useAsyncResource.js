"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Lazy panel data with an honest failure state.
 *
 * The pattern this replaces was `.catch(() => setData([]))`, which renders a
 * network failure as "there is no tafsir for this ayah". For a knowledge app
 * that is misinformation, not just a rough edge — so a failed load keeps
 * `data` null and raises `error` instead, and the caller can retry.
 */
export const useAsyncResource = (loader) => {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(false);
    const loaderRef = useRef(loader);

    // Callers pass an inline arrow, so `loader` is a new function every
    // render; syncing it in an effect (rather than during render) keeps the
    // latest closure without making `load` a new callback each time.
    useEffect(() => {
        loaderRef.current = loader;
    });

    const load = useCallback(
        async (force = false) => {
            if (!force && data !== null) return;
            setIsLoading(true);
            setError(false);
            try {
                const res = await loaderRef.current();
                if (res && typeof res.ok === "boolean" && !res.ok) {
                    throw new Error(`HTTP ${res.status}`);
                }
                const payload =
                    res && typeof res.json === "function"
                        ? await res.json()
                        : res;
                setData(
                    payload?.items ?? (Array.isArray(payload) ? payload : []),
                );
            } catch {
                setData(null);
                setError(true);
            } finally {
                setIsLoading(false);
            }
            // `data` is read to skip refetching an already-loaded panel.
        },
        [data],
    );

    const retry = useCallback(() => load(true), [load]);

    return { data, isLoading, error, load, retry };
};
