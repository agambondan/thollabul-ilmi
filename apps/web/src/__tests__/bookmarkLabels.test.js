import {
    colorById,
    BOOKMARK_COLORS,
    getBookmarkMeta,
    setBookmarkMeta,
    clearBookmarkMeta,
} from "@/lib/bookmarkLabels";

describe("bookmarkLabels", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    describe("colorById", () => {
        test("returns matching color object", () => {
            const c = colorById("emerald");
            expect(c.id).toBe("emerald");
            expect(c.tw).toBe("bg-emerald-500");
            expect(c.label_id).toBe("Hijau");
        });

        test("returns first color (emerald) for unknown id", () => {
            const c = colorById("nonexistent");
            expect(c.id).toBe("emerald");
        });

        test("all color IDs are unique", () => {
            const ids = BOOKMARK_COLORS.map((c) => c.id);
            expect(new Set(ids).size).toBe(ids.length);
        });
    });

    describe("getBookmarkMeta", () => {
        test("returns null when no meta stored", () => {
            expect(getBookmarkMeta("ayah", "1")).toBeNull();
        });

        test("returns saved meta", () => {
            setBookmarkMeta("ayah", "1", { color: "rose", label: "favorite" });
            const meta = getBookmarkMeta("ayah", "1");
            expect(meta.color).toBe("rose");
            expect(meta.label).toBe("favorite");
            expect(meta.updatedAt).toBeDefined();
        });
    });

    describe("setBookmarkMeta", () => {
        test("merges with existing meta", () => {
            setBookmarkMeta("ayah", "1", { color: "rose" });
            setBookmarkMeta("ayah", "1", { label: "tadabbur" });
            const meta = getBookmarkMeta("ayah", "1");
            expect(meta.color).toBe("rose");
            expect(meta.label).toBe("tadabbur");
        });
    });

    describe("clearBookmarkMeta", () => {
        test("removes meta for given ref", () => {
            setBookmarkMeta("ayah", "1", { color: "rose" });
            clearBookmarkMeta("ayah", "1");
            expect(getBookmarkMeta("ayah", "1")).toBeNull();
        });

        test("does not affect other refs", () => {
            setBookmarkMeta("ayah", "1", { color: "rose" });
            setBookmarkMeta("hadith", "5", { color: "sky" });
            clearBookmarkMeta("ayah", "1");
            expect(getBookmarkMeta("hadith", "5")).not.toBeNull();
        });
    });
});
