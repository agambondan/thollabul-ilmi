import {
    fireEvent,
    render,
    screen,
    waitFor,
    within,
} from "@testing-library/react";
import AdminAmalanPage from "@/app/admin/amalan/page";
import { adminAmalanApi } from "@/lib/api";

jest.mock("@/lib/api", () => ({
    adminAmalanApi: {
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
        name: "Sholat Dhuha",
        category: "sholat",
        description: "",
        source: "",
    },
    {
        id: 2,
        name: "Sedekah Subuh",
        category: "sedekah",
        description: "",
        source: "",
    },
    {
        id: 3,
        name: "Puasa Senin Kamis",
        category: "puasa",
        description: "",
        source: "",
    },
];

// The page renders both a mobile card list and a desktop table unconditionally
// (visibility is CSS-only, via `md:hidden` / `hidden md:block`), so jsdom sees
// both at once. Scope every query to the desktop `<table>` to avoid duplicate
// matches from the mobile card view.
const tableNames = () =>
    within(screen.getByRole("table"))
        .getAllByRole("row")
        .slice(1) // skip the header row
        .map((row) => within(row).getAllByRole("cell")[0].textContent);

// The "Kategori" sortable column header is also a <button> whose accessible
// name contains "Kategori", same as the filter toggle's aria-label —
// disambiguate by picking the one that isn't inside the table.
const openCategoryFilter = () => {
    const matches = screen.getAllByRole("button", { name: /Kategori/ });
    fireEvent.click(matches.find((el) => !el.closest("table")));
};

describe("Admin Amalan page — filter and sort", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        adminAmalanApi.list.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ items: ITEMS }),
        });
    });

    test("checking one category narrows the list to that category", async () => {
        render(<AdminAmalanPage />);
        await waitFor(() => {
            expect(screen.getByRole("table")).toBeInTheDocument();
        });
        expect(tableNames()).toEqual([
            "Sholat Dhuha",
            "Sedekah Subuh",
            "Puasa Senin Kamis",
        ]);

        openCategoryFilter();
        fireEvent.click(
            screen.getByRole("checkbox", { name: "Sedekah & Infaq" }),
        );

        expect(tableNames()).toEqual(["Sedekah Subuh"]);
    });

    test("checking two categories matches either (OR)", async () => {
        render(<AdminAmalanPage />);
        await waitFor(() => {
            expect(screen.getByRole("table")).toBeInTheDocument();
        });

        openCategoryFilter();
        fireEvent.click(
            screen.getByRole("checkbox", { name: "Sedekah & Infaq" }),
        );
        fireEvent.click(screen.getByRole("checkbox", { name: "Puasa Sunnah" }));

        expect(tableNames()).toEqual(["Sedekah Subuh", "Puasa Senin Kamis"]);
    });

    test("clicking the Nama Amalan header sorts the list alphabetically, then reverses", async () => {
        render(<AdminAmalanPage />);
        await waitFor(() => {
            expect(screen.getByRole("table")).toBeInTheDocument();
        });

        const nameHeader = within(screen.getByRole("table")).getByRole(
            "button",
            { name: /Nama Amalan/ },
        );

        fireEvent.click(nameHeader);
        expect(tableNames()).toEqual([
            "Puasa Senin Kamis",
            "Sedekah Subuh",
            "Sholat Dhuha",
        ]);

        fireEvent.click(nameHeader);
        expect(tableNames()).toEqual([
            "Sholat Dhuha",
            "Sedekah Subuh",
            "Puasa Senin Kamis",
        ]);
    });
});
