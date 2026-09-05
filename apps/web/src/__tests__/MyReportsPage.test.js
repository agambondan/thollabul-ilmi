import { render, screen, waitFor } from "@testing-library/react";
import MyReportsPage from "@/app/dashboard/reports/page";
import { contentReportApi } from "@/lib/api";

jest.mock("@/lib/api", () => ({
    contentReportApi: {
        listMine: jest.fn(),
    },
}));

jest.mock("@/lib/useRequireAuth", () => ({
    useRequireAuth: () => ({ isAuthenticated: true, isLoading: false }),
}));

jest.mock("next/link", () => {
    const Link = ({ children, ...props }) => (
        <a href={props.href}>{children}</a>
    );
    return { __esModule: true, default: Link };
});

describe("MyReportsPage", () => {
    it("renders reports from API", async () => {
        contentReportApi.listMine.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                items: [
                    {
                        id: "r1",
                        target_type: "quran",
                        target_id: "1:1",
                        target_title: "QS. Al-Fatihah: 1",
                        status: "resolved",
                        description: "Typo di terjemahan",
                        correction: "Benar: ...",
                        admin_note: "Sudah dibetulkan",
                    },
                ],
                total: 1,
            }),
        });

        render(<MyReportsPage />);
        await waitFor(() => {
            expect(screen.getByText("QS. Al-Fatihah: 1")).toBeInTheDocument();
        });
        expect(screen.getByText(/Typo di terjemahan/i)).toBeInTheDocument();
        expect(screen.getByText(/Sudah dibetulkan/)).toBeInTheDocument();
    });

    it("shows empty state when no reports", async () => {
        contentReportApi.listMine.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ items: [], total: 0 }),
        });

        render(<MyReportsPage />);
        await waitFor(() => {
            expect(
                screen.getByText(/Anda belum pernah mengajukan/i),
            ).toBeInTheDocument();
        });
    });
});
