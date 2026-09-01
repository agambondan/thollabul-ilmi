import { renderHook, act, waitFor } from "@testing-library/react";
import { useQuranFont, QURAN_FONTS } from "@/lib/useQuranFont";
import { SettingsProvider } from "@/lib/useSettings";
import { AuthProvider } from "@/context/Auth";

// Reading preferences moved into the synced settings object so the Settings
// page and the reader's gear button drive the same values. Persistence is
// therefore asserted against `tholabul_app_settings`, not the old per-key
// entries — those are only read once, to migrate an existing user forward.
const SETTINGS_KEY = "tholabul_app_settings";

const wrapper = ({ children }) => (
    <AuthProvider>
        <SettingsProvider>{children}</SettingsProvider>
    </AuthProvider>
);

const renderFont = () => renderHook(() => useQuranFont(), { wrapper });

const stored = () => JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "{}");

describe("useQuranFont", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    test("defaults to LPMQ font", () => {
        const { result } = renderFont();
        expect(result.current.fontId).toBe("lpmq");
        expect(result.current.fontCls).toBe("font-lpmq");
    });

    test("setFont changes font", () => {
        const { result } = renderFont();
        act(() => result.current.setFont("indopak"));
        expect(result.current.fontId).toBe("indopak");
        expect(result.current.fontCls).toBe("font-nh");
    });

    test("setFont persists to the settings store", () => {
        const { result } = renderFont();
        act(() => result.current.setFont("naskh"));
        expect(stored().quranFontId).toBe("naskh");
    });

    test("reads a persisted font from the settings store", () => {
        localStorage.setItem(
            SETTINGS_KEY,
            JSON.stringify({ quranFontId: "naskh" }),
        );
        const { result } = renderFont();
        expect(result.current.fontId).toBe("naskh");
        expect(result.current.fontCls).toBe("font-scheherazade");
    });

    test("ignores an invalid persisted font", () => {
        localStorage.setItem(
            SETTINGS_KEY,
            JSON.stringify({ quranFontId: "invalid-font" }),
        );
        const { result } = renderFont();
        expect(result.current.fontId).toBe("lpmq");
    });

    test("migrates the reader's legacy localStorage keys", () => {
        localStorage.setItem("quranFont", "kitab");
        localStorage.setItem("quranArabicFontSize", "48");
        localStorage.setItem("quranTranslationFontSize", "20");

        const { result } = renderFont();

        expect(result.current.fontId).toBe("kitab");
        expect(result.current.arabicFontSize).toBe(48);
        expect(result.current.translationFontSize).toBe(20);
    });

    test("migrates the old Settings-page font name", () => {
        localStorage.setItem(
            SETTINGS_KEY,
            JSON.stringify({ quranFont: "Scheherazade", readerSize: 30 }),
        );
        const { result } = renderFont();
        expect(result.current.fontId).toBe("naskh");
        expect(result.current.arabicFontSize).toBe(30);
    });

    test("clamps a persisted arabic font size to the 14px minimum", async () => {
        localStorage.setItem(
            SETTINGS_KEY,
            JSON.stringify({ quranArabicSize: 10 }),
        );
        const { result } = renderFont();
        await waitFor(() => expect(result.current.arabicFontSize).toBe(14));
    });

    test("does not decrease arabic font size below 14px", () => {
        const { result } = renderFont();

        act(() => result.current.setArabicFontSize(14));
        act(() => result.current.decreaseArabicFontSize());

        expect(result.current.arabicFontSize).toBe(14);
        expect(stored().quranArabicSize).toBe(14);
    });

    test("clamps a persisted translation font size to the 12px minimum", async () => {
        localStorage.setItem(
            SETTINGS_KEY,
            JSON.stringify({ quranTranslationSize: 8 }),
        );
        const { result } = renderFont();
        await waitFor(() =>
            expect(result.current.translationFontSize).toBe(12),
        );
    });

    test("does not decrease translation font size below 12px", () => {
        const { result } = renderFont();

        act(() => result.current.setTranslationFontSize(12));
        act(() => result.current.decreaseTranslationFontSize());

        expect(result.current.translationFontSize).toBe(12);
        expect(stored().quranTranslationSize).toBe(12);
    });

    test("persists and resets translation font size", () => {
        const { result } = renderFont();

        act(() => result.current.setTranslationFontSize(22));
        expect(result.current.translationFontSize).toBe(22);
        expect(stored().quranTranslationSize).toBe(22);

        act(() => result.current.resetTranslationFontSize());
        expect(result.current.translationFontSize).toBe(16);
        expect(stored().quranTranslationSize).toBe(16);
    });

    test("QURAN_FONTS has correct structure", () => {
        expect(QURAN_FONTS.length).toBeGreaterThanOrEqual(3);
        QURAN_FONTS.forEach((f) => {
            expect(f).toHaveProperty("id");
            expect(f).toHaveProperty("label");
            expect(f).toHaveProperty("cls");
        });
    });
});
