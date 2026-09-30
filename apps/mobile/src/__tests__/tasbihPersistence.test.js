jest.mock("lucide-react-native", () => {
    const icon = () => null;
    return new Proxy(
        {},
        {
            get: (target, prop) => {
                if (prop === "__esModule") return false;
                if (!target[prop]) target[prop] = icon;
                return target[prop];
            },
        },
    );
});

jest.mock("../utils/haptics", () => ({
    hapticTap: jest.fn(),
}));

import React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState, StyleSheet } from "react-native";
import {
    act,
    fireEvent,
    render,
    renderHook,
} from "@testing-library/react-native";

import {
    TASBIH_SAVE_DEBOUNCE_MS,
    useTasbihPersistence,
} from "../hooks/useTasbihPersistence";
import { WebAppTasbihRoute } from "../screens/explore/WebAppTasbihRoute";
import {
    DEFAULT_TASBIH_TARGET,
    MAX_TASBIH_DAILY_HISTORY,
    MAX_TASBIH_TARGET,
    addTasbihTotal,
    clampTasbihCount,
    clampTasbihTarget,
    clearTasbihTotal,
    getTasbihDateKey,
    getTasbihTodayTotal,
    normalizeTasbihState,
    normalizeTasbihTotals,
    readTasbihState,
    writeTasbihState,
} from "../storage/tasbih";
import { flushAsyncWork } from "../test-utils/async";

const STORAGE_KEY = "tholabul:pref:tasbih-state";

const readStored = async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
};

beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
});

afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
});

describe("tasbih storage helpers (B17, B25)", () => {
    test("clamps the target so long input can never become Infinity", () => {
        expect(clampTasbihTarget("9".repeat(25))).toBe(MAX_TASBIH_TARGET);
        expect(clampTasbihTarget(Infinity)).toBe(0);
        expect(clampTasbihTarget("123456")).toBe(MAX_TASBIH_TARGET);
        expect(clampTasbihTarget("313")).toBe(313);
        expect(clampTasbihTarget("")).toBe(0);
        expect(clampTasbihTarget(-5)).toBe(0);
        expect(clampTasbihTarget("abc")).toBe(0);
        expect(Number.isFinite(clampTasbihTarget("9".repeat(400)))).toBe(true);
    });

    test("clamps the count to a non-negative integer", () => {
        expect(clampTasbihCount(7.9)).toBe(7);
        expect(clampTasbihCount(-3)).toBe(0);
        expect(clampTasbihCount(undefined)).toBe(0);
        expect(clampTasbihCount("12")).toBe(12);
    });

    test("uses the default target only when none was saved", () => {
        expect(normalizeTasbihState(null).target).toBe(DEFAULT_TASBIH_TARGET);
        expect(normalizeTasbihState({ count: 4 }).target).toBe(
            DEFAULT_TASBIH_TARGET,
        );
        expect(normalizeTasbihState({ count: 4, target: 0 }).target).toBe(0);
        expect(
            normalizeTasbihState({ count: 4, target: "99999999999" }).target,
        ).toBe(MAX_TASBIH_TARGET);
    });

    test("keeps per-day totals keyed by local date and prunes old days", () => {
        const now = new Date(2026, 8, 30, 23, 59);
        let totals = {};
        totals = addTasbihTotal(totals, 5, now);
        totals = addTasbihTotal(totals, 2, now);
        expect(totals).toEqual({ "2026-09-30": 7 });
        expect(getTasbihTodayTotal(totals, now)).toBe(7);
        expect(getTasbihTodayTotal(totals, new Date(2026, 9, 1, 0, 1))).toBe(0);

        const many = {};
        for (let day = 1; day <= 25; day += 1) {
            many[`2026-08-${`${day}`.padStart(2, "0")}`] = day;
        }
        const pruned = normalizeTasbihTotals({
            ...many,
            "not-a-date": 9,
            "2026-09-01": 0,
        });
        expect(Object.keys(pruned)).toHaveLength(MAX_TASBIH_DAILY_HISTORY);
        expect(pruned["2026-08-25"]).toBe(25);
        expect(pruned["2026-08-01"]).toBeUndefined();
        expect(pruned["not-a-date"]).toBeUndefined();
    });

    test("builds the date key from local date parts, not UTC", () => {
        expect(getTasbihDateKey(new Date(2026, 9, 1, 5, 0))).toBe("2026-10-01");
        expect(getTasbihDateKey(new Date(2026, 9, 1, 0, 5))).toBe("2026-10-01");
    });

    test("clears only today's total", () => {
        const now = new Date(2026, 8, 30, 10, 0);
        const totals = { "2026-09-29": 40, "2026-09-30": 12 };
        expect(clearTasbihTotal(totals, now)).toEqual({ "2026-09-29": 40 });
    });

    test("round-trips through the preference store", async () => {
        await writeTasbihState({
            count: 9,
            target: 7,
            totals: { "2026-09-30": 21 },
        });
        expect(await readStored()).toEqual({
            count: 9,
            target: 7,
            totals: { "2026-09-30": 21 },
        });
        expect(await readTasbihState()).toEqual({
            count: 9,
            target: 7,
            totals: { "2026-09-30": 21 },
        });
    });

    test("falls back to defaults when the stored value is corrupt", async () => {
        await AsyncStorage.setItem(STORAGE_KEY, "{not json");
        expect(await readTasbihState()).toEqual({
            count: 0,
            target: DEFAULT_TASBIH_TARGET,
            totals: {},
        });
    });
});

