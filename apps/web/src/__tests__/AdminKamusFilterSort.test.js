import {
    fireEvent,
    render,
    screen,
    waitFor,
    within,
} from "@testing-library/react";
import AdminDictionaryPage from "@/app/admin/kamus/page";
import { adminKamusApi } from "@/lib/api";

jest.mock("@/lib/api", () => ({
    adminKamusApi: {
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
        term: "Tawakkal",
        category: "aqidah",
        definition: "Berserah diri kepada Allah",
    },
    {
        id: 2,
        term: "Ijma",
        category: "fiqh",
        definition: "Kesepakatan para ulama",
    },
    {
        id: 3,
        term: "Asbabun Nuzul",
        category: "ulumul_quran",
        definition: "Sebab turunnya ayat",
    },
];

const tableTerms = () =>
    within(screen.getByRole("table"))
        .getAllByRole("row")
        .slice(1)
        .map((row) => within(row).getAllByRole("cell")[0].textContent);

describe("Admin Kamus page — filter and sort", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        adminKamusApi.list.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ items: ITEMS }),
        });
    });

    test("category filter narrows the list to a single category", async () => {
        render(<AdminDictionaryPage />);
        await waitFor(() => {
            expect(screen.getByRole("table")).toBeInTheDocument();
        });
        expect(tableTerms()).toEqual(["Tawakkal", "Ijma", "Asbabun Nuzul"]);

        const select = screen.getByRole("combobox", {
            name: "admin.field.category",
        });
        fireEvent.change(select, { target: { value: "fiqh" } });

        expect(tableTerms()).toEqual(["Ijma"]);
    });

    test("clicking the Istilah header sorts the list alphabetically, then reverses", async () => {
        render(<AdminDictionaryPage />);
        await waitFor(() => {
            expect(screen.getByRole("table")).toBeInTheDocument();
        });

        const termHeader = within(screen.getByRole("table")).getByRole(
            "button",
            { name: /Istilah/ },
        );

        fireEvent.click(termHeader);
        expect(tableTerms()).toEqual(["Asbabun Nuzul", "Ijma", "Tawakkal"]);

        fireEvent.click(termHeader);
        expect(tableTerms()).toEqual(["Tawakkal", "Ijma", "Asbabun Nuzul"]);
    });
});
