import { render, screen, waitFor } from "@testing-library/react";
import AdminAdsPage from "@/app/admin/ads/page";
import { adminAdsApi } from "@/lib/api";

jest.mock("@/lib/api", () => ({
    adminAdsApi: {
        list: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    parseApiError: jest.fn(),
}));

describe("AdminAdsPage", () => {
    it("renders ads list from api", async () => {
        adminAdsApi.list.mockResolvedValueOnce({
            ok: true,
            json: async () => [
                {
                    id: "ad-uuid-1",
                    title: "Sponsor Kajian",
                    click_url: "https://sponsor.org",
                    slot_type: "banner",
                    priority: 5,
                    is_active: true,
                },
            ],
        });

        render(<AdminAdsPage />);
        expect(screen.getByText("Iklan Langsung")).toBeInTheDocument();
        await waitFor(() => {
            expect(screen.getAllByText("Sponsor Kajian").length).toBeGreaterThan(0);
        });
    });
});
