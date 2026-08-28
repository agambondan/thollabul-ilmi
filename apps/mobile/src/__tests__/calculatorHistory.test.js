import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    deleteCalculatorHistory,
    mergeCalculatorHistory,
    readCalculatorHistory,
    saveCalculatorHistory,
} from "../storage/calculatorHistory";

describe("calculatorHistory storage", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        AsyncStorage.getItem.mockResolvedValue(null);
        AsyncStorage.setItem.mockResolvedValue();
    });

    test("saves and reads local zakat history", async () => {
        AsyncStorage.getItem.mockResolvedValueOnce(null);

        const saved = await saveCalculatorHistory("zakat", {
            jumlah_zakat: 25000,
            nama_jenis: "Zakat Maal",
        });

        expect(saved.id).toContain("local-zakat-");
        expect(saved.is_local).toBe(true);
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
            "tholabul:calculator-history:zakat",
            expect.stringContaining("Zakat Maal"),
        );

        AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify([saved]));
        const items = await readCalculatorHistory("zakat");
        expect(items[0]).toMatchObject({
            is_local: true,
            nama_jenis: "Zakat Maal",
        });
    });

    test("deletes local faraidh history item", async () => {
        AsyncStorage.getItem.mockResolvedValueOnce(
            JSON.stringify([
                { id: "local-faraidh-1", wealth: 1000000 },
                { id: "local-faraidh-2", wealth: 2000000 },
            ]),
        );

        await deleteCalculatorHistory("faraidh", "local-faraidh-1");

        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
            "tholabul:calculator-history:faraidh",
            expect.not.stringContaining("local-faraidh-1"),
        );
    });

    test("merges remote and local history newest first", () => {
        const result = mergeCalculatorHistory(
            [{ id: "remote-1", created_at: "2026-05-16T00:00:00.000Z" }],
            [
                {
                    id: "local-zakat-1",
                    is_local: true,
                    created_at: "2026-05-17T00:00:00.000Z",
                },
            ],
        );

        expect(result.map((item) => item.id)).toEqual([
            "local-zakat-1",
            "remote-1",
        ]);
    });
});
