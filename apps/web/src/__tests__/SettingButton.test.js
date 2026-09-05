import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { SettingsProvider } from "@/lib/useSettings";
import SettingButton from "@/components/popup/SettingButton";
import { usePathname } from "next/navigation";

jest.mock("next/navigation", () => ({
    usePathname: jest.fn(),
}));

jest.mock("@/context/Locale", () => ({
    useLocale: () => ({
        lang: "ID",
        t: (key) =>
            ({
                "settings.title": "Pengaturan",
                "hafalan.mode_label": "Mode Hafalan",
                "hafalan.mode_off": "Mati",
                "hafalan.mode_hide_arabic": "Sembunyikan Arab",
                "hafalan.mode_hide_translation": "Sembunyikan Terjemahan",
                "hafalan.mode_hide_all": "Sembunyikan Semua",
                "mushaf.view": "Tampilan",
                "mushaf.list": "Daftar",
                "mushaf.continuous": "Alur (Mushaf)",
                "mushaf.translation_on": "Tampilkan Terjemahan",
                "mushaf.translation_off": "Sembunyikan Terjemahan",
            })[key] ?? key,
    }),
}));

jest.mock("@/lib/api", () => ({
    authFetch: jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) }),
}));

jest.mock("@/context/Auth", () => ({
    useAuth: () => ({ isAuthenticated: false }),
}));

describe("SettingButton Quran-scoped controls", () => {
    beforeEach(() => {
        localStorage.clear();
        jest.clearAllMocks();
    });

    test("shows Mode Hafalan and Tampilan options when pathname is /quran/surah/Al-Baqara", () => {
        usePathname.mockReturnValue("/quran/surah/Al-Baqara");

        render(
            <SettingsProvider>
                <SettingButton />
            </SettingsProvider>,
        );

        const toggleBtn = screen.getByTestId("global-setting-button");
        fireEvent.click(toggleBtn);

        expect(screen.getByText("Mode Hafalan")).toBeInTheDocument();
        expect(screen.getByText("Sembunyikan Arab")).toBeInTheDocument();
        expect(screen.getAllByText("Sembunyikan Terjemahan").length).toBeGreaterThan(0);
        expect(screen.getByText("Tampilan")).toBeInTheDocument();
        expect(screen.getByText("Alur (Mushaf)")).toBeInTheDocument();
    });

    test("shows Mode Hafalan and Tampilan options when pathname is /dashboard/quran/Al-Faatiha", () => {
        usePathname.mockReturnValue("/dashboard/quran/Al-Faatiha");

        render(
            <SettingsProvider>
                <SettingButton />
            </SettingsProvider>,
        );

        const toggleBtn = screen.getByTestId("global-setting-button");
        fireEvent.click(toggleBtn);

        expect(screen.getByText("Mode Hafalan")).toBeInTheDocument();
        expect(screen.getByText("Sembunyikan Arab")).toBeInTheDocument();
        expect(screen.getAllByText("Sembunyikan Terjemahan").length).toBeGreaterThan(0);
        expect(screen.getByText("Tampilan")).toBeInTheDocument();
        expect(screen.getByText("Alur (Mushaf)")).toBeInTheDocument();
    });

    test("hides Mode Hafalan and Tampilan when pathname is /hadith/bukhari", () => {
        usePathname.mockReturnValue("/hadith/bukhari");

        render(
            <SettingsProvider>
                <SettingButton />
            </SettingsProvider>,
        );

        const toggleBtn = screen.getByTestId("global-setting-button");
        fireEvent.click(toggleBtn);

        expect(screen.queryByText("Mode Hafalan")).not.toBeInTheDocument();
        expect(screen.queryByText("Alur (Mushaf)")).not.toBeInTheDocument();
    });

    test("allows selecting a hafalan mode", () => {
        usePathname.mockReturnValue("/quran/surah/Al-Faatiha");

        render(
            <SettingsProvider>
                <SettingButton />
            </SettingsProvider>,
        );

        fireEvent.click(screen.getByTestId("global-setting-button"));
        fireEvent.click(screen.getByText("Sembunyikan Arab"));

        const stored = JSON.parse(
            localStorage.getItem("tholabul_app_settings") ?? "{}",
        );
        expect(stored.quranHafalanMode).toBe("hide_arabic");
    });

    test("allows toggling quran fullscreen", () => {
        usePathname.mockReturnValue("/quran/surah/Al-Faatiha");

        render(
            <SettingsProvider>
                <SettingButton />
            </SettingsProvider>,
        );

        fireEvent.click(screen.getByTestId("global-setting-button"));
        const fsBtn = screen.getByText("Layar Penuh (Tanpa Navbar)");
        expect(fsBtn).toBeInTheDocument();

        fireEvent.click(fsBtn);

        const stored = JSON.parse(
            localStorage.getItem("tholabul_app_settings") ?? "{}",
        );
        expect(stored.quranFullscreen).toBe(true);
        expect(document.body.classList.contains("quran-fullscreen")).toBe(true);
    });
});
