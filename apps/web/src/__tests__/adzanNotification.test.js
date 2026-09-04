import { fireAdzanNotification } from "@/lib/adzanNotification";

describe("fireAdzanNotification", () => {
    it("uses the service worker controller when available", async () => {
        const post = jest.fn();
        global.Notification = jest.fn();
        global.navigator.serviceWorker = { controller: { postMessage: post } };
        await fireAdzanNotification("T", "B", "/x");
        expect(post).toHaveBeenCalledWith({
            type: "ADZAN_NOTIFICATION",
            title: "T",
            body: "B",
            url: "/x",
        });
    });

    it("falls back to Notification when no controller", async () => {
        global.Notification = jest.fn().mockImplementation(function () {
            return {};
        });
        Object.defineProperty(global.Notification, "permission", {
            get: () => "granted",
        });
        global.navigator.serviceWorker = {};
        await fireAdzanNotification("T", "B", "/x");
        expect(global.Notification).toHaveBeenCalledWith(
            "T",
            expect.objectContaining({
                body: "B",
                icon: "/icon.png",
                tag: "adzan-alert",
                renotify: true,
                requireInteraction: true,
                silent: false,
                vibrate: [500, 250, 500, 250, 500],
            }),
        );
    });
});
