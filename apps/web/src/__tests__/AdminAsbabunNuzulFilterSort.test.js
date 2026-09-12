import {
    fireEvent,
    render,
    screen,
    waitFor,
    within,
} from "@testing-library/react";
import AdminAsbabunNuzulPage from "@/app/admin/asbabun-nuzul/page";
import { adminAsbabunNuzulApi } from "@/lib/api";

jest.mock("@/lib/api", () => ({
    adminAsbabunNuzulApi: {
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
        surah_number: 2,
        ayah_number: 255,
        title: "Ayat Kursi",
        content: "",
    },
    {
        id: 2,
        surah_number: 112,
        ayah_number: 1,
        title: "Al-Ikhlas",
        content: "",
    },
    {
        id: 3,
        surah_number: 1,
        ayah_number: 1,
        title: "Al-Fatihah",
        content: "",
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
        .map((row) => within(row).getAllByRole("cell")[2].textContent);

describe("Admin Asbabun Nuzul page — sort", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        adminAsbabunNuzulApi.list.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ items: ITEMS }),
        });
    });

    test("items load pre-sorted by surah number, then ayah number", async () => {
        render(<AdminAsbabunNuzulPage />);
        await waitFor(() => {
            expect(screen.getByRole("table")).toBeInTheDocument();
        });

        expect(tableTitles()).toEqual([
            "Al-Fatihah",
            "Ayat Kursi",
            "Al-Ikhlas",
        ]);
    });

    test("clicking the Surah header reverses the surah-number order", async () => {
        render(<AdminAsbabunNuzulPage />);
        await waitFor(() => {
            expect(screen.getByRole("table")).toBeInTheDocument();
        });

        const surahHeader = within(screen.getByRole("table")).getByRole(
            "button",
            { name: /Surah/ },
        );

        fireEvent.click(surahHeader);
        expect(tableTitles()).toEqual([
            "Al-Fatihah",
            "Ayat Kursi",
            "Al-Ikhlas",
        ]);

        fireEvent.click(surahHeader);
        expect(tableTitles()).toEqual([
            "Al-Ikhlas",
            "Ayat Kursi",
            "Al-Fatihah",
        ]);
    });

    test("clicking the Title header sorts the list alphabetically", async () => {
        render(<AdminAsbabunNuzulPage />);
        await waitFor(() => {
            expect(screen.getByRole("table")).toBeInTheDocument();
        });

        const titleHeader = within(screen.getByRole("table")).getByRole(
            "button",
            { name: /admin\.field\.title/ },
        );

        fireEvent.click(titleHeader);
        expect(tableTitles()).toEqual([
            "Al-Fatihah",
            "Al-Ikhlas",
            "Ayat Kursi",
        ]);
    });
});
