let asmaulTable = [];

const mockRunAsync = jest.fn((sql, params = []) => {
    if (sql.includes("INSERT INTO asmaul_wirid") || sql.includes("INSERT OR REPLACE")) {
        const [nameId, count, updatedAt] = params;
        const existingIdx = asmaulTable.findIndex((r) => r.name_id === nameId);
        const entry = { name_id: nameId, count, updated_at: updatedAt };
        if (existingIdx >= 0) {
            asmaulTable[existingIdx] = entry;
        } else {
            asmaulTable.push(entry);
        }
    } else if (sql.includes("DELETE FROM asmaul_wirid WHERE name_id = ?")) {
        const [nameId] = params;
        asmaulTable = asmaulTable.filter((r) => r.name_id !== nameId);
    } else if (sql.includes("DELETE FROM asmaul_wirid")) {
        asmaulTable = [];
    }
    return Promise.resolve(null);
});

const mockGetAllAsync = jest.fn(() => Promise.resolve([...asmaulTable]));

const mockWithTransactionAsync = jest.fn(async (cb) => cb());

jest.mock("expo-sqlite", () => ({
    openDatabaseAsync: jest.fn().mockResolvedValue({
        execAsync: jest.fn().mockResolvedValue(null),
        runAsync: (...args) => mockRunAsync(...args),
        getAllAsync: (...args) => mockGetAllAsync(...args),
        withTransactionAsync: (...args) => mockWithTransactionAsync(...args),
    }),
}));

import {
    readAsmaulWiridCounts,
    saveAsmaulWiridCounts,
    setAsmaulWiridCount,
} from "../storage/asmaulWirid.native";

describe("asmaul wirid storage (native)", () => {
    beforeEach(() => {
        asmaulTable = [];
        mockRunAsync.mockClear();
        mockGetAllAsync.mockClear();
    });

    test("reads persisted counts and filters invalid values", async () => {
        asmaulTable = [
            { name_id: "1", count: 12 },
            { name_id: "2", count: "bad" },
            { name_id: "3", count: 0 },
            { name_id: "4", count: 33.8 },
        ];

        await expect(readAsmaulWiridCounts()).resolves.toEqual({
            1: 12,
            4: 33,
        });
    });

    test("saves normalized counts", async () => {
        const saved = await saveAsmaulWiridCounts({ 1: 12.8, 2: 0, 3: -1 });

        expect(saved).toEqual({ 1: 12 });
        expect(mockRunAsync).toHaveBeenCalledWith("DELETE FROM asmaul_wirid");
        expect(mockRunAsync).toHaveBeenCalledWith(
            expect.stringContaining("INSERT INTO asmaul_wirid"),
            expect.arrayContaining(["1", 12, expect.any(String)]),
        );
    });

    test("removes a count when reset to zero", async () => {
        await saveAsmaulWiridCounts({ 1: 12, 2: 5 });

        const saved = await setAsmaulWiridCount({ 1: 12, 2: 5 }, "1", 0);

        expect(saved).toEqual({ 2: 5 });
        expect(mockRunAsync).toHaveBeenCalledWith(
            "DELETE FROM asmaul_wirid WHERE name_id = ?",
            ["1"],
        );
    });
});