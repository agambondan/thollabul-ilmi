import { Platform, NativeModules } from "react-native";
import {
    getPushNotificationAvailability,
    pushNotificationsSupported,
    APP_NOTIFICATION_CHANNEL_ID,
} from "../utils/pushNotifications";

beforeEach(() => {
    Platform.OS = "ios";
    delete NativeModules.ExponentConstants;
});

describe("APP_NOTIFICATION_CHANNEL_ID", () => {
    test("is set to daily-reminders", () => {
        expect(APP_NOTIFICATION_CHANNEL_ID).toBe("daily-reminders");
    });
});

describe("getPushNotificationAvailability", () => {
    test("returns unsupported on web", () => {
        Platform.OS = "web";
        const result = getPushNotificationAvailability();
        expect(result.supported).toBe(false);
        expect(result.reason).toBe("unsupported");
    });

    test("returns expo_go_unsupported when in Expo Go on native", () => {
        NativeModules.ExponentConstants = {
            appOwnership: "expo",
            executionEnvironment: "storeClient",
        };
        const result = getPushNotificationAvailability();
        expect(result.supported).toBe(false);
        expect(result.reason).toBe("expo_go_unsupported");
    });

    test("returns ready on native outside Expo Go", () => {
        NativeModules.ExponentConstants = {
            appOwnership: "standalone",
            executionEnvironment: "standalone",
        };
        const result = getPushNotificationAvailability();
        expect(result.supported).toBe(true);
        expect(result.reason).toBe("ready");
    });
});

describe("pushNotificationsSupported", () => {
    test("returns false on web", () => {
        Platform.OS = "web";
        expect(pushNotificationsSupported()).toBe(false);
    });

    test("returns false in Expo Go", () => {
        NativeModules.ExponentConstants = {
            appOwnership: "expo",
            executionEnvironment: "storeClient",
        };
        expect(pushNotificationsSupported()).toBe(false);
    });

    test("returns true on native outside Expo Go", () => {
        NativeModules.ExponentConstants = {
            appOwnership: "standalone",
            executionEnvironment: "standalone",
        };
        expect(pushNotificationsSupported()).toBe(true);
    });
});
