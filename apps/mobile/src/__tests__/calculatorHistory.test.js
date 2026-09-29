let calculatorTable = [];

const mockRunAsync = jest.fn((sql, params = []) => {
    if (sql.includes("INSERT OR REPLACE")) {
        const [id, type, payload, createdAt, synced] = params;
        const existingIdx = calculatorTable.findIndex((r) => r.id === id);
        const entry = { id, type, payload, created_at: createdAt, synced: synced || 0 };
        if (existingIdx >= 0) {
            calculatorTable[existingIdx] = entry;
        } else {
            calculatorTable.push(entry);
        }
    } else if (sql.includes("DELETE FROM calculator_history WHERE type = ? AND id = ?")) {
        const [type, id] = params;
        calculatorTable = calculatorTable.filter((r) => !(r.type === type && r.id === id));
    } else if (sql.includes("DELETE FROM calculator_history WHERE type = ?")) {
        const [type] = params;
        calculatorTable = calculatorTable.filter((r) => r.type !== type);
    }
    return Promise.resolve(null);
});

const mockGetAllAsync = jest.fn((sql, params = []) => {
    if (sql.includes("WHERE type = ?")) {
        const [type] = params;
        return Promise.resolve(calculatorTable.filter((r) => r.type === type));
    }
    return Promise.resolve([...calculatorTable]);
});

jest.mock("expo-sqlite", () => ({
    openDatabaseAsync: jest.fn().mockResolvedValue({
        execAsync: jest.fn().mockResolvedValue(null),
        runAsync: (...args) => mockRunAsync(...args),
        getAllAsync: (...args) => mockGetAllAsync(...args),
    }),
}));

import {
    deleteCalculatorHistory,
    mergeCalculatorHistory,
    readCalculatorHistory,
    saveCalculatorHistory,
} from "../storage/calculatorHistory.native";

describe("calculatorHistory storage (native)", () => {
    beforeEach(() => {
        calculatorTable = [];
        mockRunAsync.mockClear();
        mockGetAllAsync.mockClear();
    });

    test("saves and reads local zakat history", async () => {
        const saved = await saveCalculatorHistory("zakat", {
            jumlah_zakat: 25000,
            nama_jenis: "Zakat Maal",
        });

        expect(saved.id).toContain("local-zakat-");
        expect(saved.is_local).toBe(true);
        expect(mockRunAsync).toHaveBeenCalledWith(
            expect.stringContaining("INSERT OR REPLACE"),
            expect.arrayContaining([
                expect.any(String),
                "zakat",
                expect.stringContaining("Zakat Maal"),
                expect.any(String),
                0,
            ]),
        );

        const items = await readCalculatorHistory("zakat");
        expect(items[0]).toMatchObject({
            is_local: true,
            nama_jenis: "Zakat Maal",
        });
    });

    test("deletes local faraidh history item", async () => {
        await saveCalculatorHistory("faraidh", { id: "local-faraidh-1", wealth: 1000000 });
        await saveCalculatorHistory("faraidh", { id: "local-faraidh-2", wealth: 2000000 });

        await deleteCalculatorHistory("faraidh", "local-faraidh-1");

        expect(mockRunAsync).toHaveBeenCalledWith(
            "DELETE FROM calculator_history WHERE type = ? AND id = ?",
            ["faraidh", "local-faraidh-1"],
        );

        const items = await readCalculatorHistory("faraidh");
        expect(items.some((item) => item.id === "local-faraidh-1")).toBe(false);
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