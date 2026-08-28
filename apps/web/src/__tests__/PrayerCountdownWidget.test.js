import { render, screen } from "@testing-library/react";
import PrayerCountdownWidget from "@/components/PrayerCountdownWidget";

const mockFetch = jest.fn();
global.fetch = mockFetch;

jest.mock("@/context/Locale", () => ({
    useLocale: () => ({ t: (k) => k, lang: "ID" }),
}));

jest.mock("next/link", () => ({ children, href, ...p }) => (
    <a href={href} {...p}>
        {children}
    </a>
));

jest.mock("next/navigation", () => ({
    useRouter: () => ({ push: jest.fn() }),
    useSearchParams: () => new URLSearchParams(),
    usePathname: () => "/",
}));

const mockPrayers = {
    fajr: "04:30",
    sunrise: "05:54",
    dhuhr: "12:00",
    asr: "15:30",
    maghrib: "18:00",
    isha: "19:30",
};

describe("PrayerCountdownWidget", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test("renders null when prayers not loaded (fetch fails)", () => {
        mockFetch.mockRejectedValue(new Error("fail"));
        const { container } = render(<PrayerCountdownWidget />);
        expect(container.innerHTML).toBe("");
    });

    test("renders next prayer name and countdown", async () => {
        const now = new Date();
        now.setHours(3, 0, 0, 0);
        jest.setSystemTime(now);
        mockFetch.mockResolvedValue({
            json: async () => ({ data: { prayers: mockPrayers } }),
        });

        render(<PrayerCountdownWidget />);
        expect(await screen.findByText("Jakarta")).toBeInTheDocument();
        expect(screen.getByText("Menuju Subuh")).toBeInTheDocument();
        expect(screen.getAllByText("04:30").length).toBeGreaterThan(0);
        expect(screen.getByText("Terbit")).toBeInTheDocument();
    });

    test("countdown shows remaining time format", async () => {
        const now = new Date();
        now.setHours(3, 0, 0, 0);
        jest.setSystemTime(now);
        mockFetch.mockResolvedValue({
            json: async () => ({ data: { prayers: mockPrayers } }),
        });

        render(<PrayerCountdownWidget />);
        expect(await screen.findByText("Menuju Subuh")).toBeInTheDocument();
        expect(screen.getByText(/Subuh dalam/)).toBeInTheDocument();
    });

    test("links to schedule page", async () => {
        mockFetch.mockResolvedValue({
            json: async () => ({ data: { prayers: mockPrayers } }),
        });

        render(<PrayerCountdownWidget />);
        expect(await screen.findByRole("link")).toBeInTheDocument();
        const link = screen.getByRole("link");
        expect(link.getAttribute("href")).toBe("/jadwal-sholat");
    });

    test("supports direct prayers API response", async () => {
        mockFetch.mockResolvedValue({
            json: async () => ({ prayers: mockPrayers }),
        });

        render(<PrayerCountdownWidget />);
        expect(await screen.findByText("Jakarta")).toBeInTheDocument();
    });
});
