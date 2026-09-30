import { useEffect, useRef, useState } from "react";

export const MAX_AUTO_LOAD_PAGES = 12;

export function useAutoLoadMore({
    active = false,
    busy = false,
    error = false,
    hasMore = false,
    maxPages = MAX_AUTO_LOAD_PAGES,
    onLoadMore,
    resetKey = "",
}) {
    const attemptsRef = useRef(0);
    const [attempts, setAttempts] = useState(0);

    useEffect(() => {
        attemptsRef.current = 0;
        setAttempts(0);
    }, [resetKey]);

    useEffect(() => {
        if (!active || !hasMore || busy || error) return;
        if (typeof onLoadMore !== "function") return;
        if (attemptsRef.current >= maxPages) return;

        attemptsRef.current += 1;
        setAttempts(attemptsRef.current);
        onLoadMore();
    }, [active, busy, error, hasMore, maxPages, onLoadMore, resetKey]);

    return {
        autoLoading:
            Boolean(active && hasMore && !error) &&
            typeof onLoadMore === "function" &&
            attempts < maxPages,
    };
}
