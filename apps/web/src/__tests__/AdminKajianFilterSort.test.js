import {
    fireEvent,
    render,
    screen,
    waitFor,
    within,
} from "@testing-library/react";
import AdminStudiesPage from "@/app/admin/kajian/page";
import { adminKajianApi } from "@/lib/api";

jest.mock("@/lib/api", () => ({
    adminKajianApi: {
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
    {
        id: 1,
        title: "Zikir Pagi dan Petang",
        speaker: "Ustadz A",
        topic: "akhlak",
        type: "video",
    },
    {
        id: 2,
        title: "Fiqih Muamalah",
        speaker: "Ustadz B",
        topic: "fiqh",
        type: "audio",
    },
    {
        id: 3,
        title: "Adab Menuntut Ilmu",
        speaker: "Ustadz C",
        topic: "akhlak",
        type: "text",
    },
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

describe("Admin Kajian page — filter and sort", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        adminKajianApi.list.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ items: ITEMS }),
        });
    });

    test("category filter narrows the list to a single topic", async () => {
        render(<AdminStudiesPage />);
        await waitFor(() => {
            expect(screen.getByRole("table")).toBeInTheDocument();
        });
        expect(tableTitles()).toEqual([
            "Zikir Pagi dan Petang",
            "Fiqih Muamalah",
            "Adab Menuntut Ilmu",
        ]);

        const select = screen.getByRole("combobox", {
            name: "admin.field.category",
        });
        fireEvent.change(select, { target: { value: "fiqh" } });

        expect(tableTitles()).toEqual(["Fiqih Muamalah"]);
    });

    test("clicking the Title header sorts the list alphabetically, then reverses", async () => {
        render(<AdminStudiesPage />);
        await waitFor(() => {
            expect(screen.getByRole("table")).toBeInTheDocument();
        });

        const titleHeader = within(screen.getByRole("table")).getByRole(
            "button",
            { name: /admin\.field\.title/ },
        );

        fireEvent.click(titleHeader);
        expect(tableTitles()).toEqual([
            "Adab Menuntut Ilmu",
            "Fiqih Muamalah",
            "Zikir Pagi dan Petang",
        ]);

        fireEvent.click(titleHeader);
        expect(tableTitles()).toEqual([
            "Zikir Pagi dan Petang",
            "Fiqih Muamalah",
            "Adab Menuntut Ilmu",
        ]);
    });
});
