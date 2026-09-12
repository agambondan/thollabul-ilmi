import {
    fireEvent,
    render,
    screen,
    waitFor,
    within,
} from "@testing-library/react";
import AdminDhikrPage from "@/app/admin/dzikir/page";
import { adminDzikirApi } from "@/lib/api";

jest.mock("@/lib/api", () => ({
    adminDzikirApi: {
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
        title: "Dzikir Bangun Tidur",
        category: "sebelum-tidur",
        count: 3,
        arabic: "",
    },
    {
        id: 2,
        title: "Dzikir Pagi Hari",
        category: "pagi",
        count: 10,
        arabic: "",
    },
    {
        id: 3,
        title: "Awal Dzikir Petang",
        category: "petang",
        count: 7,
        arabic: "",
    },
];

const tableTitles = () =>
    within(screen.getByRole("table"))
        .getAllByRole("row")
        .slice(1)
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

describe("Admin Dzikir page — filter and sort", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        adminDzikirApi.list.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ items: ITEMS }),
        });
    });

    test("checking one category narrows the list to that category", async () => {
        render(<AdminDhikrPage />);
        await waitFor(() => {
            expect(screen.getByRole("table")).toBeInTheDocument();
        });
        expect(tableTitles()).toEqual([
            "Dzikir Bangun Tidur",
            "Dzikir Pagi Hari",
            "Awal Dzikir Petang",
        ]);

        openCategoryFilter();
        fireEvent.click(screen.getByRole("checkbox", { name: "pagi" }));

        expect(tableTitles()).toEqual(["Dzikir Pagi Hari"]);
    });

    test("checking two categories matches either (OR)", async () => {
        render(<AdminDhikrPage />);
        await waitFor(() => {
            expect(screen.getByRole("table")).toBeInTheDocument();
        });

        openCategoryFilter();
        fireEvent.click(screen.getByRole("checkbox", { name: "pagi" }));
        fireEvent.click(
            screen.getByRole("checkbox", { name: "sebelum-tidur" }),
        );

        expect(tableTitles()).toEqual([
            "Dzikir Bangun Tidur",
            "Dzikir Pagi Hari",
        ]);
    });

    test("clicking the Title header sorts the list alphabetically, then reverses", async () => {
        render(<AdminDhikrPage />);
        await waitFor(() => {
            expect(screen.getByRole("table")).toBeInTheDocument();
        });

        const titleHeader = within(screen.getByRole("table")).getByRole(
            "button",
            { name: /admin\.field\.title/ },
        );

        fireEvent.click(titleHeader);
        expect(tableTitles()).toEqual([
            "Awal Dzikir Petang",
            "Dzikir Bangun Tidur",
            "Dzikir Pagi Hari",
        ]);

        fireEvent.click(titleHeader);
        expect(tableTitles()).toEqual([
            "Dzikir Pagi Hari",
            "Dzikir Bangun Tidur",
            "Awal Dzikir Petang",
        ]);
    });
});
