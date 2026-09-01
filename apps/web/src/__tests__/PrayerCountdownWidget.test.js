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

    // A failed schedule fetch must say so; silently rendering nothing leaves a
    // hole on the dashboard with no explanation.
    test("surfaces an error when the schedule fetch fails", async () => {
        mockFetch.mockRejectedValue(new Error("fail"));
        render(<PrayerCountdownWidget />);
        expect(
            await screen.findByText("prayer_countdown.error"),
        ).toBeInTheDocument();
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
        expect(
            screen.getByText("prayer_schedule.towards prayer.fajr"),
        ).toBeInTheDocument();
        expect(screen.getAllByText("04:30").length).toBeGreaterThan(0);
        expect(screen.getByText("prayer.sunrise")).toBeInTheDocument();
    });

    test("countdown shows remaining time format", async () => {
        const now = new Date();
        now.setHours(3, 0, 0, 0);
        jest.setSystemTime(now);
        mockFetch.mockResolvedValue({
            json: async () => ({ data: { prayers: mockPrayers } }),
        });

        render(<PrayerCountdownWidget />);
        expect(
            await screen.findByText("prayer_schedule.towards prayer.fajr"),
        ).toBeInTheDocument();
        expect(
            screen.getByText(/prayer_countdown.remaining_/),
        ).toBeInTheDocument();
    });

    test("builds the request from the saved method and madhab", async () => {
        mockFetch.mockResolvedValue({
            json: async () => ({ data: { prayers: mockPrayers } }),
        });

        render(<PrayerCountdownWidget />);
        await screen.findByText("Jakarta");
        const url = mockFetch.mock.calls[0][0];
        expect(url).toContain("method=kemenag");
        expect(url).toContain("madhab=shafi");
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
