import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import {
    DEFAULT_TASBIH_TARGET,
    addTasbihTotal,
    clampTasbihCount,
    clampTasbihTarget,
    clearTasbihTotal,
    getTasbihTodayTotal,
    readTasbihState,
    writeTasbihState,
} from "../storage/tasbih";

export const TASBIH_SAVE_DEBOUNCE_MS = 400;

const INITIAL_TASBIH = { count: 0, target: DEFAULT_TASBIH_TARGET };

export function useTasbihPersistence({
    debounceMs = TASBIH_SAVE_DEBOUNCE_MS,
} = {}) {
    const [tasbih, setTasbihState] = useState(INITIAL_TASBIH);
    const [totals, setTotalsState] = useState({});
    const tasbihRef = useRef(INITIAL_TASBIH);
    const totalsRef = useRef({});
    const hydratedRef = useRef(false);
    const changedRef = useRef(false);
    const dirtyRef = useRef(false);
    const pendingGainRef = useRef(0);
    const timerRef = useRef(null);

    const flush = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        if (!hydratedRef.current || !dirtyRef.current) return;
        dirtyRef.current = false;
        writeTasbihState({
            ...tasbihRef.current,
            totals: totalsRef.current,
        }).catch(() => {
            dirtyRef.current = true;
        });
    }, []);

    const scheduleSave = useCallback(() => {
        dirtyRef.current = true;
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(flush, debounceMs);
    }, [debounceMs, flush]);

    useEffect(() => {
        let active = true;
        readTasbihState()
            .then((saved) => {
                if (!active) return;
                hydratedRef.current = true;
                if (changedRef.current) {
                    totalsRef.current = addTasbihTotal(
                        saved.totals,
                        pendingGainRef.current,
                    );
                    setTotalsState(totalsRef.current);
                    scheduleSave();
                    return;
                }
                tasbihRef.current = {
                    count: saved.count,
                    target: saved.target,
                };
                totalsRef.current = saved.totals;
                setTasbihState(tasbihRef.current);
                setTotalsState(saved.totals);
            })
            .catch(() => {
                hydratedRef.current = true;
            });
        return () => {
            active = false;
        };
    }, [scheduleSave]);

    useEffect(() => {
        const subscription = AppState.addEventListener(
            "change",
            (nextState) => {
                if (nextState !== "active") flush();
            },
        );
        return () => {
            subscription?.remove?.();
            flush();
        };
    }, [flush]);

    const setTasbih = useCallback(
        (updater) => {
            const current = tasbihRef.current;
            const requested =
                typeof updater === "function" ? updater(current) : updater;
            const next = {
                count: clampTasbihCount(requested?.count),
                target:
                    requested?.target === undefined
                        ? current.target
                        : clampTasbihTarget(requested.target),
            };
            const gained = next.count - current.count;

            tasbihRef.current = next;
            changedRef.current = true;
            setTasbihState(next);
            if (gained > 0) {
                if (!hydratedRef.current) pendingGainRef.current += gained;
                totalsRef.current = addTasbihTotal(totalsRef.current, gained);
                setTotalsState(totalsRef.current);
            }
            scheduleSave();
        },
        [scheduleSave],
    );

    const resetTodayTotal = useCallback(() => {
        pendingGainRef.current = 0;
        changedRef.current = true;
        totalsRef.current = clearTasbihTotal(totalsRef.current);
        setTotalsState(totalsRef.current);
        scheduleSave();
    }, [scheduleSave]);

    return {
        resetTodayTotal,
        setTasbih,
        tasbih,
        todayTotal: getTasbihTodayTotal(totals),
    };
}
