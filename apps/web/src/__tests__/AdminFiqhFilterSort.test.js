import {
    fireEvent,
    render,
    screen,
    waitFor,
    within,
} from "@testing-library/react";
import AdminFiqhPage from "@/app/admin/fiqh/page";
import { adminFiqhApi } from "@/lib/api";

jest.mock("@/lib/api", () => ({
    adminFiqhApi: {
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
        title: "Tata Cara Wudhu",
        category: "thaharah",
        content: "",
        source: "",
    },
    {
        id: 2,
        title: "Zakat Fitrah",
        category: "zakat",
        content: "",
        source: "",
    },
    {
        id: 3,
        title: "Rukun Sholat",
        category: "sholat",
        content: "",
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

describe("Admin Fiqh page — filter and sort", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        adminFiqhApi.list.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ items: ITEMS }),
        });
    });

    test("checking one category narrows the list to that category", async () => {
        render(<AdminFiqhPage />);
        await waitFor(() => {
            expect(screen.getByRole("table")).toBeInTheDocument();
        });
        expect(tableTitles()).toEqual([
            "Tata Cara Wudhu",
            "Zakat Fitrah",
            "Rukun Sholat",
        ]);

        openCategoryFilter();
        fireEvent.click(screen.getByRole("checkbox", { name: "zakat" }));

        expect(tableTitles()).toEqual(["Zakat Fitrah"]);
    });

    test("checking two categories matches either (OR)", async () => {
        render(<AdminFiqhPage />);
        await waitFor(() => {
            expect(screen.getByRole("table")).toBeInTheDocument();
        });

        openCategoryFilter();
        fireEvent.click(screen.getByRole("checkbox", { name: "zakat" }));
        fireEvent.click(screen.getByRole("checkbox", { name: "sholat" }));

        expect(tableTitles()).toEqual(["Zakat Fitrah", "Rukun Sholat"]);
    });

    test("clicking the Title header sorts the list alphabetically, then reverses", async () => {
        render(<AdminFiqhPage />);
        await waitFor(() => {
            expect(screen.getByRole("table")).toBeInTheDocument();
        });

        const titleHeader = within(screen.getByRole("table")).getByRole(
            "button",
            { name: /admin\.field\.title/ },
        );

        fireEvent.click(titleHeader);
        expect(tableTitles()).toEqual([
            "Rukun Sholat",
            "Tata Cara Wudhu",
            "Zakat Fitrah",
        ]);

        fireEvent.click(titleHeader);
        expect(tableTitles()).toEqual([
            "Zakat Fitrah",
            "Tata Cara Wudhu",
            "Rukun Sholat",
        ]);
    });
});
