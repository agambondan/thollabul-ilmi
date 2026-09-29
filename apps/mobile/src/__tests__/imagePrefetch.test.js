import { Image } from "react-native";
import {
    clearPrefetchCache,
    prefetchImage,
    prefetchImages,
} from "../utils/imagePrefetch";

describe("imagePrefetch", () => {
    beforeEach(() => {
        clearPrefetchCache();
        jest.clearAllMocks();
    });

    test("returns false for invalid or empty uri", async () => {
        expect(await prefetchImage("")).toBe(false);
        expect(await prefetchImage(null)).toBe(false);
        expect(await prefetchImage(undefined)).toBe(false);
    });

    test("prefetches valid image and prevents duplicate calls", async () => {
        const spy = jest.spyOn(Image, "prefetch").mockResolvedValue(true);
        const url = "https://example.com/cover.jpg";

        const res1 = await prefetchImage(url);
        expect(res1).toBe(true);
        expect(spy).toHaveBeenCalledWith(url);

        const res2 = await prefetchImage(url);
        expect(res2).toBe(false);
        expect(spy).toHaveBeenCalledTimes(1);
    });

    test("prefetchImages iterates through array", () => {
        const spy = jest.spyOn(Image, "prefetch").mockResolvedValue(true);
        prefetchImages([
            "https://example.com/1.png",
            "https://example.com/2.png",
            null,
        ]);
        expect(spy).toHaveBeenCalledTimes(2);
    });
});
