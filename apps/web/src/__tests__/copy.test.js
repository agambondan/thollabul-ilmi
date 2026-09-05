/**
 * @jest-environment jsdom
 */

const {
    CopyToClipboard,
    CopyImageToClipboard,
    shareCanvasWithText,
} = require("@/lib/copy");

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

    describe("shareCanvasWithText", () => {
        const makeBlob = () => new Blob(["fake"], { type: "image/png" });
        let originalCanShare, originalShare;
        beforeEach(() => {
            originalCanShare = navigator.canShare;
            originalShare = navigator.share;
        });
        afterEach(() => {
            Object.defineProperty(navigator, "canShare", {
                value: originalCanShare,
                writable: true,
                configurable: true,
            });
            Object.defineProperty(navigator, "share", {
                value: originalShare,
                writable: true,
                configurable: true,
            });
        });

        test("shares file+text when canShare supports files", async () => {
            const mockShare = jest.fn().mockResolvedValue(undefined);
            Object.defineProperty(navigator, "canShare", {
                value: jest.fn(() => true),
                writable: true,
                configurable: true,
            });
            Object.defineProperty(navigator, "share", {
                value: mockShare,
                writable: true,
                configurable: true,
            });
            const canvas = { toBlob: (cb) => cb(makeBlob()) };
            await shareCanvasWithText(canvas, {
                title: "T",
                text: "txt",
                url: "https://x",
                filename: "a.png",
            });
            expect(mockShare).toHaveBeenCalled();
            const arg = mockShare.mock.calls[0][0];
            expect(arg.files[0]).toBeInstanceOf(Blob);
            expect(arg.title).toBe("T");
            expect(arg.text).toBe("txt");
            expect(arg.url).toBe("https://x");
        });

        test("rejects with UNSUPPORTED when canShare false", async () => {
            Object.defineProperty(navigator, "canShare", {
                value: jest.fn(() => false),
                writable: true,
                configurable: true,
            });
            Object.defineProperty(navigator, "share", {
                value: jest.fn(),
                writable: true,
                configurable: true,
            });
            const canvas = { toBlob: (cb) => cb(makeBlob()) };
            await expect(shareCanvasWithText(canvas, {})).rejects.toThrow(
                "UNSUPPORTED",
            );
        });

        test("resolves when user aborts", async () => {
            const err = Object.assign(new Error("aborted"), { name: "AbortError" });
            Object.defineProperty(navigator, "canShare", {
                value: jest.fn(() => true),
                writable: true,
                configurable: true,
            });
            Object.defineProperty(navigator, "share", {
                value: jest.fn().mockRejectedValue(err),
                writable: true,
                configurable: true,
            });
            const canvas = { toBlob: (cb) => cb(makeBlob()) };
            await expect(shareCanvasWithText(canvas, {})).resolves.toBeUndefined();
        });
    });
});
