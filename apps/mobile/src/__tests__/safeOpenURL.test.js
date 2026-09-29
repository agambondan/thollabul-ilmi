import { Linking } from "react-native";
import { isSafeUrl, sanitizeUrl, safeOpenURL } from "../utils/safeOpenURL";

describe("safeOpenURL", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("validates safe schemes", () => {
        expect(isSafeUrl("https://example.com")).toBe(true);
        expect(isSafeUrl("http://example.com")).toBe(true);
        expect(isSafeUrl("mailto:info@example.com")).toBe(true);
        expect(isSafeUrl("tel:+628123456789")).toBe(true);
        expect(isSafeUrl("geo:-6.2,106.8")).toBe(true);
    });

    test("rejects unsafe or invalid schemes", () => {
        expect(isSafeUrl("javascript:alert(1)")).toBe(false);
        expect(isSafeUrl("data:text/html,<script></script>")).toBe(false);
        expect(isSafeUrl("file:///etc/passwd")).toBe(false);
        expect(isSafeUrl("intent://evil")).toBe(false);
        expect(isSafeUrl("")).toBe(false);
        expect(isSafeUrl(null)).toBe(false);
        expect(isSafeUrl(123)).toBe(false);
    });

    test("sanitizes URLs correctly", () => {
        expect(sanitizeUrl("https://example.com/path")).toBe("https://example.com/path");
        expect(sanitizeUrl("javascript:void(0)")).toBeNull();
    });

    test("safeOpenURL calls Linking.openURL on safe URL", async () => {
        Linking.openURL.mockResolvedValueOnce(true);
        const result = await safeOpenURL("https://thollabulilmi.site");
        expect(result).toBe(true);
        expect(Linking.openURL).toHaveBeenCalledWith("https://thollabulilmi.site");
    });

    test("safeOpenURL blocks unsafe URL without calling Linking", async () => {
        const onError = jest.fn();
        const result = await safeOpenURL("javascript:void(0)", { onError });
        expect(result).toBe(false);
        expect(Linking.openURL).not.toHaveBeenCalled();
        expect(onError).toHaveBeenCalled();
    });
});
