import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SettingsProvider } from "@/lib/useSettings";
import AdzanQuickControl from "@/components/AdzanQuickControl";
import { ensurePushSubscriptionRegistered } from "@/lib/pushSubscription";

jest.mock("@/lib/api", () => ({
    adzanSoundApi: { list: jest.fn().mockResolvedValue({ ok: false }) },
    uploadWithProgress: jest.fn(),
}));

jest.mock("@/lib/adzanNotification", () => ({
    fireAdzanNotification: jest.fn(),
}));

jest.mock("@/lib/pushSubscription", () => ({
    ensurePushSubscriptionRegistered: jest.fn().mockResolvedValue(true),
}));

jest.mock("@/context/Auth", () => ({
    useAuth: () => ({ isAuthenticated: true }),
}));

describe("AdzanQuickControl notif toggle", () => {
    let originalNotification;

    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
        originalNotification = global.Notification;
        global.Notification = {
            permission: "default",
            requestPermission: jest.fn().mockResolvedValue("granted"),
        };
    });

    afterEach(() => {
        global.Notification = originalNotification;
    });

    test("registers a push subscription once the user grants permission via the toggle", async () => {
        localStorage.setItem(
            "tholabul_app_settings",
            JSON.stringify({ notifAdzan: false }),
        );

        render(
            <SettingsProvider>
                <AdzanQuickControl />
            </SettingsProvider>,
        );

        const checkbox = screen.getByRole("checkbox");
        fireEvent.click(checkbox);

        await waitFor(() => {
            expect(global.Notification.requestPermission).toHaveBeenCalled();
        });
        await waitFor(() => {
            expect(ensurePushSubscriptionRegistered).toHaveBeenCalledWith({
                isAuthenticated: true,
            });
        });
    });

    test("does not register a push subscription when permission is denied", async () => {
        global.Notification.permission = "denied";
        localStorage.setItem(
            "tholabul_app_settings",
            JSON.stringify({ notifAdzan: false }),
        );

        render(
            <SettingsProvider>
                <AdzanQuickControl />
            </SettingsProvider>,
        );

        const checkbox = screen.getByRole("checkbox");
        fireEvent.click(checkbox);

        await waitFor(() => {
            expect(checkbox.checked).toBe(false);
        });
        expect(ensurePushSubscriptionRegistered).not.toHaveBeenCalled();
    });
});
