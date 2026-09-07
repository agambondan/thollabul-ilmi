import { useCallback, useEffect, useRef, useState } from "react";
import { preferenceKeys, readPreference, writePreference } from "../storage/preferences";

// Tracks the user's last opened Quran ayah so reopening the Quran screen
// jumps straight back into their reading flow. Saved with a 600ms debounce
// so swiping through pages doesn't hammer AsyncStorage.
//
// Stored shape:
//   { ayah_id: number, surah_id: number, position: number, updated_at: number }
const DEBOUNCE_MS = 600;

export function useQuranLastRead() {
    const [lastRead, setLastRead] = useState(null);
    const [loaded, setLoaded] = useState(false);
    const pending = useRef(null);
    const timer = useRef(null);

    useEffect(() => {
        let active = true;
        readPreference(preferenceKeys.quranLastRead, null)
            .then((value) => {
                if (active) {
                    setLastRead(value && typeof value === "object" ? value : null);
                    setLoaded(true);
                }
            })
            .catch(() => {
                if (active) setLoaded(true);
            });
        return () => {
            active = false;
        };
    }, []);

    const save = useCallback((value) => {
        if (!value || typeof value !== "object") return;
        pending.current = value;
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => {
            const toWrite = pending.current;
            timer.current = null;
            pending.current = null;
            if (!toWrite) return;
            writePreference(preferenceKeys.quranLastRead, {
                ...toWrite,
                updated_at: Date.now(),
            }).catch(() => {});
        }, DEBOUNCE_MS);
    }, []);

    useEffect(() => {
        return () => {
            if (timer.current) clearTimeout(timer.current);
        };
    }, []);

    return { lastRead, loaded, save };
}
