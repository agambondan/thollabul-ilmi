import { render, screen, waitFor } from "@testing-library/react";
import AdminPanduanSholatPage from "@/app/admin/panduan-sholat/page";
import AdminAchievementsPage from "@/app/admin/achievements/page";
import AdminAmalanPage from "@/app/admin/amalan/page";
import {
    adminPanduanSholatApi,
    adminAchievementApi,
    adminAmalanApi,
} from "@/lib/api";

jest.mock("@/lib/api", () => ({
    adminPanduanSholatApi: {
        list: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    adminAchievementApi: {
        list: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    adminAmalanApi: {
        list: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    parseApiError: jest.fn(),
}));

jest.mock("@/context/Locale", () => ({
    useLocale: () => ({
        t: (key) => key,
        lang: "ID",
    }),
}));

describe("Admin CRUD pages", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("AdminPanduanSholatPage renders list items from API", async () => {
        adminPanduanSholatApi.list.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                items: [
                    {
                        id: 1,
                        step: 1,
                        title: "Niat Sholat",
                        arabic: "نَوَيْتُ",
                        latin: "Nawaitu",
                        translation: "Niat di hati",
                        source: "HR. Bukhari No. 1",
                    },
                ],
            }),
        });

        render(<AdminPanduanSholatPage />);
        expect(screen.getByText("Panduan Sholat")).toBeInTheDocument();
        await waitFor(() => {
            expect(screen.getByText("Niat Sholat")).toBeInTheDocument();
        });
        expect(screen.getByText("#1")).toBeInTheDocument();
    });

    test("AdminAchievementsPage renders badges list from API", async () => {
        adminAchievementApi.list.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                items: [
                    {
                        id: 1,
                        code: "streak_7",
                        name: "Pejuang Subuh",
                        icon: "🏆",
                        category: "streak",
                        threshold: 7,
                        description: "Streak 7 hari berturut-turut",
                    },
                ],
            }),
        });

        render(<AdminAchievementsPage />);
        expect(screen.getByText("Achievements")).toBeInTheDocument();
        await waitFor(() => {
            expect(screen.getByText("streak_7")).toBeInTheDocument();
        });
        expect(screen.getByText("Pejuang Subuh")).toBeInTheDocument();
        expect(screen.getByText("7")).toBeInTheDocument();
    });

    test("AdminAmalanPage renders master items list from API", async () => {
        adminAmalanApi.list.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                items: [
                    {
                        id: 1,
                        name: "Sholat Dhuha",
                        category: "sholat",
                        description: "Sholat sunnah 2-8 rakaat",
                        source: "HR. Muslim",
                        is_active: true,
                    },
                ],
            }),
        });

        render(<AdminAmalanPage />);
        expect(screen.getByText("Master Amalan")).toBeInTheDocument();
        await waitFor(() => {
            expect(screen.getByText("Sholat Dhuha")).toBeInTheDocument();
        });
        expect(screen.getByText("Aktif")).toBeInTheDocument();
    });
});