describe("useTasbihPersistence (B17)", () => {
    test("restores count, target and today's total after a restart", async () => {
        const today = getTasbihDateKey();
        await AsyncStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
                count: 9,
                target: 7,
                totals: { [today]: 4, "2000-01-01": 99 },
            }),
        );

        const { result } = renderHook(() => useTasbihPersistence());
        expect(result.current.tasbih).toEqual({ count: 0, target: 33 });
        await flushAsyncWork();

        expect(result.current.tasbih).toEqual({ count: 9, target: 7 });
        expect(result.current.todayTotal).toBe(4);
    });

    test("saves taps after a debounce and keeps a running daily total", async () => {
        jest.useFakeTimers();
        const { result } = renderHook(() => useTasbihPersistence());
        await flushAsyncWork();

        act(() => {
            result.current.setTasbih((current) => ({
                ...current,
                count: current.count + 1,
            }));
            result.current.setTasbih((current) => ({
                ...current,
                count: current.count + 1,
            }));
            result.current.setTasbih((current) => ({
                ...current,
                count: current.count + 1,
            }));
        });
        expect(result.current.tasbih.count).toBe(3);
        expect(result.current.todayTotal).toBe(3);
        expect(await readStored()).toBeNull();

        await act(async () => {
            jest.advanceTimersByTime(TASBIH_SAVE_DEBOUNCE_MS + 10);
        });
        await flushAsyncWork();

        expect(await readStored()).toEqual({
            count: 3,
            target: 33,
            totals: { [getTasbihDateKey()]: 3 },
        });
    });

    test("writes once for a burst of taps", async () => {
        jest.useFakeTimers();
        const { result } = renderHook(() => useTasbihPersistence());
        await flushAsyncWork();
        AsyncStorage.setItem.mockClear();

        for (let tap = 0; tap < 10; tap += 1) {
            act(() => {
                result.current.setTasbih((current) => ({
                    ...current,
                    count: current.count + 1,
                }));
            });
        }
        await act(async () => {
            jest.advanceTimersByTime(TASBIH_SAVE_DEBOUNCE_MS + 10);
        });
        await flushAsyncWork();

        expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);
    });

    test("flushes immediately when the app goes to the background", async () => {
        jest.useFakeTimers();
        let appStateListener;
        jest.spyOn(AppState, "addEventListener").mockImplementation(
            (_event, handler) => {
                appStateListener = handler;
                return { remove: jest.fn() };
            },
        );
        const { result } = renderHook(() => useTasbihPersistence());
        await flushAsyncWork();

        act(() => {
            result.current.setTasbih({ count: 12, target: 100 });
        });
        expect(await readStored()).toBeNull();

        await act(async () => {
            appStateListener("background");
        });
        await flushAsyncWork();

        expect(await readStored()).toEqual({
            count: 12,
            target: 100,
            totals: { [getTasbihDateKey()]: 12 },
        });
    });

    test("flushes pending changes on unmount", async () => {
        jest.useFakeTimers();
        const { result, unmount } = renderHook(() => useTasbihPersistence());
        await flushAsyncWork();

        act(() => {
            result.current.setTasbih({ count: 5, target: 33 });
        });
        unmount();
        await flushAsyncWork();

        expect((await readStored()).count).toBe(5);
    });

    test("resetting the count does not reduce today's total, resetting the total does", async () => {
        const { result } = renderHook(() => useTasbihPersistence());
        await flushAsyncWork();

        act(() => {
            result.current.setTasbih({ count: 8, target: 33 });
        });
        act(() => {
            result.current.setTasbih((current) => ({ ...current, count: 0 }));
        });
        expect(result.current.tasbih.count).toBe(0);
        expect(result.current.todayTotal).toBe(8);

        act(() => {
            result.current.setTasbih({ count: 2, target: 33 });
        });
        expect(result.current.todayTotal).toBe(10);

        act(() => {
            result.current.resetTodayTotal();
        });
        expect(result.current.todayTotal).toBe(0);
    });

    test("starts a fresh total on a new local day", async () => {
        jest.useFakeTimers().setSystemTime(new Date(2026, 8, 30, 23, 50));
        const { result } = renderHook(() => useTasbihPersistence());
        await flushAsyncWork();

        act(() => {
            result.current.setTasbih({ count: 6, target: 33 });
        });
        expect(result.current.todayTotal).toBe(6);

        jest.setSystemTime(new Date(2026, 9, 1, 0, 10));
        act(() => {
            result.current.setTasbih((current) => ({
                ...current,
                count: current.count + 1,
            }));
        });
        expect(result.current.todayTotal).toBe(1);
    });

    test("clamps an oversized target coming from the setter", async () => {
        const { result } = renderHook(() => useTasbihPersistence());
        await flushAsyncWork();

        act(() => {
            result.current.setTasbih({ count: 0, target: "9".repeat(25) });
        });
        expect(result.current.tasbih.target).toBe(MAX_TASBIH_TARGET);
    });

    test("keeps taps made before the stored state finished loading", async () => {
        const today = getTasbihDateKey();
        await AsyncStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ count: 50, target: 100, totals: { [today]: 10 } }),
        );
        const { result } = renderHook(() => useTasbihPersistence());

        act(() => {
            result.current.setTasbih((current) => ({
                ...current,
                count: current.count + 1,
            }));
        });
        await flushAsyncWork();

        expect(result.current.tasbih.count).toBe(1);
        expect(result.current.todayTotal).toBe(11);
    });
});

