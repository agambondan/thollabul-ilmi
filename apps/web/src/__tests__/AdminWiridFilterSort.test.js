import {
    fireEvent,
    render,
    screen,
    waitFor,
    within,
} from "@testing-library/react";
import AdminWirdPage from "@/app/admin/wirid/page";
import { adminWiridApi } from "@/lib/api";

jest.mock("@/lib/api", () => ({
    adminWiridApi: {
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
        title: "Wirid Setelah Sholat",
        category: "setelah_sholat",
        count: 33,
    },
    {
        id: 2,
        title: "Wirid Pagi",
        category: "pagi",
        count: 100,
    },
    {
        id: 3,
        title: "Awal Wirid Tidur",
        category: "tidur",
        count: 3,
    },
];

const tableTitles = () =>
    within(screen.getByRole("table"))
        .getAllByRole("row")
        .slice(1)
        .map((row) => within(row).getAllByRole("cell")[0].textContent);

describe("Admin Wirid page — filter and sort", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        adminWiridApi.list.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ items: ITEMS }),
        });
    });

    test("category filter narrows the list to a single category", async () => {
        render(<AdminWirdPage />);
        await waitFor(() => {
            expect(screen.getByRole("table")).toBeInTheDocument();
        });
        expect(tableTitles()).toEqual([
            "Wirid Setelah Sholat",
            "Wirid Pagi",
            "Awal Wirid Tidur",
        ]);

        const select = screen.getByRole("combobox", {
            name: "admin.field.category",
        });
        fireEvent.change(select, { target: { value: "pagi" } });

        expect(tableTitles()).toEqual(["Wirid Pagi"]);
    });

    test("clicking the Title header sorts the list alphabetically, then reverses", async () => {
        render(<AdminWirdPage />);
        await waitFor(() => {
            expect(screen.getByRole("table")).toBeInTheDocument();
        });

        const titleHeader = within(screen.getByRole("table")).getByRole(
            "button",
            { name: /admin\.field\.title/ },
        );

        fireEvent.click(titleHeader);
        expect(tableTitles()).toEqual([
            "Awal Wirid Tidur",
            "Wirid Pagi",
            "Wirid Setelah Sholat",
        ]);

        fireEvent.click(titleHeader);
        expect(tableTitles()).toEqual([
            "Wirid Setelah Sholat",
            "Wirid Pagi",
            "Awal Wirid Tidur",
        ]);
    });
});
