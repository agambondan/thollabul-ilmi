"use client";

import { useCallback, useSyncExternalStore } from "react";

const ACTION_POSITION_KEY = "actionPosition";
const DEFAULT_POSITION = "side";
const VALID_POSITIONS = ["side", "menu", "hidden"];

/*
 * This setting is read by every card on card-heavy pages (hadith list,
 * quran ayah list — up to hundreds of instances on one page). Each instance
 * used to run its own useState + localStorage read + "storage" listener,
 * which meant N redundant reads and N redundant global listeners for one
 * shared preference. This hoists it to a single module-level store that
 * every instance subscribes to instead.
 */
let currentPosition = DEFAULT_POSITION;
let initialized = false;
const listeners = new Set();

const readStoredPosition = () => {
    try {
        const stored = localStorage.getItem(ACTION_POSITION_KEY);
        return VALID_POSITIONS.includes(stored) ? stored : DEFAULT_POSITION;
    } catch {
        return DEFAULT_POSITION;
    }
};

const notify = () => listeners.forEach((listener) => listener());

const ensureInitialized = () => {
    if (initialized || typeof window === "undefined") return;
    initialized = true;
    currentPosition = readStoredPosition();
    window.addEventListener("storage", (e) => {
        if (
            e.key === ACTION_POSITION_KEY &&
            VALID_POSITIONS.includes(e.newValue)
        ) {
            currentPosition = e.newValue;
            notify();
        }
    });
};

const subscribe = (listener) => {
    ensureInitialized();
    listeners.add(listener);
    return () => listeners.delete(listener);
};

const getSnapshot = () => {
    ensureInitialized();
    return currentPosition;
};

const getServerSnapshot = () => DEFAULT_POSITION;

export const useActionPosition = () => {
    const position = useSyncExternalStore(
        subscribe,
        getSnapshot,
        getServerSnapshot,
    );

    const setPosition = useCallback((nextPosition) => {
        const value = VALID_POSITIONS.includes(nextPosition)
            ? nextPosition
            : DEFAULT_POSITION;
        try {
            localStorage.setItem(ACTION_POSITION_KEY, value);
        } catch {}
        currentPosition = value;
        notify();
    }, []);

    return {
        isMenu: position === "menu",
        isHidden: position === "hidden",
        position,
        setPosition,
    };
};
