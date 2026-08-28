import AsyncStorage from "@react-native-async-storage/async-storage";

jest.mock("../context/SessionContext", () => ({
    useSession: jest.fn(),
}));

jest.mock("../api/personal", () => ({
    getAchievements: jest.fn(),
    getMyAchievements: jest.fn(),
    getMyPoints: jest.fn(),
    getMyStreak: jest.fn(),
    getHafalanSummary: jest.fn(),
    getPrayerStats: jest.fn(),
    getTilawahSummary: jest.fn(),
}));

jest.mock("../api/auth", () => ({
    getAuthSessions: jest.fn(),
    revokeAuthSession: jest.fn(),
    updatePassword: jest.fn(),
    updateProfile: jest.fn(),
}));

jest.mock("lucide-react-native", () => {
    const icons = {};
    const names = [
        "ArrowLeft",
        "Bell",
        "BookOpen",
        "ChevronRight",
        "HardDrive",
        "Lock",
        "LogOut",
        "Palette",
        "Settings",
        "ShieldCheck",
        "Sparkles",
        "Target",
        "Trophy",
        "User",
    ];
    names.forEach((n) => {
        icons[n] = n;
    });
    return icons;
});

jest.mock("../components/Screen", () => ({
    Screen: ({ children, title, contentStyle }) => {
        const { View, Text } = require("react-native");
        return (
            <View style={contentStyle}>
                <Text>{title}</Text>
                {children}
            </View>
        );
    },
}));

jest.mock("../components/Card", () => {
    const { View } = require("react-native");
    return {
        Card: ({ children, style }) => <View style={style}>{children}</View>,
    };
});

jest.mock("../components/SessionCard", () => {
    const { Text } = require("react-native");
    return { SessionCard: () => <Text>SessionCard</Text> };
});

jest.mock("../components/NotificationCenter", () => {
    const { Text } = require("react-native");
    return { NotificationCenter: () => <Text>NotificationCenter</Text> };
});

jest.mock("../components/OfflinePackCard", () => {
    const { Text } = require("react-native");
    return { OfflinePackCard: () => <Text>OfflinePackCard</Text> };
});

jest.mock("../hooks/useLayoutModePreference", () => ({
    useLayoutModePreference: jest.fn(),
}));

import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { StyleSheet } from "react-native";
import { ProfileScreen } from "../screens/ProfileScreen";

const { useSession } = require("../context/SessionContext");
const { useLayoutModePreference } = require("../hooks/useLayoutModePreference");
const authApi = require("../api/auth");
const personalApi = require("../api/personal");

const defaultSession = {
    error: "",
    loading: false,
    session: null,
    deleteAccount: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
    updateCurrentUser: jest.fn(),
    user: null,
};

const loggedInSession = {
    ...defaultSession,
    session: {
        user: { id: "1", email: "test@test.com", name: "Test User" },
        token: "abc",
    },
    updateCurrentUser: jest.fn(),
    user: { id: "1", email: "test@test.com", name: "Test User" },
};

beforeEach(() => {
    jest.clearAllMocks();
    useSession.mockReturnValue(defaultSession);
    useLayoutModePreference.mockReturnValue({
        isDarkTheme: false,
        isWebAppLayout: false,
    });
    personalApi.getAchievements.mockResolvedValue([]);
    personalApi.getMyAchievements.mockResolvedValue([]);
    personalApi.getMyPoints.mockResolvedValue(null);
    personalApi.getMyStreak.mockResolvedValue(null);
    personalApi.getHafalanSummary.mockResolvedValue(null);
    personalApi.getPrayerStats.mockResolvedValue(null);
    personalApi.getTilawahSummary.mockResolvedValue(null);
    authApi.updatePassword.mockResolvedValue({});
    authApi.updateProfile.mockResolvedValue({
        id: "1",
        email: "test@test.com",
        name: "Test User",
        preferred_lang: "en",
    });
    authApi.getAuthSessions.mockResolvedValue([]);
    authApi.revokeAuthSession.mockResolvedValue({});
});

