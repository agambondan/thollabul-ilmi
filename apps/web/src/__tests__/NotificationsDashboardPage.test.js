import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import NotificationsPage from "@/app/dashboard/notifications/page";
import { notificationApi, notificationInboxApi } from "@/lib/api";

jest.mock("@/lib/api", () => ({
    notificationApi: {
        getSettings: jest.fn().mockResolvedValue({ json: async () => [] }),
        getChannels: jest.fn().mockResolvedValue({ json: async () => ({ email: true, whatsapp: false, push: true }) }),
        getPushTokens: jest.fn().mockResolvedValue({ json: async () => ({ has_active: false }) }),
    },
    notificationInboxApi: {
        list: jest.fn(),
        markRead: jest.fn().mockResolvedValue({ ok: true }),
        markAllRead: jest.fn().mockResolvedValue({ ok: true }),
        delete: jest.fn().mockResolvedValue({ ok: true }),
    },
}));

jest.mock("@/context/Auth", () => ({
    useAuth: () => ({
        isAuthenticated: true,
        user: { id: "u1", email: "user@test.com" },
    }),
}));

jest.mock("@/context/Locale", () => ({
    useLocale: () => ({
        t: (k) => k,
        lang: "ID",
    }),
}));

jest.mock("next/link", () => {
    const Link = ({ children, ...props }) => (
        <a href={props.href}>{children}</a>
    );
    return { __esModule: true, default: Link };
});

describe("NotificationsDashboardPage", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it("renders notification items with channel and priority badges", async () => {
        notificationInboxApi.list.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                items: [
                    {
                        id: "n1",
                        title: "Reset Password Berhasil",
                        body: "Password akun Anda telah direset",
                        type: "doa",
                        channel: "email",
                        priority: "critical",
                        is_read: false,
                        created_at: "2026-09-18T10:00:00Z",
                    },
                    {
                        id: "n2",
                        title: "Pengingat Harian",
                        body: "Baca Al-Quran hari ini",
                        type: "daily_quran",
                        channel: "inbox",
                        priority: "normal",
                        is_read: true,
                        created_at: "2026-09-18T09:00:00Z",
                    },
                ],
                unread_count: 1,
            }),
        });

        render(<NotificationsPage />);

        await waitFor(() => {
            expect(screen.getByText("Reset Password Berhasil")).toBeInTheDocument();
        });

        expect(screen.getByText("EMAIL")).toBeInTheDocument();
        expect(screen.getByText("notif.priority_critical")).toBeInTheDocument();
        expect(screen.getByText("Pengingat Harian")).toBeInTheDocument();

        // Filter by channel
        const emailFilterBtn = screen.getByRole("button", { name: "notif.channel_email" });
        fireEvent.click(emailFilterBtn);

        expect(screen.getByText("Reset Password Berhasil")).toBeInTheDocument();
        expect(screen.queryByText("Pengingat Harian")).not.toBeInTheDocument();

        // Reset to all
        const allFilterBtn = screen.getByRole("button", { name: "notif.filter_all" });
        fireEvent.click(allFilterBtn);
        expect(screen.getByText("Pengingat Harian")).toBeInTheDocument();
    });
});
