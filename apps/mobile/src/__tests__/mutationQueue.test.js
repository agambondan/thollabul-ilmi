let table = [];

const mockRunAsync = jest.fn((sql, params = []) => {
    if (sql.includes("INSERT")) {
        const [id, type, endpoint, method, payload, createdAt, retryCount] = params;
        table.push({
            id,
            type,
            endpoint,
            method,
            payload,
            created_at: createdAt,
            retry_count: retryCount || 0,
            last_error: null,
        });
    } else if (sql.includes("DELETE FROM mutation_queue WHERE id")) {
        const [id] = params;
        table = table.filter((r) => r.id !== id);
    } else if (sql.includes("DELETE FROM mutation_queue")) {
        table = [];
    } else if (sql.includes("UPDATE mutation_queue")) {
        const [lastError, id] = params;
        const row = table.find((r) => r.id === id);
        if (row) {
            row.retry_count = (row.retry_count || 0) + 1;
            row.last_error = lastError;
        }
    }
    return Promise.resolve(null);
});

const mockGetAllAsync = jest.fn(() => Promise.resolve([...table]));

jest.mock("expo-sqlite", () => ({
    openDatabaseAsync: jest.fn().mockResolvedValue({
        execAsync: jest.fn().mockResolvedValue(null),
        runAsync: (...args) => mockRunAsync(...args),
        getAllAsync: (...args) => mockGetAllAsync(...args),
    }),
}));

import {
    clearMutationQueue,
    enqueueMutation,
    flushMutationQueue,
    getPendingMutations,
    removeMutation,
} from "../storage/mutationQueue";

describe("mutationQueue", () => {
    beforeEach(async () => {
        table = [];
        mockRunAsync.mockClear();
        mockGetAllAsync.mockClear();
        await clearMutationQueue();
    });

    test("enqueues and retrieves mutations in FIFO order", async () => {
        const m1 = await enqueueMutation({
            endpoint: "/api/v1/bookmarks",
            method: "POST",
            payload: { ref_type: "ayah", ref_id: 1 },
            type: "bookmark",
        });
        const m2 = await enqueueMutation({
            endpoint: "/api/v1/progress/quran",
            method: "PUT",
            payload: { surahNumber: 2, ayahNumber: 255 },
            type: "progress",
        });

        const pending = await getPendingMutations();
        expect(pending).toHaveLength(2);
        expect(pending[0].id).toBe(m1.id);
        expect(pending[1].id).toBe(m2.id);
    });

    test("removes single mutation by ID", async () => {
        const m1 = await enqueueMutation({ endpoint: "/a", method: "POST" });
        const m2 = await enqueueMutation({ endpoint: "/b", method: "POST" });

        await removeMutation(m1.id);
        const pending = await getPendingMutations();
        expect(pending).toHaveLength(1);
        expect(pending[0].id).toBe(m2.id);
    });

    test("flushes queue successfully when requestFn succeeds", async () => {
        await enqueueMutation({ endpoint: "/a", method: "POST", payload: { x: 1 } });
        await enqueueMutation({ endpoint: "/b", method: "PUT", payload: { y: 2 } });

        const mockRequest = jest.fn().mockResolvedValue({ success: true });
        const result = await flushMutationQueue(mockRequest);

        expect(result.processed).toBe(2);
        expect(result.failed).toBe(0);
        expect(mockRequest).toHaveBeenCalledTimes(2);
        const pending = await getPendingMutations();
        expect(pending).toHaveLength(0);
    });

    test("stops queue flushing on error to preserve FIFO ordering", async () => {
        await enqueueMutation({ endpoint: "/fail", method: "POST" });
        await enqueueMutation({ endpoint: "/after-fail", method: "POST" });

        const mockRequest = jest.fn().mockRejectedValue(new Error("Network offline"));
        const result = await flushMutationQueue(mockRequest);

        expect(result.processed).toBe(0);
        expect(result.failed).toBe(1);
        expect(mockRequest).toHaveBeenCalledTimes(1);

        const pending = await getPendingMutations();
        expect(pending).toHaveLength(2);
        expect(pending[0].retryCount).toBe(1);
    });
});
