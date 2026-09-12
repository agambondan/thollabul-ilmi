import {
    fireEvent,
    render,
    screen,
    waitFor,
    within,
} from "@testing-library/react";
import AdminPrayersPage from "@/app/admin/doa/page";
import { adminDoaApi } from "@/lib/api";

jest.mock("@/lib/api", () => ({
    adminDoaApi: {
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
        title: "Zikir Bangun Tidur",
        category: "bangun",
        arabic: "",
        source: "",
    },
    {
        id: 2,
        title: "Doa Masuk Masjid",
        category: "masjid",
        arabic: "",
        source: "",
    },
    {
        id: 3,
        title: "Awal Makan",
        category: "makan",
        arabic: "",
        source: "",
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
        .map((row) => within(row).getAllByRole("cell")[0].textContent);

// The "Kategori" sortable column header is also a <button> whose accessible
// name contains "admin.field.category", same as the filter toggle's
// aria-label — disambiguate by picking the one that isn't inside the table.
const openCategoryFilter = () => {
    const matches = screen.getAllByRole("button", {
        name: /admin\.field\.category/,
    });
    fireEvent.click(matches.find((el) => !el.closest("table")));
};

describe("Admin Doa page — filter and sort", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        adminDoaApi.list.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ items: ITEMS }),
        });
    });

    test("checking one category narrows the list to that category", async () => {
        render(<AdminPrayersPage />);
        await waitFor(() => {
            expect(screen.getByRole("table")).toBeInTheDocument();
        });
        expect(tableTitles()).toEqual([
            "Zikir Bangun Tidur",
            "Doa Masuk Masjid",
            "Awal Makan",
        ]);

        openCategoryFilter();
        fireEvent.click(screen.getByRole("checkbox", { name: "masjid" }));

        expect(tableTitles()).toEqual(["Doa Masuk Masjid"]);
    });

    test("checking two categories matches either (OR)", async () => {
        render(<AdminPrayersPage />);
        await waitFor(() => {
            expect(screen.getByRole("table")).toBeInTheDocument();
        });

        openCategoryFilter();
        fireEvent.click(screen.getByRole("checkbox", { name: "masjid" }));
        fireEvent.click(screen.getByRole("checkbox", { name: "makan" }));

        expect(tableTitles()).toEqual(["Doa Masuk Masjid", "Awal Makan"]);
    });

    test("clicking the Title header sorts the list alphabetically, then reverses", async () => {
        render(<AdminPrayersPage />);
        await waitFor(() => {
            expect(screen.getByRole("table")).toBeInTheDocument();
        });

        const titleHeader = within(screen.getByRole("table")).getByRole(
            "button",
            { name: /admin\.field\.title/ },
        );

        fireEvent.click(titleHeader);
        expect(tableTitles()).toEqual([
            "Awal Makan",
            "Doa Masuk Masjid",
            "Zikir Bangun Tidur",
        ]);

        fireEvent.click(titleHeader);
        expect(tableTitles()).toEqual([
            "Zikir Bangun Tidur",
            "Doa Masuk Masjid",
            "Awal Makan",
        ]);
    });
});
