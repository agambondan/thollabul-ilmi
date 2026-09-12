import {
    fireEvent,
    render,
    screen,
    waitFor,
    within,
} from "@testing-library/react";
import AdminLibraryPage from "@/app/admin/library/page";
import { adminLibraryApi } from "@/lib/api";

jest.mock("@/lib/api", () => ({
    adminLibraryApi: {
        list: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        clearResource: jest.fn(),
        clearCover: jest.fn(),
    },
    uploadWithProgress: jest.fn(),
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
        title: "Riyadhus Shalihin",
        slug: "riyadhus-shalihin",
        author: "Imam Nawawi",
        category: "Hadith",
        format: "pdf",
        status: "published",
        license_status: "verified",
    },
    {
        id: 2,
        title: "Al Wajiz",
        slug: "al-wajiz",
        author: "Syaikh Abdul Azhim",
        category: "Fiqh",
        format: "epub",
        status: "draft",
        license_status: "unverified",
    },
    {
        id: 3,
        title: "Bulughul Maram",
        slug: "bulughul-maram",
        author: "Ibnu Hajar",
        category: "Hadith",
        format: "link",
        status: "published",
        license_status: "verified",
    },
];

// The page renders both a mobile card list and a desktop table unconditionally
// (visibility is CSS-only, via `md:hidden` / `hidden md:block`), so jsdom sees
// both at once. Scope every query to the desktop `<table>` to avoid duplicate
// matches from the mobile card view.
const tableTitles = () =>
    within(screen.getByRole("table"))
        .getAllByRole("row")
        .slice(1)
        .map((row) => within(row).getAllByRole("cell")[0].textContent);

describe("Admin Library page — filter and sort", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        adminLibraryApi.list.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ items: ITEMS }),
        });
    });

    test("category filter narrows the list to a single category", async () => {
        render(<AdminLibraryPage />);
        await waitFor(() => {
            expect(screen.getByRole("table")).toBeInTheDocument();
        });
        expect(tableTitles()).toEqual([
            "Riyadhus Shalihinriyadhus-shalihin",
            "Al Wajizal-wajiz",
            "Bulughul Marambulughul-maram",
        ]);

        const select = screen.getByRole("combobox", {
            name: "admin.field.category",
        });
        fireEvent.change(select, { target: { value: "Fiqh" } });

        expect(tableTitles()).toEqual(["Al Wajizal-wajiz"]);
    });

    test("status filter narrows the list to a single status", async () => {
        render(<AdminLibraryPage />);
        await waitFor(() => {
            expect(screen.getByRole("table")).toBeInTheDocument();
        });

        const select = screen.getByRole("combobox", {
            name: "admin.library.status",
        });
        fireEvent.change(select, { target: { value: "draft" } });

        expect(tableTitles()).toEqual(["Al Wajizal-wajiz"]);
    });

    test("clicking the Title header sorts the list alphabetically, then reverses", async () => {
        render(<AdminLibraryPage />);
        await waitFor(() => {
            expect(screen.getByRole("table")).toBeInTheDocument();
        });

        const titleHeader = within(screen.getByRole("table")).getByRole(
            "button",
            { name: /admin\.field\.title/ },
        );

        fireEvent.click(titleHeader);
        expect(tableTitles()).toEqual([
            "Al Wajizal-wajiz",
            "Bulughul Marambulughul-maram",
            "Riyadhus Shalihinriyadhus-shalihin",
        ]);

        fireEvent.click(titleHeader);
        expect(tableTitles()).toEqual([
            "Riyadhus Shalihinriyadhus-shalihin",
            "Bulughul Marambulughul-maram",
            "Al Wajizal-wajiz",
        ]);
    });
});
