import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react";

const mockAuthFetch = jest.fn();
const mockUseAuth = { isAuthenticated: false };

jest.mock("@/lib/api", () => ({
    authFetch: (...args) => mockAuthFetch(...args),
}));

jest.mock("@/context/Auth", () => ({
    useAuth: () => mockUseAuth,
}));

import { SettingsProvider, useSettings, ADZAN_SOUNDS } from "@/lib/useSettings";

const Capture = () => {
    const ctx = useSettings();
    return (
        <div
            data-testid='settings'
            data-settings={JSON.stringify(ctx.settings)}
        />
    );
};

const renderProvider = () =>
    render(
        <SettingsProvider>
            <Capture />
        </SettingsProvider>,
    );

beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockAuthFetch.mockReset();
    mockUseAuth.isAuthenticated = false;
});

describe("useSettings", () => {
    test("ADZAN_SOUNDS exposes the default plus muadzin playlist with qari info", () => {
        expect(ADZAN_SOUNDS.map((s) => s.value)).toEqual([
            "default",
            "mishary-alafasy",
            "mansour-al-zahrani",
            "nasser-al-qatami",
            "abdul-basit",
            "islam-sobhi",
            "makkah-haram",
            "madinah",
            "al-aqsa",
        ]);
        expect(ADZAN_SOUNDS[1]).toEqual(
            expect.objectContaining({
                qari: expect.any(String),
                region: expect.any(String),
                src: expect.stringContaining("mishary-alafasy"),
            }),
        );
    });

    test("updateSetting persists to localStorage and syncs when authenticated", async () => {
        mockUseAuth.isAuthenticated = true;
        mockAuthFetch.mockResolvedValue({ ok: true, json: async () => ({}) });
        const view = renderProvider();

        await waitFor(() =>
            expect(view.getByTestId("settings")).toBeInTheDocument(),
        );

        const { rerender } = view;
        rerender(
            <SettingsProvider>
                <Setter />
           </SettingsProvider>,
        );

        fireEvent.click(view.getByText("set"));

        const stored = JSON.parse(
            localStorage.getItem("tholabul_app_settings"),
        );
        expect(stored.adzanSound).toBe("mishary-alafasy");
        await waitFor(() =>
            expect(mockAuthFetch).toHaveBeenCalledWith(
                "/api/v1/settings",
                expect.objectContaining({ method: "PUT" }),
            ),
        );
    });

    test("hydrates from backend when authenticated and overrides adzan reminder lead", async () => {
        mockUseAuth.isAuthenticated = true;
        mockAuthFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                data: {
                    settings: JSON.stringify({
                        adzanSound: "islamcan",
                        adzanReminderLead: 30,
                        adzanReminderLeadByPrayer: { fajr: 5, bogus: 7 },
                    }),
                },
            }),
        });

        const view = renderProvider();

        await waitFor(() => {
            const raw = view
                .getByTestId("settings")
                .getAttribute("data-settings");
            const parsed = JSON.parse(raw);
            expect(parsed.adzanReminderLead).toBe(30);
            expect(parsed.adzanReminderLeadByPrayer).toEqual({ fajr: 5 });
        });
    });

    test("migrates legacy islamcan sound and overrides stored URL", async () => {
        mockUseAuth.isAuthenticated = true;
        mockAuthFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                data: {
                    settings: JSON.stringify({
                        adzanSound: "islamcan",
                        adzanSoundUrl: "https://www.islamcan.com/audio/adzan/azan1.mp3",
                        adzanSoundLabel: "IslamCan Azan 1",
                    }),
                },
            }),
        });

        const view = renderProvider();

        await waitFor(() => {
            const raw = view
                .getByTestId("settings")
                .getAttribute("data-settings");
            const parsed = JSON.parse(raw);
            expect(parsed.adzanSound).toBe("mishary-alafasy");
            expect(parsed.adzanSoundUrl).toContain("mishary-alafasy");
            expect(parsed.adzanSoundLabel).toBe("Mishary Rashid Al-Afasy");
        });
    });

    test("falls back to defaults when backend response is malformed", async () => {
        mockUseAuth.isAuthenticated = true;
        mockAuthFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: { settings: "not-json" } }),
        });

        const view = renderProvider();

        await waitFor(() => {
            const raw = view
                .getByTestId("settings")
                .getAttribute("data-settings");
            const parsed = JSON.parse(raw);
            expect(parsed.adzanReminderLead).toBe(10);
            expect(parsed.adzanReminderLeadByPrayer).toEqual({});
        });
    });
});

const Setter = () => {
    const { updateSetting } = useSettings();
    return (
        <button onClick={() => updateSetting("adzanSound", "mishary-alafasy")}>
            set
        </button>
    );
};
