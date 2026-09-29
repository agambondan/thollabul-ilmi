import {
    fetchCached,
    invalidateCache,
    clearCache,
    cacheKeys,
} from "../api/apiCache";

describe("apiCache", () => {
    beforeEach(() => {
        clearCache();
    });

    test("fetches and caches results", async () => {
        const fetcher = jest.fn().mockResolvedValue({ success: true });

        const first = await fetchCached("test:key", fetcher);
        const second = await fetchCached("test:key", fetcher);

        expect(first).toEqual({ success: true });
        expect(second).toEqual({ success: true });
        expect(fetcher).toHaveBeenCalledTimes(1);
    });

    test("refetches when cache is invalidated", async () => {
        const fetcher = jest.fn()
            .mockResolvedValueOnce({ version: 1 })
            .mockResolvedValueOnce({ version: 2 });

        const first = await fetchCached("test:key", fetcher);
        expect(first).toEqual({ version: 1 });

        invalidateCache("test:key");

        const second = await fetchCached("test:key", fetcher);
        expect(second).toEqual({ version: 2 });
        expect(fetcher).toHaveBeenCalledTimes(2);
    });

    test("separates auth and public cache keys", async () => {
        const fetcherPublic = jest.fn().mockResolvedValue({ user: null });
        const fetcherAuth = jest.fn().mockResolvedValue({ user: "admin" });

        const pub = await fetchCached("user:info", fetcherPublic, { auth: false });
        const aut = await fetchCached("user:info", fetcherAuth, { auth: true });

        expect(pub).toEqual({ user: null });
        expect(aut).toEqual({ user: "admin" });
        expect(fetcherPublic).toHaveBeenCalledTimes(1);
        expect(fetcherAuth).toHaveBeenCalledTimes(1);
    });

    test("expires cache after TTL", async () => {
        const fetcher = jest.fn()
            .mockResolvedValueOnce("first")
            .mockResolvedValueOnce("second");

        const now = Date.now();
        jest.spyOn(Date, "now").mockReturnValue(now);

        await fetchCached("ttl:key", fetcher, { ttl: 1000 });

        Date.now.mockReturnValue(now + 500);
        const hit = await fetchCached("ttl:key", fetcher, { ttl: 1000 });
        expect(hit).toBe("first");
        expect(fetcher).toHaveBeenCalledTimes(1);

        Date.now.mockReturnValue(now + 1500);
        const miss = await fetchCached("ttl:key", fetcher, { ttl: 1000 });
        expect(miss).toBe("second");
        expect(fetcher).toHaveBeenCalledTimes(2);

        Date.now.mockRestore();
    });

    test("falls back to persisted disk cache when network fails", async () => {
        const fetcherSuccess = jest.fn().mockResolvedValue({ offlineData: "available" });
        await fetchCached("offline:test", fetcherSuccess, { persist: true });

        // Clear in-memory cache to simulate app restart
        clearCache();

        // Network error on next fetch
        const fetcherFail = jest.fn().mockRejectedValue(new Error("Network offline"));
        const fallback = await fetchCached("offline:test", fetcherFail, { persist: true });

        expect(fallback).toEqual({ offlineData: "available" });
        expect(fetcherFail).toHaveBeenCalledTimes(1);
    });

    test("generates standard cache keys", () => {
        expect(cacheKeys.surahs()).toBe("surahs:all");
        expect(cacheKeys.ayahsBySurah(2, 0)).toBe("ayahs:surah:2:page:0");
        expect(cacheKeys.hadithBooks()).toBe("hadith:books:all");
    });
});
