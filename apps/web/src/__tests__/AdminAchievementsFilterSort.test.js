import {
    fireEvent,
    render,
    screen,
    waitFor,
    within,
} from "@testing-library/react";
import AdminAchievementsPage from "@/app/admin/achievements/page";
import { adminAchievementApi } from "@/lib/api";

jest.mock("@/lib/api", () => ({
    adminAchievementApi: {
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
        code: "streak_7",
        name: "Pejuang Subuh",
        category: "streak",
        threshold: 7,
    },
    {
        id: 2,
        code: "hafalan_10",
        name: "Hafiz Pemula",
        category: "hafalan",
        threshold: 10,
    },
    {
        id: 3,
        code: "bookmark_5",
        name: "Kolektor Ayat",
        category: "bookmark",
        threshold: 5,
    },
];

// The page renders both a mobile card list and a desktop table unconditionally
// (visibility is CSS-only, via `md:hidden` / `hidden md:block`), so jsdom sees
// both at once. Scope every query to the desktop `<table>` to avoid duplicate
// matches from the mobile card view.
const tableNames = () =>
    within(screen.getByRole("table"))
        .getAllByRole("row")
        .slice(1)
        .map((row) => within(row).getAllByRole("cell")[2].textContent);

// The "Kategori" sortable column header is also a <button> whose accessible
// name contains "Kategori", same as the filter toggle's aria-label —
// disambiguate by picking the one that isn't inside the table.
const openCategoryFilter = () => {
    const matches = screen.getAllByRole("button", { name: /Kategori/ });
    fireEvent.click(matches.find((el) => !el.closest("table")));
};

describe("Admin Achievements page — filter and sort", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        adminAchievementApi.list.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ items: ITEMS }),
        });
    });

    test("checking one category narrows the list to that category", async () => {
        render(<AdminAchievementsPage />);
        await waitFor(() => {
            expect(screen.getByRole("table")).toBeInTheDocument();
        });
        expect(tableNames()).toEqual([
            "Pejuang Subuh",
            "Hafiz Pemula",
            "Kolektor Ayat",
        ]);

        openCategoryFilter();
        fireEvent.click(screen.getByRole("checkbox", { name: "Hafalan" }));

        expect(tableNames()).toEqual(["Hafiz Pemula"]);
    });

    test("checking two categories matches either (OR)", async () => {
        render(<AdminAchievementsPage />);
        await waitFor(() => {
            expect(screen.getByRole("table")).toBeInTheDocument();
        });

        openCategoryFilter();
        fireEvent.click(screen.getByRole("checkbox", { name: "Hafalan" }));
        fireEvent.click(screen.getByRole("checkbox", { name: "Bookmark" }));

        expect(tableNames()).toEqual(["Hafiz Pemula", "Kolektor Ayat"]);
    });

    test("clicking the Nama header sorts the list alphabetically, then reverses", async () => {
        render(<AdminAchievementsPage />);
        await waitFor(() => {
            expect(screen.getByRole("table")).toBeInTheDocument();
        });

        const nameHeader = within(screen.getByRole("table")).getByRole(
            "button",
            { name: /Nama/ },
        );

        fireEvent.click(nameHeader);
        expect(tableNames()).toEqual([
            "Hafiz Pemula",
            "Kolektor Ayat",
            "Pejuang Subuh",
        ]);

        fireEvent.click(nameHeader);
        expect(tableNames()).toEqual([
            "Pejuang Subuh",
            "Kolektor Ayat",
            "Hafiz Pemula",
        ]);
    });
});
