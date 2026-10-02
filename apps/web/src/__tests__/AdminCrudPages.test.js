import { render, screen, waitFor, within } from "@testing-library/react";
import AdminPanduanSholatPage from "@/app/admin/panduan-sholat/page";
import AdminAchievementsPage from "@/app/admin/achievements/page";
import AdminAmalanPage from "@/app/admin/amalan/page";
import AdminMunasabahPage from "@/app/admin/munasabah/page";
import AdminNotificationTemplatesPage from "@/app/admin/notification-templates/page";
import AdminTokohTarikhPage from "@/app/admin/tokoh-tarikh/page";
import AdminLocationPage from "@/app/admin/locations/page";
import AdminAudioPage from "@/app/admin/audio/page";
import AdminSurahPage from "@/app/admin/surah/page";
import AdminAyahPage from "@/app/admin/ayah/page";
import AdminHadisPage from "@/app/admin/hadis/page";
import {
    adminPanduanSholatApi,
    adminAchievementApi,
    adminAmalanApi,
    adminMunasabahApi,
    adminNotificationTemplateApi,
    adminTokohTarikhApi,
    adminLocationApi,
    adminSurahAudioApi,
    adminAyahAudioApi,
    adminSurahApi,
    adminAyahApi,
    adminHadithApi,
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
    adminMunasabahApi: {
        list: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    adminNotificationTemplateApi: {
        list: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    adminTokohTarikhApi: {
        list: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    adminLocationApi: {
        list: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    adminSurahAudioApi: {
        list: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    adminAyahAudioApi: {
        list: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    adminSurahApi: {
        list: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    adminAyahApi: {
        list: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    adminHadithApi: {
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
            expect(screen.getByRole("table")).toBeInTheDocument();
        });
        const table = screen.getByRole("table");
        expect(within(table).getByText("Niat Sholat")).toBeInTheDocument();
        expect(screen.getAllByText("#1")[0]).toBeInTheDocument();
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
            expect(screen.getByRole("table")).toBeInTheDocument();
        });
        const table = screen.getByRole("table");
        expect(within(table).getByText("streak_7")).toBeInTheDocument();
        expect(within(table).getByText("Pejuang Subuh")).toBeInTheDocument();
        expect(within(table).getByText("7")).toBeInTheDocument();
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
            expect(screen.getByRole("table")).toBeInTheDocument();
        });
        const table = screen.getByRole("table");
        expect(within(table).getByText("Sholat Dhuha")).toBeInTheDocument();
        expect(within(table).getByText("Aktif")).toBeInTheDocument();
    });

    test("AdminMunasabahPage renders relations from API", async () => {
        adminMunasabahApi.list.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                items: [
                    {
                        id: 1,
                        ayah_from_id: 1,
                        ayah_to_id: 2,
                        description: "Korelasi ayat 1 dan 2 Al-Fatihah",
                    },
                ],
            }),
        });

        render(<AdminMunasabahPage />);
        expect(screen.getByText("Munasabah (Hubungan Ayat)")).toBeInTheDocument();
        await waitFor(() => {
            expect(screen.getByRole("table")).toBeInTheDocument();
        });
        const table = screen.getByRole("table");
        expect(within(table).getByText("Korelasi ayat 1 dan 2 Al-Fatihah")).toBeInTheDocument();
    });

    test("AdminNotificationTemplatesPage renders templates list from API", async () => {
        adminNotificationTemplateApi.list.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                items: [
                    {
                        id: 1,
                        code: "adzan_subuh",
                        title: "Waktu Subuh",
                        channel: "push",
                        body: "Saatnya menunaikan sholat Subuh",
                    },
                ],
            }),
        });

        render(<AdminNotificationTemplatesPage />);
        expect(screen.getByText("Template Notifikasi")).toBeInTheDocument();
        await waitFor(() => {
            expect(screen.getByRole("table")).toBeInTheDocument();
        });
        const table = screen.getByRole("table");
        expect(within(table).getByText("adzan_subuh")).toBeInTheDocument();
        expect(within(table).getByText("Waktu Subuh")).toBeInTheDocument();
    });

    test("AdminTokohTarikhPage renders figures list from API", async () => {
        adminTokohTarikhApi.list.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                items: [
                    {
                        id: 1,
                        nama: "Abu Bakar Ash-Shiddiq",
                        era: "Khulafaur Rasyidin",
                        kategori: "sahabat",
                        biografi: "Khalifah pertama",
                        source: "Sirah Ibnu Hisyam",
                    },
                ],
            }),
        });

        render(<AdminTokohTarikhPage />);
        expect(screen.getByText("Master Tokoh Tarikh")).toBeInTheDocument();
        await waitFor(() => {
            expect(screen.getByRole("table")).toBeInTheDocument();
        });
        const table = screen.getByRole("table");
        expect(within(table).getByText("Abu Bakar Ash-Shiddiq")).toBeInTheDocument();
        expect(within(table).getByText("Khulafaur Rasyidin")).toBeInTheDocument();
    });

    test("AdminLocationPage renders locations list from API", async () => {
        adminLocationApi.list.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                items: [
                    {
                        id: 1,
                        name: "Masjid Nabawi",
                        category: "masjid",
                        latitude: 24.4672,
                        longitude: 39.6111,
                        description: "Masjid di Madinah",
                    },
                ],
            }),
        });

        render(<AdminLocationPage />);
        expect(screen.getByText("Peta Islam / Lokasi")).toBeInTheDocument();
        await waitFor(() => {
            expect(screen.getByRole("table")).toBeInTheDocument();
        });
        const table = screen.getByRole("table");
        expect(within(table).getByText("Masjid Nabawi")).toBeInTheDocument();
    });

    test("AdminAudioPage renders surah audio list from API", async () => {
        adminSurahAudioApi.list.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                items: [
                    {
                        id: 1,
                        surah_id: 1,
                        qari_name: "Misyari Rasyid Al-Afasy",
                        qari_slug: "misyari-alafasy",
                        audio_url: "https://example.com/001.mp3",
                    },
                ],
            }),
        });

        render(<AdminAudioPage />);
        expect(screen.getByText("Audio Murotal Surah")).toBeInTheDocument();
        await waitFor(() => {
            expect(screen.getByRole("table")).toBeInTheDocument();
        });
        const table = screen.getByRole("table");
        expect(within(table).getByText("Misyari Rasyid Al-Afasy")).toBeInTheDocument();
    });

    test("AdminSurahPage renders surahs list from API", async () => {
        adminSurahApi.list.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                items: [
                    {
                        id: 1,
                        number: 1,
                        slug: "al-fatihah",
                        number_of_ayahs: 7,
                        revelation_type: "Makkiyah",
                    },
                ],
            }),
        });

        render(<AdminSurahPage />);
        expect(screen.getByText("Surah Al-Quran")).toBeInTheDocument();
        await waitFor(() => {
            expect(screen.getByRole("table")).toBeInTheDocument();
        });
        const table = screen.getByRole("table");
        expect(within(table).getByText("al-fatihah")).toBeInTheDocument();
    });

    test("AdminHadisPage renders hadith list from API", async () => {
        adminHadithApi.list.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                items: [
                    {
                        id: 1,
                        number: 1,
                        book_id: 1,
                        grade: "shahih",
                        shahih_by: "Bukhari",
                    },
                ],
            }),
        });

        render(<AdminHadisPage />);
        expect(screen.getByText("Hadis (Kutubut Tis-ah)")).toBeInTheDocument();
        await waitFor(() => {
            expect(screen.getByRole("table")).toBeInTheDocument();
        });
        const table = screen.getByRole("table");
        expect(within(table).getByText("shahih")).toBeInTheDocument();
    });
});
