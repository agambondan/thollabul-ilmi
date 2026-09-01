/**
 * @jest-environment jsdom
 */

const { CopyToClipboard, CopyImageToClipboard } = require("@/lib/copy");

// Mock Clipboard API
const mockWriteText = jest.fn();
const mockWrite = jest.fn();

Object.defineProperty(navigator, "clipboard", {
    value: { writeText: mockWriteText, write: mockWrite },
    writable: true,
    configurable: true,
});

// Mock ClipboardItem if not available
if (typeof ClipboardItem === "undefined") {
    global.ClipboardItem = class ClipboardItem {
        constructor(items) {
            this.items = items;
            this.types = Object.keys(items);
        }
    };
}

describe("copy utilities", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("CopyToClipboard", () => {
        test("calls navigator.clipboard.writeText when available", async () => {
            mockWriteText.mockResolvedValue(undefined);
            await CopyToClipboard("test text");
            expect(mockWriteText).toHaveBeenCalledWith("test text");
        });

        test("handles errors gracefully", async () => {
            mockWriteText.mockRejectedValue(new Error("fail"));
            await expect(CopyToClipboard("test")).resolves.toBeUndefined();
        });
    });

    describe("CopyImageToClipboard", () => {
        test("calls clipboard.write with blob", async () => {
            const blob = new Blob(["fake"], { type: "image/png" });
            const canvas = { toBlob: (cb) => cb(blob) };
            mockWrite.mockResolvedValue(undefined);

            await CopyImageToClipboard(canvas);

            expect(mockWrite).toHaveBeenCalled();
            const item = mockWrite.mock.calls[0][0][0];
            expect(item.types).toContain("image/png");
        });

        test("resolves when clipboard API not supported", async () => {
            Object.defineProperty(navigator, "clipboard", {
                value: null,
                writable: true,
                configurable: true,
            });
            const canvas = {
                toBlob: jest.fn(),
                toDataURL: jest.fn(() => "data:image/png;base64,"),
            };
            await expect(CopyImageToClipboard(canvas)).resolves.toBeUndefined();
        });
    });
});
