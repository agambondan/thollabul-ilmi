import { render, screen, waitFor } from "@testing-library/react";

const mockToday = jest.fn();

jest.mock("@/lib/api", () => ({
    hijriApi: { today: (...a) => mockToday(...a) },
}));

jest.mock("@/context/Locale", () => ({
    useLocale: () => ({ t: (k) => k, lang: "ID" }),
}));

jest.mock("@/lib/puasaSunnah", () => ({
    getPuasaSunnahForDate: () => [
        {
            id: "ayyamul_bid",
            label_id: "Puasa Ayyamul Bid",
            dalil: "Sunnah muakkad",
        },
    ],
    PUASA_SUNNAH: [
        {
            id: "ayyamul_bid",
            label_id: "Puasa Ayyamul Bid",
            dalil: "Sunnah muakkad",
        },
        { id: "senin_kamis", label_id: "Puasa Senin Kamis", dalil: "Sunnah" },
    ],
}));

const PuasaSunnahPanel = require("@/components/PuasaSunnahPanel").default;

describe("PuasaSunnahPanel", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("shows loading state initially", () => {
        mockToday.mockReturnValue(new Promise(() => {}));
        const { container } = render(<PuasaSunnahPanel />);
        expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
    });

    test("renders today fasting info", async () => {
        mockToday.mockResolvedValue({
            json: async () => ({ hijri: { day: 15, month: 3, year: 1446 } }),
        });
        render(<PuasaSunnahPanel />);
        expect(await screen.findByText("puasa.title")).toBeInTheDocument();
        expect(screen.getByText("puasa.today")).toBeInTheDocument();
    });

    test("renders disclaimer", async () => {
        mockToday.mockResolvedValue({
            json: async () => ({ hijri: { day: 15, month: 3, year: 1446 } }),
        });
        render(<PuasaSunnahPanel />);
        expect(await screen.findByText("puasa.disclaimer")).toBeInTheDocument();
    });

    test("renders show all details", async () => {
        mockToday.mockResolvedValue({
            json: async () => ({ hijri: { day: 15, month: 3, year: 1446 } }),
        });
        render(<PuasaSunnahPanel />);
        expect(await screen.findByText(/puasa.show_all/)).toBeInTheDocument();
    });

    test("returns null when API fails", async () => {
        mockToday.mockRejectedValue(new Error("fail"));
        const { container } = render(<PuasaSunnahPanel />);
        await waitFor(() => {
            expect(container.innerHTML).toBe("");
        });
    });
});
