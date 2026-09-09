import { getSafeNextPath } from "../authRedirect";

describe("getSafeNextPath", () => {
    test("allows normal internal paths", () => {
        expect(getSafeNextPath("/dashboard")).toBe("/dashboard");
        expect(getSafeNextPath("/quran/2/255")).toBe("/quran/2/255");
    });

    test("falls back for missing or non-string input", () => {
        expect(getSafeNextPath(null)).toBe("/");
        expect(getSafeNextPath(undefined)).toBe("/");
        expect(getSafeNextPath(42)).toBe("/");
        expect(getSafeNextPath("", "/fallback")).toBe("/fallback");
    });

    test("falls back for paths not starting with a single slash", () => {
        expect(getSafeNextPath("evil.com")).toBe("/");
        expect(getSafeNextPath("https://evil.com")).toBe("/");
    });

    test("rejects protocol-relative double-slash redirects", () => {
        expect(getSafeNextPath("//evil.com")).toBe("/");
    });

    test("rejects backslash bypass that browsers normalize into an off-site redirect", () => {
        expect(getSafeNextPath("/\\evil.com")).toBe("/");
        expect(getSafeNextPath("/\\/evil.com")).toBe("/");
        expect(getSafeNextPath("/\\\\evil.com")).toBe("/");
    });
});
