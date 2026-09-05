import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ContentReportModal from "@/components/ContentReportModal";
import { contentReportApi } from "@/lib/api";

jest.mock("@/lib/api", () => ({
    contentReportApi: {
        create: jest.fn(),
    },
}));

jest.mock("@/context/Auth", () => ({
    useAuth: () => ({ isAuthenticated: true, user: { name: "Tester" } }),
}));

jest.mock("@/context/Locale", () => ({
    useLocale: () => ({
        t: (k) => k,
        lang: "ID",
    }),
}));

describe("ContentReportModal", () => {
    it("submits a report successfully", async () => {
        contentReportApi.create.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ status: "ok" }),
        });

        const onClose = jest.fn();
        render(
            <ContentReportModal
                isOpen={true}
                onClose={onClose}
                targetType="quran"
                targetId="1:1"
                targetTitle="QS. Al-Fatihah: 1"
                snippet="Bismillah"
            />,
        );

        expect(screen.getByText("QS. Al-Fatihah: 1")).toBeInTheDocument();

        fireEvent.change(screen.getByPlaceholderText(/Jelaskan bagian terjemahan/i), {
            target: { value: "Ada kesalahan ketik pada terjemahan." },
        });
        fireEvent.change(screen.getByPlaceholderText(/Teks atau terjemahan yang seharusnya/i), {
            target: { value: "Dengan nama Allah Yang Maha Pengasih" },
        });

        fireEvent.click(screen.getByRole("button", { name: /Kirim Koreksi/i }));

        await waitFor(() => {
            expect(contentReportApi.create).toHaveBeenCalledWith({
                target_type: "quran",
                target_id: "1:1",
                target_title: "QS. Al-Fatihah: 1",
                category: "translation_error",
                description: "Ada kesalahan ketik pada terjemahan.",
                correction: "Dengan nama Allah Yang Maha Pengasih",
            });
        });
    });
});
