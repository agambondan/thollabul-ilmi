import { render, screen, waitFor } from "@testing-library/react";
import BannerAd from "@/components/ads/BannerAd";
import { adsApi } from "@/lib/api";

jest.mock("@/lib/api", () => ({
    adsApi: {
        getActiveSlot: jest.fn(),
    },
}));

jest.mock("next/navigation", () => ({
    usePathname: () => "/",
}));

describe("BannerAd component", () => {
    it("renders nothing when no active ad returned", async () => {
        adsApi.getActiveSlot.mockResolvedValueOnce(null);
        const { container } = render(<BannerAd slot="banner" />);
        await waitFor(() => {
            expect(container.firstChild).toBeNull();
        });
    });

    it("renders direct ad banner when ad exists", async () => {
        adsApi.getActiveSlot.mockResolvedValueOnce({
            data: {
                id: "123",
                title: "Kajian Sunnah Akbar",
                click_url: "https://example.com/kajian",
                slot_type: "banner",
            },
        });

        render(<BannerAd slot="banner" />);
        await waitFor(() => {
            expect(screen.getByText("Kajian Sunnah Akbar")).toBeInTheDocument();
        });
        expect(screen.getByText("Iklan")).toBeInTheDocument();
        const link = screen.getByRole("link");
        expect(link).toHaveAttribute("href", "https://example.com/kajian");
    });
});
