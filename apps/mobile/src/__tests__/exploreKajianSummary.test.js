const { getKajianSummary } = require("../screens/ExploreScreen.helpers");

const video = (topic) => ({ raw: { type: "video", topic } });

describe("getKajianSummary", () => {
    test("counts what is loaded when the API total is unknown", () => {
        const summary = getKajianSummary([
            video("tafsir"),
            video("fiqh"),
            { raw: { type: "artikel", topic: "fiqh" } },
        ]);

        expect(summary).toEqual({
            categoryCount: 2,
            total: 3,
            videoCount: 2,
        });
    });

    test("uses the API total for kajian and video counts", () => {
        const summary = getKajianSummary([video("tafsir"), video("fiqh")], {
            total: 7346,
        });

        expect(summary.total).toBe(7346);
        expect(summary.videoCount).toBe(7346);
    });

    test("ignores a total that is smaller than what is already loaded", () => {
        const summary = getKajianSummary([video("a"), video("b")], {
            total: 1,
        });

        expect(summary.total).toBe(2);
        expect(summary.videoCount).toBe(2);
    });

    test("ignores a missing or non-numeric total", () => {
        expect(getKajianSummary([video("a")], { total: null }).total).toBe(1);
        expect(getKajianSummary([video("a")], { total: undefined }).total).toBe(
            1,
        );
        expect(getKajianSummary([video("a")], { total: "x" }).total).toBe(1);
    });
});
