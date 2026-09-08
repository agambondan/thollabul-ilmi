import { serializeJsonLd, SITE_URL, openGraphFor } from "../site";

describe("site helpers", () => {
    test("openGraphFor creates expected structure", () => {
        const og = openGraphFor("/test");
        expect(og.url).toBe("/test");
        expect(og.type).toBe("website");
        expect(og.images.length).toBeGreaterThan(0);
    });

    test("serializeJsonLd escapes angle brackets for safe HTML script injection", () => {
        const data = {
            name: "Test <script>alert(1)</script>",
            nested: { tag: "</script>" },
        };
        const serialized = serializeJsonLd(data);
        expect(serialized).not.toContain("<script>");
        expect(serialized).not.toContain("</script>");
        expect(serialized).toContain("\\u003cscript>");
        expect(serialized).toContain("\\u003c/script>");
    });
});
