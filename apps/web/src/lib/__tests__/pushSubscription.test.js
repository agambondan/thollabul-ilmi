jest.mock("@/lib/api", () => ({
    notificationApi: {
        getVapidPublicKey: jest.fn(),
        registerPushToken: jest.fn(),
    },
}));
jest.mock("@/lib/userLocation", () => ({
    readStoredUserLocation: jest.fn(),
}));

import { notificationApi } from "@/lib/api";
import { readStoredUserLocation } from "@/lib/userLocation";
import { ensurePushSubscriptionRegistered } from "../pushSubscription";

const VAPID_KEY = "BEl62iUYgUivxIkv69yViEuiBIa1HI0DGRJ8HrDVYWmWQnn9pkjO";

describe("ensurePushSubscriptionRegistered", () => {
    let registration;
    let subscription;

    beforeEach(() => {
        jest.clearAllMocks();
        readStoredUserLocation.mockReturnValue({
            lat: -6.9,
            lng: 107.6,
            label: "Bandung",
        });

        subscription = {
            toJSON: () => ({
                endpoint: "https://push.example.com/sub-123",
                keys: { p256dh: "p256dh-value", auth: "auth-value" },
            }),
        };
        registration = {
            pushManager: {
                getSubscription: jest.fn().mockResolvedValue(null),
                subscribe: jest.fn().mockResolvedValue(subscription),
            },
        };

        global.navigator.serviceWorker = {
            register: jest.fn().mockResolvedValue(registration),
            ready: Promise.resolve(registration),
        };
        global.PushManager = function () {};
        global.atob = (s) => Buffer.from(s, "base64").toString("binary");

        notificationApi.getVapidPublicKey.mockResolvedValue({
            ok: true,
            json: async () => ({ data: { publicKey: VAPID_KEY } }),
        });
        notificationApi.registerPushToken.mockResolvedValue({ ok: true });
    });

    test("registers service worker, subscribes to push, and sends the token to the backend when authenticated", async () => {
        const result = await ensurePushSubscriptionRegistered({
            isAuthenticated: true,
        });

        expect(result).toBe(true);
        expect(global.navigator.serviceWorker.register).toHaveBeenCalledWith(
            "/sw.js",
            expect.objectContaining({ scope: "/" }),
        );
        expect(registration.pushManager.subscribe).toHaveBeenCalled();
        expect(notificationApi.registerPushToken).toHaveBeenCalledWith(
            expect.objectContaining({
                token: "https://push.example.com/sub-123",
                platform: "web",
                provider: "web",
                key_p256dh: "p256dh-value",
                key_auth: "auth-value",
                latitude: -6.9,
                longitude: 107.6,
                city_name: "Bandung",
            }),
        );
    });

    test("does not call the backend when not authenticated, but still subscribes", async () => {
        const result = await ensurePushSubscriptionRegistered({
            isAuthenticated: false,
        });

        expect(result).toBe(true);
        expect(registration.pushManager.subscribe).toHaveBeenCalled();
        expect(notificationApi.registerPushToken).not.toHaveBeenCalled();
    });

    test("reuses an existing subscription instead of subscribing again", async () => {
        registration.pushManager.getSubscription.mockResolvedValue(
            subscription,
        );

        const result = await ensurePushSubscriptionRegistered({
            isAuthenticated: true,
        });

        expect(result).toBe(true);
        expect(registration.pushManager.subscribe).not.toHaveBeenCalled();
        expect(notificationApi.registerPushToken).toHaveBeenCalled();
    });

    test("returns false when the browser does not support push", async () => {
        delete global.navigator.serviceWorker;
        delete global.PushManager;

        const result = await ensurePushSubscriptionRegistered({
            isAuthenticated: true,
        });

        expect(result).toBe(false);
        expect(notificationApi.registerPushToken).not.toHaveBeenCalled();
    });
});
