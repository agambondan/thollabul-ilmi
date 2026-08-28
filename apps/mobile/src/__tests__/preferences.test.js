import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    readPreference,
    writePreference,
    preferenceKeys,
} from "../storage/preferences";

beforeEach(() => {
    jest.clearAllMocks();
});

describe("preferenceKeys", () => {
    test("has expected constants", () => {
        expect(preferenceKeys.homeLastLocation).toBe("home-last-location");
        expect(preferenceKeys.prayerAdjustments).toBe("prayer-adjustments");
        expect(preferenceKeys.appLayoutMode).toBe("app-layout-mode");
        expect(preferenceKeys.quranArabicFont).toBe("quran-arabic-font");
        expect(preferenceKeys.quranDisplayMode).toBe("quran-display-mode");
        expect(preferenceKeys.quranMemorizationMode).toBe(
            "quran-memorization-mode",
        );
    });
});

describe("readPreference", () => {
    test("reads from AsyncStorage with prefixed key", async () => {
        AsyncStorage.getItem.mockResolvedValueOnce('"dark"');
        const result = await readPreference("quran-display-mode");
        expect(AsyncStorage.getItem).toHaveBeenCalledWith(
            "tholabul:pref:quran-display-mode",
        );
        expect(result).toBe("dark");
    });

    test("returns default when nothing stored", async () => {
        AsyncStorage.getItem.mockResolvedValueOnce(null);
        const result = await readPreference("missing-key", "default-val");
        expect(result).toBe("default-val");
    });

    test("returns default on error", async () => {
        AsyncStorage.getItem.mockRejectedValueOnce(new Error("fail"));
        const result = await readPreference("any", false);
        expect(result).toBe(false);
    });
});

describe("writePreference", () => {
    test("writes to AsyncStorage with prefixed key", async () => {
        await writePreference("quran-display-mode", "translation");
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
            "tholabul:pref:quran-display-mode",
            '"translation"',
        );
    });

    test("returns the written value", async () => {
        const result = await writePreference("key", { nested: true });
        expect(result).toEqual({ nested: true });
    });
});
