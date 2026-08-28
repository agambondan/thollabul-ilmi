import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

import {
    hapticTap,
    hapticSelection,
    hapticSuccess,
    hapticWarning,
    hapticError,
    hapticMedium,
} from "../utils/haptics";

jest.mock("expo-haptics", () => ({
    impactAsync: jest.fn(() => Promise.resolve()),
    selectionAsync: jest.fn(() => Promise.resolve()),
    notificationAsync: jest.fn(() => Promise.resolve()),
    ImpactFeedbackStyle: { Light: "Light", Medium: "Medium", Heavy: "Heavy" },
    NotificationFeedbackType: {
        Success: "Success",
        Warning: "Warning",
        Error: "Error",
    },
}));

beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = "ios";
});

describe("hapticTap", () => {
    test("calls impactAsync with Light", () => {
        hapticTap();
        expect(Haptics.impactAsync).toHaveBeenCalledWith("Light");
    });
});

describe("hapticMedium", () => {
    test("calls impactAsync with Medium", () => {
        hapticMedium();
        expect(Haptics.impactAsync).toHaveBeenCalledWith("Medium");
    });
});

describe("hapticSelection", () => {
    test("calls selectionAsync", () => {
        hapticSelection();
        expect(Haptics.selectionAsync).toHaveBeenCalled();
    });
});

describe("hapticSuccess", () => {
    test("calls notificationAsync with Success", () => {
        hapticSuccess();
        expect(Haptics.notificationAsync).toHaveBeenCalledWith("Success");
    });
});

describe("hapticWarning", () => {
    test("calls notificationAsync with Warning", () => {
        hapticWarning();
        expect(Haptics.notificationAsync).toHaveBeenCalledWith("Warning");
    });
});

describe("hapticError", () => {
    test("calls notificationAsync with Error", () => {
        hapticError();
        expect(Haptics.notificationAsync).toHaveBeenCalledWith("Error");
    });
});

describe("on web platform", () => {
    let webHaptics;

    beforeAll(() => {
        Platform.OS = "web";
        jest.resetModules();
        webHaptics = require("../utils/haptics");
    });

    afterAll(() => {
        Platform.OS = "ios";
    });

    test("does not call any haptic on web", () => {
        webHaptics.hapticTap();
        webHaptics.hapticSelection();
        webHaptics.hapticSuccess();
        webHaptics.hapticWarning();
        webHaptics.hapticError();
        webHaptics.hapticMedium();
        expect(Haptics.impactAsync).not.toHaveBeenCalled();
        expect(Haptics.selectionAsync).not.toHaveBeenCalled();
        expect(Haptics.notificationAsync).not.toHaveBeenCalled();
    });
});
