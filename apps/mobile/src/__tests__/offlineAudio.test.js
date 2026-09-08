const mockGetAllAsync = jest.fn().mockResolvedValue([]);
const mockRunAsync = jest.fn().mockResolvedValue(null);
const mockDeleteAsync = jest.fn().mockResolvedValue(null);

jest.mock("expo-sqlite", () => ({
    openDatabaseAsync: jest.fn().mockResolvedValue({
        execAsync: jest.fn().mockResolvedValue(null),
        getFirstAsync: jest
            .fn()
            .mockResolvedValue({ count: 2, total_bytes: 5000 }),
        getAllAsync: (...args) => mockGetAllAsync(...args),
        runAsync: (...args) => mockRunAsync(...args),
    }),
}));

jest.mock("expo-file-system", () => ({
    documentDirectory: "file:///test-docs/",
    getInfoAsync: jest.fn().mockResolvedValue({ exists: true, size: 1234 }),
    makeDirectoryAsync: jest.fn().mockResolvedValue(null),
    deleteAsync: (...args) => mockDeleteAsync(...args),
    createDownloadResumable: jest.fn().mockReturnValue({
        downloadAsync: jest
            .fn()
            .mockResolvedValue({ uri: "file:///test-docs/murottal/001.mp3" }),
    }),
}));

import {
    getOfflineAudioOverview,
    getOfflineAudioUri,
    downloadSurahAudio,
    deleteOfflineAudio,
    cleanupExpiredOfflineAudio,
    enforceOfflineAudioStorageLimit,
} from "../storage/offlineContent.native";

describe("offlineContent.native audio manager", () => {
    beforeEach(() => {
        mockGetAllAsync.mockReset().mockResolvedValue([]);
        mockRunAsync.mockClear();
        mockDeleteAsync.mockClear();
    });

    test("getOfflineAudioOverview returns audio count and total bytes", async () => {
        const overview = await getOfflineAudioOverview();
        expect(overview.supported).toBe(true);
        expect(overview.count).toBe(2);
        expect(overview.totalBytes).toBe(5000);
    });

    test("downloadSurahAudio creates file and returns local uri", async () => {
        const uri = await downloadSurahAudio({
            surahNumber: 1,
            qariSlug: "mishary-rashid-alafasy",
            audioUrl: "https://example.com/001.mp3",
        });
        expect(uri).toBe("file:///test-docs/murottal/001.mp3");
    });

    test("deleteOfflineAudio removes matching files from disk then clears the row", async () => {
        mockGetAllAsync.mockResolvedValueOnce([
            {
                local_uri:
                    "file:///test-docs/murottal/mishary-rashid-alafasy/001.mp3",
            },
        ]);
        const result = await deleteOfflineAudio(1, "mishary-rashid-alafasy");
        expect(mockDeleteAsync).toHaveBeenCalledWith(
            "file:///test-docs/murottal/mishary-rashid-alafasy/001.mp3",
            { idempotent: true },
        );
        expect(result.supported).toBe(true);
    });

    test("cleanupExpiredOfflineAudio deletes rows older than maxAgeDays and frees their bytes", async () => {
        mockGetAllAsync.mockResolvedValueOnce([
            {
                local_uri: "file:///test-docs/murottal/x/002.mp3",
                size_bytes: 900,
            },
        ]);
        const result = await cleanupExpiredOfflineAudio({ maxAgeDays: 90 });
        expect(mockDeleteAsync).toHaveBeenCalledWith(
            "file:///test-docs/murottal/x/002.mp3",
            { idempotent: true },
        );
        expect(mockRunAsync).toHaveBeenCalledWith(
            "DELETE FROM offline_audio WHERE saved_at < ?",
            [expect.any(String)],
        );
        expect(result).toEqual({ removedCount: 1, freedBytes: 900 });
    });

    test("cleanupExpiredOfflineAudio is a no-op when nothing is expired", async () => {
        mockGetAllAsync.mockResolvedValueOnce([]);
        const result = await cleanupExpiredOfflineAudio();
        expect(result).toEqual({ removedCount: 0, freedBytes: 0 });
        expect(mockDeleteAsync).not.toHaveBeenCalled();
    });

    test("enforceOfflineAudioStorageLimit evicts oldest entries until under the byte cap", async () => {
        mockGetAllAsync.mockResolvedValueOnce([
            {
                key: "audio:1:qari-a",
                local_uri: "file:///test-docs/murottal/qari-a/001.mp3",
                size_bytes: 4000,
            },
            {
                key: "audio:2:qari-a",
                local_uri: "file:///test-docs/murottal/qari-a/002.mp3",
                size_bytes: 4000,
            },
        ]);
        const result = await enforceOfflineAudioStorageLimit({
            maxBytes: 1000,
        });
        expect(mockDeleteAsync).toHaveBeenCalledTimes(1);
        expect(mockDeleteAsync).toHaveBeenCalledWith(
            "file:///test-docs/murottal/qari-a/001.mp3",
            { idempotent: true },
        );
        expect(mockRunAsync).toHaveBeenCalledWith(
            "DELETE FROM offline_audio WHERE key IN (?)",
            ["audio:1:qari-a"],
        );
        expect(result).toEqual({ removedCount: 1, freedBytes: 4000 });
    });

    test("enforceOfflineAudioStorageLimit is a no-op when under the byte cap", async () => {
        const result = await enforceOfflineAudioStorageLimit({
            maxBytes: 1_000_000_000,
        });
        expect(result).toEqual({ removedCount: 0, freedBytes: 0 });
        expect(mockDeleteAsync).not.toHaveBeenCalled();
    });
});