describe("ProfileScreen", () => {
    test("renders guest state when not logged in", async () => {
        const { getByText } = render(<ProfileScreen isActive />);
        await waitFor(() => {
            expect(getByText("Profil")).toBeTruthy();
            expect(getByText("Thullabul Ilmi")).toBeTruthy();
            expect(getByText("Belum masuk ke akun")).toBeTruthy();
        });
    });

    test("uses web app Profile surface when web app layout is active", async () => {
        useLayoutModePreference.mockReturnValue({
            isDarkTheme: false,
            isWebAppLayout: true,
        });
        const { getAllByText, getByText, getByTestId, queryByTestId } = render(
            <ProfileScreen isActive />,
        );

        await waitFor(() => {
            expect(getByTestId("profile-web-app-surface")).toBeTruthy();
        });
        expect(queryByTestId("profile-classic-surface")).toBeNull();
        expect(getByText("AKUN")).toBeTruthy();
        expect(getAllByText("Pengaturan").length).toBeGreaterThan(0);
        expect(getByText("PENCAPAIAN")).toBeTruthy();
        expect(getByText("AKSI AKUN")).toBeTruthy();
        expect(queryByTestId("screen-title")).toBeNull();
    });

    test("uses light web app Profile palette when theme is light", async () => {
        useLayoutModePreference.mockReturnValue({
            isDarkTheme: false,
            isWebAppLayout: true,
        });
        const { getByTestId, getByText } = render(<ProfileScreen isActive />);

        await waitFor(() => expect(getByText("AKUN")).toBeTruthy());

        expect(
            StyleSheet.flatten(
                getByTestId("profile-web-app-scroll").props.style,
            ),
        ).toEqual(expect.objectContaining({ backgroundColor: "#ffffff" }));
        expect(
            StyleSheet.flatten(getByTestId("profile-web-app-hero").props.style),
        ).toEqual(
            expect.objectContaining({
                backgroundColor: "#ffffff",
                borderColor: "#e5e7eb",
            }),
        );
    });

    test("keeps dark web app Profile palette when theme is dark", async () => {
        useLayoutModePreference.mockReturnValue({
            isDarkTheme: true,
            isWebAppLayout: true,
        });
        const { getByTestId, getByText } = render(<ProfileScreen isActive />);

        await waitFor(() => expect(getByText("AKUN")).toBeTruthy());

        expect(
            StyleSheet.flatten(
                getByTestId("profile-web-app-scroll").props.style,
            ),
        ).toEqual(expect.objectContaining({ backgroundColor: "#020617" }));
        expect(
            StyleSheet.flatten(getByTestId("profile-web-app-hero").props.style),
        ).toEqual(
            expect.objectContaining({
                backgroundColor: "#111827",
                borderColor: "#243044",
            }),
        );
    });

    test("renders user info when logged in", async () => {
        useSession.mockReturnValue(loggedInSession);
        personalApi.getMyPoints.mockResolvedValue({ total_points: 1500 });
        personalApi.getMyStreak.mockResolvedValue({ current_streak: 7 });
        personalApi.getHafalanSummary.mockResolvedValue({ memorized_count: 5 });

        const { getByText } = render(<ProfileScreen isActive />);
        await waitFor(() => {
            expect(getByText("Test User")).toBeTruthy();
            expect(getByText("test@test.com")).toBeTruthy();
            expect(getByText("1.500")).toBeTruthy();
            expect(getByText("7")).toBeTruthy();
            expect(getByText("5")).toBeTruthy();
        });
    });

    test("shows stats summary with points and streak", async () => {
        useSession.mockReturnValue(loggedInSession);
        personalApi.getMyPoints.mockResolvedValue({ points: 500 });
        personalApi.getMyStreak.mockResolvedValue({ streak: 3 });
        personalApi.getHafalanSummary.mockRejectedValue(new Error("fail"));
        personalApi.getPrayerStats.mockRejectedValue(new Error("fail"));
        personalApi.getTilawahSummary.mockRejectedValue(new Error("fail"));

        const { getByText, queryByText } = render(<ProfileScreen isActive />);
        await waitFor(() => {
            expect(getByText("500")).toBeTruthy();
            expect(getByText("3")).toBeTruthy();
        });
        expect(queryByText("Surah Hafalan")).toBeNull();
        expect(queryByText("Sholat Minggu Ini")).toBeNull();
        expect(queryByText("Halaman Tilawah")).toBeNull();
    });

    test("renders guest login prompt row when not logged in", async () => {
        const { getByText } = render(<ProfileScreen isActive />);
        await waitFor(() => {
            expect(getByText("Masuk / Daftar")).toBeTruthy();
        });
    });

    test("settings navigation opens settings screen", async () => {
        useSession.mockReturnValue(loggedInSession);

        const { getByText, getByLabelText, getByTestId } = render(
            <ProfileScreen isActive />,
        );
        await waitFor(() => expect(getByText("Test User")).toBeTruthy());

        fireEvent.press(getByLabelText("Buka pengaturan profil"));
        expect(getByText("Pengaturan")).toBeTruthy();
        expect(getByTestId("profile-classic-subscreen")).toBeTruthy();
        expect(getByText("Akun")).toBeTruthy();
        expect(getByText("Notifikasi")).toBeTruthy();
    });

    test("settings sub-screen shows session card and logout", async () => {
        useSession.mockReturnValue(loggedInSession);

        const { getByText, getByLabelText } = render(
            <ProfileScreen isActive />,
        );
        await waitFor(() => expect(getByText("Test User")).toBeTruthy());

        fireEvent.press(getByLabelText("Buka pengaturan profil"));
        fireEvent.press(getByText("Akun"));
        expect(getByText("SessionCard")).toBeTruthy();
        expect(getByText("Keluar dari Akun")).toBeTruthy();
    });

    test("signOut called on logout button press", async () => {
        const signOut = jest.fn();
        useSession.mockReturnValue({ ...loggedInSession, signOut });

        const { getByText, getByLabelText } = render(
            <ProfileScreen isActive />,
        );
        await waitFor(() => expect(getByText("Test User")).toBeTruthy());

        fireEvent.press(getByLabelText("Buka pengaturan profil"));
        fireEvent.press(getByText("Akun"));
        fireEvent.press(getByText("Keluar dari Akun"));
        expect(signOut).toHaveBeenCalled();
    });

    test("notifications sub-screen renders", async () => {
        useSession.mockReturnValue(loggedInSession);

        const { getByText, getByLabelText } = render(
            <ProfileScreen isActive />,
        );
        await waitFor(() => expect(getByText("Test User")).toBeTruthy());

        fireEvent.press(getByLabelText("Buka pengaturan profil"));
        fireEvent.press(getByText("Notifikasi"));
        expect(getByText("NotificationCenter")).toBeTruthy();
    });

    test("storage sub-screen renders", async () => {
        useSession.mockReturnValue(loggedInSession);

        const { getByText, getByLabelText } = render(
            <ProfileScreen isActive />,
        );
        await waitFor(() => expect(getByText("Test User")).toBeTruthy());

        fireEvent.press(getByLabelText("Buka pengaturan profil"));
        fireEvent.press(getByText("Penyimpanan"));
        expect(getByText("OfflinePackCard")).toBeTruthy();
    });

    test("appearance sub-screen saves language preference to account", async () => {
        const updateCurrentUser = jest.fn();
        useSession.mockReturnValue({ ...loggedInSession, updateCurrentUser });

        const { getByLabelText, getByText, findByText } = render(
            <ProfileScreen isActive />,
        );
        await waitFor(() => expect(getByText("Test User")).toBeTruthy());

        fireEvent.press(getByLabelText("Buka pengaturan profil"));
        fireEvent.press(getByText("Tampilan"));
        expect(getByText("Ikuti Sistem")).toBeTruthy();
        expect(getByText("Bahasa Konten")).toBeTruthy();

        fireEvent.press(getByText("English"));

        await waitFor(() =>
            expect(authApi.updateProfile).toHaveBeenCalledWith({
                preferredLang: "en",
            }),
        );
        expect(updateCurrentUser).toHaveBeenCalledWith({
            id: "1",
            email: "test@test.com",
            name: "Test User",
            preferred_lang: "en",
        });
        expect(
            await findByText(
                "Bahasa konten tersimpan ke akun dan perangkat ini.",
            ),
        ).toBeTruthy();
    });

    test("appearance sub-screen saves layout mode without changing theme preference", async () => {
        const { getByLabelText, getByText, findByText } = render(
            <ProfileScreen isActive />,
        );
        await waitFor(() => expect(getByText("Thullabul Ilmi")).toBeTruthy());

        fireEvent.press(getByLabelText("Buka pengaturan profil"));
        fireEvent.press(getByText("Tampilan"));
        fireEvent.press(getByText("Web App"));

        await waitFor(() => {
            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                "tholabul:pref:app-layout-mode",
                '"web_app"',
            );
        });
        expect(AsyncStorage.setItem).not.toHaveBeenCalledWith(
            "tholabul:pref:app-theme",
            expect.any(String),
        );
        expect(
            await findByText("Mode layout tersimpan di perangkat ini."),
        ).toBeTruthy();
    });

    test("security sub-screen updates password and shows current device session", async () => {
        useSession.mockReturnValue(loggedInSession);
        authApi.getAuthSessions.mockResolvedValue([
            { id: 1, current: true, created_at: "2026-05-29T01:00:00Z" },
        ]);

        const { getByLabelText, getByPlaceholderText, getByText, findByText } =
            render(<ProfileScreen isActive />);
        await waitFor(() => expect(getByText("Test User")).toBeTruthy());

        fireEvent.press(getByLabelText("Buka pengaturan profil"));
        fireEvent.press(getByText("Keamanan"));
        expect(getByText("Perangkat ini")).toBeTruthy();
        expect(getByText("test@test.com")).toBeTruthy();
        await waitFor(() => expect(authApi.getAuthSessions).toHaveBeenCalled());
        expect(getByText(/Aktif sejak/)).toBeTruthy();

        fireEvent.changeText(
            getByPlaceholderText("Sandi saat ini"),
            "old-pass",
        );
        fireEvent.changeText(
            getByPlaceholderText("Sandi baru minimal 8 karakter"),
            "new-pass-123",
        );
        fireEvent.changeText(
            getByPlaceholderText("Konfirmasi sandi baru"),
            "new-pass-123",
        );
        fireEvent.press(getByText("Simpan Sandi Baru"));

        await waitFor(() =>
            expect(authApi.updatePassword).toHaveBeenCalledWith({
                oldPassword: "old-pass",
                newPassword: "new-pass-123",
            }),
        );
        expect(await findByText("Sandi berhasil diperbarui.")).toBeTruthy();
    });

    test("security sub-screen can revoke another active session", async () => {
        useSession.mockReturnValue({
            ...loggedInSession,
            session: {
                ...loggedInSession.session,
                refreshToken: "current-refresh",
            },
        });
        authApi.getAuthSessions
            .mockResolvedValueOnce([
                { id: 1, current: true, created_at: "2026-05-29T01:00:00Z" },
                { id: 2, current: false, created_at: "2026-05-29T02:00:00Z" },
            ])
            .mockResolvedValueOnce([
                { id: 1, current: true, created_at: "2026-05-29T01:00:00Z" },
            ]);

        const { getByLabelText, getByText, findByText } = render(
            <ProfileScreen isActive />,
        );
        await waitFor(() => expect(getByText("Test User")).toBeTruthy());

        fireEvent.press(getByLabelText("Buka pengaturan profil"));
        fireEvent.press(getByText("Keamanan"));
        await waitFor(() =>
            expect(authApi.getAuthSessions).toHaveBeenCalledWith(
                "current-refresh",
            ),
        );

        fireEvent.press(getByLabelText("Keluar dari sesi login 2"));

        await waitFor(() =>
            expect(authApi.revokeAuthSession).toHaveBeenCalledWith(
                2,
                "current-refresh",
            ),
        );
        expect(
            await findByText("Sesi login lain berhasil dikeluarkan."),
        ).toBeTruthy();
    });

    test("security sub-screen confirms account deletion before deleting", async () => {
        const deleteAccount = jest.fn().mockResolvedValue({});
        useSession.mockReturnValue({ ...loggedInSession, deleteAccount });

        const { getAllByText, getByLabelText, getByText, findByText } = render(
            <ProfileScreen isActive />,
        );
        await waitFor(() => expect(getByText("Test User")).toBeTruthy());

        fireEvent.press(getByLabelText("Buka pengaturan profil"));
        fireEvent.press(getByText("Keamanan"));
        await waitFor(() => expect(authApi.getAuthSessions).toHaveBeenCalled());
        fireEvent.press(getAllByText("Hapus Akun").at(-1));

        expect(deleteAccount).not.toHaveBeenCalled();
        expect(
            await findByText(
                "Tekan sekali lagi untuk menghapus akun dan keluar dari perangkat ini.",
            ),
        ).toBeTruthy();

        fireEvent.press(getByText("Konfirmasi Hapus Akun"));
        await waitFor(() => expect(deleteAccount).toHaveBeenCalled());
    });

    test("achievements are displayed", async () => {
        useSession.mockReturnValue(loggedInSession);
        personalApi.getAchievements.mockResolvedValue([
            {
                achievement: {
                    code: "streak_7",
                    name: "Streak 7 Hari",
                    icon: "🔥",
                },
                earned_at: "2024-01-01",
            },
            {
                achievement: {
                    code: "tilawah_first",
                    name: "Tilawah Perdana",
                    icon: "📖",
                },
            },
        ]);

        const { getByText } = render(<ProfileScreen isActive />);
        await waitFor(() => {
            expect(getByText("PENCAPAIAN")).toBeTruthy();
            expect(getByText("Streak 7 Hari")).toBeTruthy();
            expect(getByText("Tilawah Perdana")).toBeTruthy();
        });
    });

    test("opens achievements detail with earned, locked, progress, and reward state", async () => {
        useSession.mockReturnValue(loggedInSession);
        personalApi.getMyPoints.mockResolvedValue({ total_points: 120 });
        personalApi.getMyStreak.mockResolvedValue({ current_streak: 3 });
        personalApi.getHafalanSummary.mockResolvedValue({ memorized_count: 1 });
        personalApi.getAchievements.mockResolvedValue([
            {
                id: 1,
                code: "streak_7",
                name: "Seminggu Penuh",
                description: "Streak 7 hari",
                icon: "⚡",
                category: "streak",
                threshold: 7,
            },
            {
                id: 2,
                code: "hafalan_5",
                name: "5 Surah Hafal",
                description: "Hafal 5 surah",
                icon: "🕌",
                category: "hafalan",
                threshold: 5,
            },
        ]);
        personalApi.getMyAchievements.mockResolvedValue([
            {
                achievement_id: 1,
                earned_at: "2024-01-01",
                achievement: {
                    id: 1,
                    code: "streak_7",
                    name: "Seminggu Penuh",
                    description: "Streak 7 hari",
                    icon: "⚡",
                    category: "streak",
                    threshold: 7,
                },
            },
        ]);

        const { getAllByText, getByText } = render(<ProfileScreen isActive />);
        await waitFor(() => {
            expect(getByText("Seminggu Penuh")).toBeTruthy();
        });

        fireEvent.press(getByText("Lihat semua"));

        expect(getByText("Total Poin")).toBeTruthy();
        expect(getByText("120")).toBeTruthy();
        expect(getByText("1/2 badge diperoleh")).toBeTruthy();
        expect(getByText("Diperoleh")).toBeTruthy();
        expect(getByText("Terkunci")).toBeTruthy();
        expect(getByText("3/7 hari")).toBeTruthy();
        expect(getByText("1/5 surah")).toBeTruthy();
        expect(getAllByText("Reward 10 poin")).toHaveLength(2);
    });

    test("uses dashboard Achievements route surface in web app layout", async () => {
        useLayoutModePreference.mockReturnValue({
            isDarkTheme: false,
            isWebAppLayout: true,
        });
        useSession.mockReturnValue(loggedInSession);
        personalApi.getMyPoints.mockResolvedValue({ total_points: 120 });
        personalApi.getAchievements.mockResolvedValue([
            {
                id: 1,
                code: "streak_7",
                name: "Seminggu Penuh",
                description: "Streak 7 hari",
                icon: "⚡",
            },
            {
                id: 2,
                code: "hafalan_5",
                name: "5 Surah Hafal",
                description: "Hafal 5 surah",
                icon: "🕌",
            },
        ]);
        personalApi.getMyAchievements.mockResolvedValue([
            {
                achievement_id: 1,
                achievement: {
                    id: 1,
                    code: "streak_7",
                    name: "Seminggu Penuh",
                    icon: "⚡",
                },
            },
        ]);

        const { getByTestId, getByText, queryByLabelText, queryByTestId } =
            render(<ProfileScreen isActive />);
        await waitFor(() => expect(getByText("Seminggu Penuh")).toBeTruthy());

        fireEvent.press(getByText("Lihat semua"));

        expect(getByTestId("profile-web-app-achievements-route")).toBeTruthy();
        expect(queryByTestId("profile-web-app-subscreen")).toBeNull();
        expect(queryByLabelText("Kembali")).toBeNull();
        expect(getByText("Pencapaian")).toBeTruthy();
        expect(
            getByText("Kumpulkan badge dengan menyelesaikan aktivitas"),
        ).toBeTruthy();
        expect(getByText("Total Poin")).toBeTruthy();
        expect(getByText("120")).toBeTruthy();
        expect(getByText("1/2 badge diperoleh")).toBeTruthy();
        expect(getByText("Diperoleh")).toBeTruthy();
        expect(getByText("Terkunci")).toBeTruthy();
    });

    test("achievements message shown when not logged in", async () => {
        const { getByText } = render(<ProfileScreen isActive />);
        await waitFor(() => {
            expect(
                getByText("Masuk untuk melihat badge yang sudah kamu raih."),
            ).toBeTruthy();
        });
    });

    test("back button on sub-screen returns to main", async () => {
        useSession.mockReturnValue(loggedInSession);

        const { getByText, getByLabelText } = render(
            <ProfileScreen isActive />,
        );
        await waitFor(() => expect(getByText("Test User")).toBeTruthy());

        fireEvent.press(getByLabelText("Buka pengaturan profil"));
        expect(getByText("Pengaturan")).toBeTruthy();

        fireEvent.press(getByLabelText("Kembali"));
        expect(getByText("Profil")).toBeTruthy();
    });
});
