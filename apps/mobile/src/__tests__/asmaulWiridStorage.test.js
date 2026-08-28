import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    readAsmaulWiridCounts,
    saveAsmaulWiridCounts,
    setAsmaulWiridCount,
} from "../storage/asmaulWirid";

describe("asmaul wirid storage", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        AsyncStorage.getItem.mockResolvedValue(null);
        AsyncStorage.setItem.mockResolvedValue();
    });

    test("reads persisted counts and filters invalid values", async () => {
        AsyncStorage.getItem.mockResolvedValueOnce(
            JSON.stringify({ 1: 12, 2: "bad", 3: 0, 4: 33.8 }),
        );

        await expect(readAsmaulWiridCounts()).resolves.toEqual({
            1: 12,
            4: 33,
        });
    });

    test("saves normalized counts", async () => {
        const saved = await saveAsmaulWiridCounts({ 1: 12.8, 2: 0, 3: -1 });

        expect(saved).toEqual({ 1: 12 });
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
            "tholabul:asmaul-wirid-counts",
            '{"1":12}',
        );
    });

    test("removes a count when reset to zero", async () => {
        const saved = await setAsmaulWiridCount({ 1: 12, 2: 5 }, "1", 0);

        expect(saved).toEqual({ 2: 5 });
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
            "tholabul:asmaul-wirid-counts",
            '{"2":5}',
        );
    });
});
