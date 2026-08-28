/**
 * @jest-environment jsdom
 */

const mockOpen = jest.fn().mockReturnValue({});
window.open = mockOpen;

jest.spyOn(console, "error").mockImplementation(() => {});

const shareModule = jest.requireActual("@/lib/share");

describe("share functions", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const url = "https://example.com/article";

    test("shareToWhatsApp constructs correct URL", () => {
        shareModule.shareToWhatsApp(url);
        expect(mockOpen).toHaveBeenCalledWith(
            "https://api.whatsapp.com/send?text=Check out this article!%20" +
                url,
        );
    });

    test("shareToFacebook constructs correct URL", () => {
        shareModule.shareToFacebook(url);
        expect(mockOpen).toHaveBeenCalledWith(
            `https://www.facebook.com/sharer/sharer.php?u=${url}`,
        );
    });

    test("shareToTwitter constructs correct URL", () => {
        shareModule.shareToTwitter(url);
        expect(mockOpen).toHaveBeenCalledWith(
            `https://twitter.com/intent/tweet?url=${url}&text=Check out this article!`,
        );
    });

    test("shareToEmail constructs correct mailto URL", () => {
        const subject = "Check out this article!";
        const body =
            "Hi,\n\nI thought you might find this article interesting: " + url;
        const expectedEmailUrl = `mailto:?subject=${subject}&body=${body}`;
        expect(expectedEmailUrl).toContain("mailto:?subject=");
        expect(expectedEmailUrl).toContain(url);
    });

    test("shareToLinkedIn constructs correct URL", () => {
        shareModule.shareToLinkedIn(url);
        expect(mockOpen).toHaveBeenCalledWith(
            `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
        );
    });

    test("shareToTelegram constructs correct URL", () => {
        shareModule.shareToTelegram(url);
        expect(mockOpen).toHaveBeenCalledWith(
            `https://t.me/share/url?url=${url}&text=Check out this article!`,
        );
    });
});
