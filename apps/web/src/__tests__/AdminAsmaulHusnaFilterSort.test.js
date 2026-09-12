import {
    fireEvent,
    render,
    screen,
    waitFor,
    within,
} from "@testing-library/react";
import AdminAsmaulHusnaPage from "@/app/admin/asmaul-husna/page";
import { adminAsmaulHusnaApi } from "@/lib/api";

jest.mock("@/lib/api", () => ({
    adminAsmaulHusnaApi: {
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
        number: 1,
        arabic: "الرحمن",
        transliteration: "Ar-Rahman",
        indonesian: "Yang Maha Pengasih",
    },
    {
        id: 2,
        number: 2,
        arabic: "الرحيم",
        transliteration: "Ar-Rahim",
        indonesian: "Yang Maha Penyayang",
    },
    {
        id: 3,
        number: 3,
        arabic: "الملك",
        transliteration: "Al-Malik",
        indonesian: "Yang Maha Merajai",
    },
];

const tableRows = () =>
    within(screen.getByRole("table")).getAllByRole("row").slice(1);

const tableNumbers = () =>
    tableRows().map((row) => within(row).getAllByRole("cell")[0].textContent);

const tableLatin = () =>
    tableRows().map((row) => within(row).getAllByRole("cell")[2].textContent);

describe("Admin Asmaul Husna page — sort", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        adminAsmaulHusnaApi.list.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ items: ITEMS }),
        });
    });

    test("clicking the Latin header sorts the list alphabetically, then reverses", async () => {
        render(<AdminAsmaulHusnaPage />);
        await waitFor(() => {
            expect(screen.getByRole("table")).toBeInTheDocument();
        });
        expect(tableLatin()).toEqual(["Ar-Rahman", "Ar-Rahim", "Al-Malik"]);

        const latinHeader = within(screen.getByRole("table")).getByRole(
            "button",
            { name: /admin\.field\.latin/ },
        );

        fireEvent.click(latinHeader);
        expect(tableLatin()).toEqual(["Al-Malik", "Ar-Rahim", "Ar-Rahman"]);

        fireEvent.click(latinHeader);
        expect(tableLatin()).toEqual(["Ar-Rahman", "Ar-Rahim", "Al-Malik"]);
    });

    test("clicking the Number header sorts numerically, then reverses", async () => {
        render(<AdminAsmaulHusnaPage />);
        await waitFor(() => {
            expect(screen.getByRole("table")).toBeInTheDocument();
        });

        const numberHeader = within(screen.getByRole("table")).getByRole(
            "button",
            { name: /admin\.field\.number/ },
        );

        fireEvent.click(numberHeader);
        expect(tableNumbers()).toEqual(["1", "2", "3"]);

        fireEvent.click(numberHeader);
        expect(tableNumbers()).toEqual(["3", "2", "1"]);
    });
});
