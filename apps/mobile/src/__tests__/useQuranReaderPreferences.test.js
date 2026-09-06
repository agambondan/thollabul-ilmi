import { renderHook, act } from "@testing-library/react-native";

jest.mock("../storage/preferences", () => ({
    preferenceKeys: {
        quranFontSize: "quran-font-size",
        quranArabicFont: "quran-arabic-font",
        quranDisplayMode: "quran-display-mode",
        quranFullscreen: "quran-fullscreen",
        quranMemorizationMode: "quran-memorization-mode",
        quranTranslationFontSize: "quran-translation-font-size",
    },
    readPreference: jest.fn(),
    writePreference: jest.fn(),
}));

import { useQuranReaderPreferences } from "../hooks/useQuranReaderPreferences";
import { readPreference, writePreference } from "../storage/preferences";

describe("useQuranReaderPreferences", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        readPreference.mockResolvedValue(null);
    });

    test("returns default values", async () => {
        const { result } = renderHook(() => useQuranReaderPreferences());
        await act(async () => {});

        expect(result.current.fontSize).toBe(28);
        expect(result.current.translationFontSize).toBe(16);
        expect(result.current.arabicFont).toBe("kitab");
        expect(result.current.displayMode).toBe("card");
        expect(result.current.memorizationMode).toBe("off");
        expect(result.current.fullscreen).toBe(false);
    });

    test("updateFullscreen updates state and persists", async () => {
        const { result } = renderHook(() => useQuranReaderPreferences());
        await act(async () => {});

        await act(async () => {
            await result.current.updateFullscreen(true);
        });

        expect(result.current.fullscreen).toBe(true);
        expect(writePreference).toHaveBeenCalledWith(
            "quran-fullscreen",
            true,
        );
    });

    test("loads saved preferences", async () => {
        readPreference
            .mockResolvedValueOnce(32)
            .mockResolvedValueOnce(18)
            .mockResolvedValueOnce("hide_arabic")
            .mockResolvedValueOnce("indopak")
            .mockResolvedValueOnce("mushaf");

        const { result } = renderHook(() => useQuranReaderPreferences());
        await act(async () => {});

        expect(result.current.fontSize).toBe(32);
        expect(result.current.translationFontSize).toBe(18);
        expect(result.current.arabicFont).toBe("indopak");
        expect(result.current.displayMode).toBe("mushaf");
        expect(result.current.memorizationMode).toBe("hide_arabic");
    });

    test("updateFontSize updates state and persists", async () => {
        const { result } = renderHook(() => useQuranReaderPreferences());
        await act(async () => {});

        await act(async () => {
            await result.current.updateFontSize(24);
        });

        expect(result.current.fontSize).toBe(24);
        expect(writePreference).toHaveBeenCalledWith("quran-font-size", 24);
    });

    test("updateFontSize clamps below minimum", async () => {
        const { result } = renderHook(() => useQuranReaderPreferences());
        await act(async () => {});

        await act(async () => {
            await result.current.updateFontSize(5);
        });

        expect(result.current.fontSize).toBe(14);
        expect(writePreference).toHaveBeenCalledWith("quran-font-size", 14);
    });

    test("updateFontSize clamps above maximum", async () => {
        const { result } = renderHook(() => useQuranReaderPreferences());
        await act(async () => {});

        await act(async () => {
            await result.current.updateFontSize(100);
        });

        expect(result.current.fontSize).toBe(48);
        expect(writePreference).toHaveBeenCalledWith("quran-font-size", 48);
    });

    test("updateTranslationFontSize updates state and persists", async () => {
        const { result } = renderHook(() => useQuranReaderPreferences());
        await act(async () => {});

        await act(async () => {
            await result.current.updateTranslationFontSize(20);
        });

        expect(result.current.translationFontSize).toBe(20);
        expect(writePreference).toHaveBeenCalledWith(
            "quran-translation-font-size",
            20,
        );
    });

    test("updateTranslationFontSize clamps to web-aligned bounds", async () => {
        const { result } = renderHook(() => useQuranReaderPreferences());
        await act(async () => {});

        await act(async () => {
            await result.current.updateTranslationFontSize(5);
        });
        expect(result.current.translationFontSize).toBe(12);
        expect(writePreference).toHaveBeenCalledWith(
            "quran-translation-font-size",
            12,
        );

        await act(async () => {
            await result.current.updateTranslationFontSize(100);
        });
        expect(result.current.translationFontSize).toBe(28);
        expect(writePreference).toHaveBeenCalledWith(
            "quran-translation-font-size",
            28,
        );
    });

    test("updateArabicFont updates and persists a valid font", async () => {
        const { result } = renderHook(() => useQuranReaderPreferences());
        await act(async () => {});

        await act(async () => {
            await result.current.updateArabicFont("indopak");
        });

        expect(result.current.arabicFont).toBe("indopak");
        expect(writePreference).toHaveBeenCalledWith(
            "quran-arabic-font",
            "indopak",
        );
    });

    test("updateArabicFont rejects invalid font", async () => {
        const { result } = renderHook(() => useQuranReaderPreferences());
        await act(async () => {});

        await act(async () => {
            await result.current.updateArabicFont("invalid-font");
        });

        expect(result.current.arabicFont).toBe("kitab");
        expect(writePreference).not.toHaveBeenCalled();
    });

    test("updateArabicFont normalizes legacy keys", async () => {
        const { result } = renderHook(() => useQuranReaderPreferences());
        await act(async () => {});

        await act(async () => {
            await result.current.updateArabicFont("amiri");
        });

        expect(result.current.arabicFont).toBe("naskh");
        expect(writePreference).toHaveBeenCalledWith(
            "quran-arabic-font",
            "naskh",
        );
    });

    test("updateDisplayMode updates and persists", async () => {
        const { result } = renderHook(() => useQuranReaderPreferences());
        await act(async () => {});

        await act(async () => {
            await result.current.updateDisplayMode("line");
        });

        expect(result.current.displayMode).toBe("line");
        expect(writePreference).toHaveBeenCalledWith(
            "quran-display-mode",
            "line",
        );
    });

    test("updateDisplayMode rejects invalid mode", async () => {
        const { result } = renderHook(() => useQuranReaderPreferences());
        await act(async () => {});

        await act(async () => {
            await result.current.updateDisplayMode("invalid");
        });

        expect(result.current.displayMode).toBe("card");
        expect(writePreference).not.toHaveBeenCalled();
    });

    test('updateDisplayMode normalizes "normal" to "card"', async () => {
        const { result } = renderHook(() => useQuranReaderPreferences());
        await act(async () => {});

        await act(async () => {
            await result.current.updateDisplayMode("normal");
        });

        expect(result.current.displayMode).toBe("card");
        expect(writePreference).toHaveBeenCalledWith(
            "quran-display-mode",
            "card",
        );
    });

    test("updateMemorizationMode updates and calls callback", async () => {
        const onMemorizationModeChange = jest.fn();
        const { result } = renderHook(() =>
            useQuranReaderPreferences({ onMemorizationModeChange }),
        );
        await act(async () => {});

        await act(async () => {
            await result.current.updateMemorizationMode("hide_translation");
        });

        expect(result.current.memorizationMode).toBe("hide_translation");
        expect(writePreference).toHaveBeenCalledWith(
            "quran-memorization-mode",
            "hide_translation",
        );
        expect(onMemorizationModeChange).toHaveBeenCalledWith(
            "hide_translation",
        );
    });

    test("updateMemorizationMode rejects invalid mode", async () => {
        const { result } = renderHook(() => useQuranReaderPreferences());
        await act(async () => {});

        await act(async () => {
            await result.current.updateMemorizationMode("invalid");
        });

        expect(result.current.memorizationMode).toBe("off");
        expect(writePreference).not.toHaveBeenCalled();
    });

    test("clamps fontSize from saved preference below minimum", async () => {
        readPreference.mockResolvedValueOnce(5);

        const { result } = renderHook(() => useQuranReaderPreferences());
        await act(async () => {});

        expect(result.current.fontSize).toBe(14);
    });

    test("loads saved memorization mode picks valid values only", async () => {
        readPreference.mockResolvedValue("invalid-mode");

        const { result } = renderHook(() => useQuranReaderPreferences());
        await act(async () => {});

        expect(result.current.memorizationMode).toBe("off");
    });
});