function TasbihHarness() {
    const { resetTodayTotal, setTasbih, tasbih, todayTotal } =
        useTasbihPersistence();
    return (
        <WebAppTasbihRoute
            onResetTodayTotal={resetTodayTotal}
            setTasbih={setTasbih}
            tasbih={tasbih}
            todayTotal={todayTotal}
        />
    );
}

describe("Tasbih route (B17, B25)", () => {
    const renderRoute = async () => {
        const view = render(<TasbihHarness />);
        await flushAsyncWork();
        return view;
    };

    const tapCounter = (view, times) => {
        for (let tap = 0; tap < times; tap += 1) {
            fireEvent.press(view.getByTestId("web-app-tasbih-counter"));
        }
    };

    test("Total Hari Ini is a persisted total that survives leaving the screen", async () => {
        jest.useFakeTimers();
        const first = await renderRoute();
        tapCounter(first, 4);
        expect(first.getAllByText("4")).toHaveLength(3);
        fireEvent.press(first.getByText("Reset"));
        expect(first.getAllByText("4")).toHaveLength(1);
        first.unmount();
        await flushAsyncWork();

        const second = await renderRoute();
        expect(second.getByText("Total Hari Ini")).toBeTruthy();
        expect(second.getAllByText("4")).toHaveLength(1);
        expect(second.getAllByText("0")).toHaveLength(2);
    });

    test("Total Hari Ini starts at 0 before anything was counted", async () => {
        const view = await renderRoute();
        expect(view.getAllByText("0")).toHaveLength(3);
    });

    test("count and target come back after the process is restarted", async () => {
        jest.useFakeTimers();
        const first = await renderRoute();
        fireEvent.changeText(
            first.getByTestId("web-app-tasbih-target-input"),
            "7",
        );
        tapCounter(first, 9);
        first.unmount();
        await flushAsyncWork();

        const second = await renderRoute();
        expect(second.getByText("/ 7")).toBeTruthy();
        expect(second.getByTestId("web-app-tasbih-counter")).toBeTruthy();
        expect(
            second.getByLabelText("Tambah hitungan tasbih, saat ini 9 dari 7"),
        ).toBeTruthy();
    });

    test("the total keeps growing when the count is reset and only clears on Reset Semua", async () => {
        const view = await renderRoute();
        tapCounter(view, 3);
        fireEvent.press(view.getByText("Reset"));
        tapCounter(view, 2);

        expect(view.getByLabelText(/saat ini 2 dari 33/)).toBeTruthy();
        expect(view.getAllByText("5").length).toBeGreaterThanOrEqual(1);

        fireEvent.press(view.getByText("Reset Semua"));
        expect(view.getByLabelText(/saat ini 0 dari 33/)).toBeTruthy();
        expect(view.queryByText("5")).toBeNull();
    });

    test("a 25 digit target is cut to the maximum instead of becoming Infinity", async () => {
        const view = await renderRoute();
        const input = view.getByTestId("web-app-tasbih-target-input");

        fireEvent.changeText(input, "9".repeat(25));

        expect(
            view.getByTestId("web-app-tasbih-target-input").props.value,
        ).toBe(`${MAX_TASBIH_TARGET}`);
        expect(view.queryByText(/Infinity/)).toBeNull();
        expect(view.queryByLabelText(/Infinity/)).toBeNull();
        expect(view.getByText(`/ ${MAX_TASBIH_TARGET}`)).toBeTruthy();
        expect(input.props.maxLength).toBe(`${MAX_TASBIH_TARGET}`.length);
    });

    test("the target field can be emptied without snapping back to 0", async () => {
        const view = await renderRoute();
        const input = view.getByTestId("web-app-tasbih-target-input");
        expect(input.props.value).toBe("33");

        fireEvent.changeText(input, "");
        expect(
            view.getByTestId("web-app-tasbih-target-input").props.value,
        ).toBe("");
        expect(view.queryByDisplayValue("0")).toBeNull();

        fireEvent.changeText(input, "1");
        fireEvent.changeText(input, "10");
        expect(
            view.getByTestId("web-app-tasbih-target-input").props.value,
        ).toBe("10");
        expect(view.getByText("/ 10")).toBeTruthy();
    });

    test("an empty target means no limit and stays empty after blur", async () => {
        const view = await renderRoute();
        const input = view.getByTestId("web-app-tasbih-target-input");

        fireEvent.changeText(input, "");
        fireEvent(input, "blur");

        expect(
            view.getByTestId("web-app-tasbih-target-input").props.value,
        ).toBe("");
        expect(view.getByText("Tap untuk hitung")).toBeTruthy();
        expect(view.getByText("∞")).toBeTruthy();
    });

    test("typing a target keeps the running count, presets start a new round", async () => {
        const view = await renderRoute();
        tapCounter(view, 5);

        fireEvent.changeText(
            view.getByTestId("web-app-tasbih-target-input"),
            "100",
        );
        expect(view.getByLabelText(/saat ini 5 dari 100/)).toBeTruthy();

        fireEvent.press(view.getByText("313"));
        expect(view.getByLabelText(/saat ini 0 dari 313/)).toBeTruthy();
        expect(
            view.getByTestId("web-app-tasbih-target-input").props.value,
        ).toBe("313");
    });

    test("the count may still pass the target", async () => {
        const view = await renderRoute();
        fireEvent.changeText(
            view.getByTestId("web-app-tasbih-target-input"),
            "2",
        );
        tapCounter(view, 4);

        expect(view.getByLabelText(/saat ini 4 dari 2/)).toBeTruthy();
        const progress = view.getByText("100%");
        expect(StyleSheet.flatten(progress.props.style)).toBeTruthy();
    });
});
