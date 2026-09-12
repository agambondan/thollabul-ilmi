import {
    fireEvent,
    render,
    screen,
    waitFor,
    within,
} from "@testing-library/react";
import AdminManasikPage from "@/app/admin/manasik/page";
import { adminManasikApi } from "@/lib/api";

jest.mock("@/lib/api", () => ({
    adminManasikApi: {
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

const ITEMS = [
    { id: 1, type: "haji", step: 3, title: "Wukuf di Arafah" },
    { id: 2, type: "haji", step: 1, title: "Ihram" },
    { id: 3, type: "haji", step: 2, title: "Tawaf Qudum" },
    { id: 4, type: "umrah", step: 1, title: "Ihram Umrah" },
];

// The page renders both a mobile card list and a desktop table unconditionally
// (visibility is CSS-only, via `md:hidden` / `hidden md:block`), so jsdom sees
// both at once. Scope every query to the desktop `<table>` to avoid duplicate
// matches from the mobile card view.
const tableTitles = () =>
    within(screen.getByRole("table"))
        .getAllByRole("row")
        .slice(1) // skip the header row
        .map((row) => within(row).getAllByRole("cell")[1].textContent);

describe("Admin Manasik page — type filter and sort", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        adminManasikApi.list.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ items: ITEMS }),
        });
    });

    test("type toggle narrows the list to haji steps only, sorted by step", async () => {
        render(<AdminManasikPage />);
        await waitFor(() => {
            expect(screen.getByRole("table")).toBeInTheDocument();
        });
        expect(tableTitles()).toEqual([
            "Ihram",
            "Tawaf Qudum",
            "Wukuf di Arafah",
        ]);

        fireEvent.click(screen.getByRole("button", { name: "umrah" }));
        expect(tableTitles()).toEqual(["Ihram Umrah"]);
    });

    test("clicking the Title header sorts the list alphabetically, then reverses", async () => {
        render(<AdminManasikPage />);
        await waitFor(() => {
            expect(screen.getByRole("table")).toBeInTheDocument();
        });

        const titleHeader = within(screen.getByRole("table")).getByRole(
            "button",
            { name: /admin\.field\.title/ },
        );

        fireEvent.click(titleHeader);
        expect(tableTitles()).toEqual([
            "Ihram",
            "Tawaf Qudum",
            "Wukuf di Arafah",
        ]);

        fireEvent.click(titleHeader);
        expect(tableTitles()).toEqual([
            "Wukuf di Arafah",
            "Tawaf Qudum",
            "Ihram",
        ]);
    });
});
