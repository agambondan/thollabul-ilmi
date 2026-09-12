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

describe("Admin Amalan page — filter and sort", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        adminAmalanApi.list.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ items: ITEMS }),
        });
    });

    test("category filter narrows the list to a single category", async () => {
        render(<AdminAmalanPage />);
        await waitFor(() => {
            expect(screen.getByRole("table")).toBeInTheDocument();
        });
        expect(tableNames()).toEqual([
            "Sholat Dhuha",
            "Sedekah Subuh",
            "Puasa Senin Kamis",
        ]);

        const select = screen.getByRole("combobox", { name: "Kategori" });
        fireEvent.change(select, { target: { value: "sedekah" } });

        expect(tableNames()).toEqual(["Sedekah Subuh"]);
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
