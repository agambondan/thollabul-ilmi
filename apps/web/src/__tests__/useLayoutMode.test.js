import { renderHook, act } from "@testing-library/react";
import { useLayoutMode } from "@/lib/useLayoutMode";

describe("useLayoutMode", () => {
    beforeEach(() => {
        localStorage.clear();
        jest.restoreAllMocks();
    });

    test("defaults to compact (isWide=false)", () => {
        const { result } = renderHook(() => useLayoutMode());
        expect(result.current.isWide).toBe(false);
    });

    test("setLayout(true) sets isWide to true and persists", () => {
        const { result } = renderHook(() => useLayoutMode());
        act(() => result.current.setLayout(true));
        expect(result.current.isWide).toBe(true);
        expect(localStorage.getItem("layoutMode")).toBe("wide");
    });

    test("setLayout(false) sets isWide to false and persists", () => {
        const { result } = renderHook(() => useLayoutMode());
        act(() => result.current.setLayout(false));
        expect(result.current.isWide).toBe(false);
        expect(localStorage.getItem("layoutMode")).toBe("compact");
    });

    test("reads persisted value from localStorage", () => {
        localStorage.setItem("layoutMode", "wide");
        const { result } = renderHook(() => useLayoutMode());
        expect(result.current.isWide).toBe(true);
    });

    test("toggle between wide and compact", () => {
        const { result } = renderHook(() => useLayoutMode());
        act(() => result.current.setLayout(true));
        expect(result.current.isWide).toBe(true);
        act(() => result.current.setLayout(false));
        expect(result.current.isWide).toBe(false);
    });
});
