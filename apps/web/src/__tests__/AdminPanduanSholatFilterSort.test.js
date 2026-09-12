import {
    fireEvent,
    render,
    screen,
    waitFor,
    within,
} from "@testing-library/react";
import AdminPanduanSholatPage from "@/app/admin/panduan-sholat/page";
import { adminPanduanSholatApi } from "@/lib/api";

jest.mock("@/lib/api", () => ({
    adminPanduanSholatApi: {
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
    { id: 1, step: 1, title: "Niat" },
    { id: 2, step: 2, title: "Takbiratul Ihram" },
    { id: 3, step: 3, title: "Bacaan Iftitah" },
];

const tableRows = () =>
    within(screen.getByRole("table")).getAllByRole("row").slice(1);

const tableSteps = () =>
    tableRows().map((row) => within(row).getAllByRole("cell")[0].textContent);

const tableTitles = () =>
    tableRows().map((row) => within(row).getAllByRole("cell")[1].textContent);

describe("Admin Panduan Sholat page — sort", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        adminPanduanSholatApi.list.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ items: ITEMS }),
        });
    });

    test("clicking the Judul header sorts the list alphabetically, then reverses", async () => {
        render(<AdminPanduanSholatPage />);
        await waitFor(() => {
            expect(screen.getByRole("table")).toBeInTheDocument();
        });
        expect(tableTitles()).toEqual([
            "Niat",
            "Takbiratul Ihram",
            "Bacaan Iftitah",
        ]);

        const titleHeader = within(screen.getByRole("table")).getByRole(
            "button",
            { name: /Judul/ },
        );

        fireEvent.click(titleHeader);
        expect(tableTitles()).toEqual([
            "Bacaan Iftitah",
            "Niat",
            "Takbiratul Ihram",
        ]);

        fireEvent.click(titleHeader);
        expect(tableTitles()).toEqual([
            "Takbiratul Ihram",
            "Niat",
            "Bacaan Iftitah",
        ]);
    });

    test("clicking the Step header sorts numerically, then reverses", async () => {
        render(<AdminPanduanSholatPage />);
        await waitFor(() => {
            expect(screen.getByRole("table")).toBeInTheDocument();
        });

        const stepHeader = within(screen.getByRole("table")).getByRole(
            "button",
            { name: /Step/ },
        );

        fireEvent.click(stepHeader);
        expect(tableSteps()).toEqual(["#1", "#2", "#3"]);

        fireEvent.click(stepHeader);
        expect(tableSteps()).toEqual(["#3", "#2", "#1"]);
    });
});
