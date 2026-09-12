import {
    fireEvent,
    render,
    screen,
    waitFor,
    within,
} from "@testing-library/react";
import AdminHistoryPage from "@/app/admin/sejarah/page";
import { adminSejarahApi } from "@/lib/api";

jest.mock("@/lib/api", () => ({
    adminSejarahApi: {
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
        title: "Perang Badar",
        category: "perang",
        year_hijri: 2,
    },
    {
        id: 2,
        title: "Fathu Makkah",
        category: "peristiwa",
        year_hijri: 8,
    },
    {
        id: 3,
        title: "Awal Kekhalifahan Abu Bakar",
        category: "khulafa",
        year_hijri: 11,
    },
];

const tableTitles = () =>
    within(screen.getByRole("table"))
        .getAllByRole("row")
        .slice(1)
        .map((row) => within(row).getAllByRole("cell")[1].textContent);

// The "Kategori" sortable column header is also a <button> whose accessible
// name contains "admin.field.category", same as the filter toggle's
// aria-label — disambiguate by picking the one that isn't inside the table.
const openCategoryFilter = () => {
    const matches = screen.getAllByRole("button", {
        name: /admin\.field\.category/,
    });
    fireEvent.click(matches.find((el) => !el.closest("table")));
};

describe("Admin Sejarah page — filter and sort", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        adminSejarahApi.list.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ items: ITEMS }),
        });
    });

    test("checking one category narrows the list to that category", async () => {
        render(<AdminHistoryPage />);
        await waitFor(() => {
            expect(screen.getByRole("table")).toBeInTheDocument();
        });
        expect(tableTitles()).toEqual([
            "Perang Badar",
            "Fathu Makkah",
            "Awal Kekhalifahan Abu Bakar",
        ]);

        openCategoryFilter();
        fireEvent.click(screen.getByRole("checkbox", { name: "khulafa" }));

        expect(tableTitles()).toEqual(["Awal Kekhalifahan Abu Bakar"]);
    });

    test("checking two categories matches either (OR)", async () => {
        render(<AdminHistoryPage />);
        await waitFor(() => {
            expect(screen.getByRole("table")).toBeInTheDocument();
        });

        openCategoryFilter();
        fireEvent.click(screen.getByRole("checkbox", { name: "khulafa" }));
        fireEvent.click(screen.getByRole("checkbox", { name: "perang" }));

        expect(tableTitles()).toEqual([
            "Perang Badar",
            "Awal Kekhalifahan Abu Bakar",
        ]);
    });

    test("clicking the Event header sorts the list alphabetically, then reverses", async () => {
        render(<AdminHistoryPage />);
        await waitFor(() => {
            expect(screen.getByRole("table")).toBeInTheDocument();
        });

        const titleHeader = within(screen.getByRole("table")).getByRole(
            "button",
            { name: /admin\.history\.event/ },
        );

        fireEvent.click(titleHeader);
        expect(tableTitles()).toEqual([
            "Awal Kekhalifahan Abu Bakar",
            "Fathu Makkah",
            "Perang Badar",
        ]);

        fireEvent.click(titleHeader);
        expect(tableTitles()).toEqual([
            "Perang Badar",
            "Fathu Makkah",
            "Awal Kekhalifahan Abu Bakar",
        ]);
    });
});
