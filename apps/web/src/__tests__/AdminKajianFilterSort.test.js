import {
    fireEvent,
    render,
    screen,
    waitFor,
    within,
} from "@testing-library/react";
import AdminStudiesPage from "@/app/admin/kajian/page";
import { adminKajianApi } from "@/lib/api";

jest.mock("@/lib/api", () => ({
    adminKajianApi: {
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

// Real `topic` values are comma-joined multi-phrase blurbs scraped per
// channel (e.g. "Fikih muamalah dasar, Adab islami harian"), not a clean
// single category — the filter must match by substring against each
// comma-segment, not by exact string equality.
const ITEMS = [
    {
        id: 1,
        title: "Zikir Pagi dan Petang",
        speaker: "Ustadz A",
        topic: "Adab islami harian, Akhlak keseharian",
        type: "video",
    },
    {
        id: 2,
        title: "Fiqih Muamalah",
        speaker: "Ustadz B",
        topic: "Fikih muamalah dasar, Fatwa kontemporer",
        type: "audio",
    },
    {
        id: 3,
        title: "Adab Menuntut Ilmu",
        speaker: "Ustadz C",
        topic: "Adab islami harian, Fatwa kontemporer",
        type: "text",
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
        .map((row) => within(row).getAllByRole("cell")[1].textContent);

// The "Kategori" sortable column header is also a <button> whose accessible
// name contains "admin.field.category", same as the filter toggle's
// aria-label — disambiguate by picking the one that isn't inside the table.
const openTopicFilter = () => {
    const matches = screen.getAllByRole("button", {
        name: /admin\.field\.category/,
    });
    fireEvent.click(matches.find((el) => !el.closest("table")));
};

describe("Admin Kajian page — filter and sort", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        adminKajianApi.list.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ items: ITEMS }),
        });
    });

    test("checking one topic segment narrows the list by substring match", async () => {
        render(<AdminStudiesPage />);
        await waitFor(() => {
            expect(screen.getByRole("table")).toBeInTheDocument();
        });
        expect(tableTitles()).toEqual([
            "Zikir Pagi dan Petang",
            "Fiqih Muamalah",
            "Adab Menuntut Ilmu",
        ]);

        openTopicFilter();
        fireEvent.click(
            screen.getByRole("checkbox", { name: "Fikih muamalah dasar" }),
        );

        expect(tableTitles()).toEqual(["Fiqih Muamalah"]);
    });

    test("checking two segments matches either (OR), unchecking clears the filter", async () => {
        render(<AdminStudiesPage />);
        await waitFor(() => {
            expect(screen.getByRole("table")).toBeInTheDocument();
        });

        openTopicFilter();
        fireEvent.click(
            screen.getByRole("checkbox", { name: "Adab islami harian" }),
        );
        fireEvent.click(
            screen.getByRole("checkbox", { name: "Fikih muamalah dasar" }),
        );
        expect(tableTitles()).toEqual([
            "Zikir Pagi dan Petang",
            "Fiqih Muamalah",
            "Adab Menuntut Ilmu",
        ]);

        fireEvent.click(
            screen.getByRole("checkbox", { name: "Adab islami harian" }),
        );
        expect(tableTitles()).toEqual(["Fiqih Muamalah"]);

        fireEvent.click(
            screen.getByRole("checkbox", { name: "Fikih muamalah dasar" }),
        );
        expect(tableTitles()).toEqual([
            "Zikir Pagi dan Petang",
            "Fiqih Muamalah",
            "Adab Menuntut Ilmu",
        ]);
    });

    test("clicking the Title header sorts the list alphabetically, then reverses", async () => {
        render(<AdminStudiesPage />);
        await waitFor(() => {
            expect(screen.getByRole("table")).toBeInTheDocument();
        });

        const titleHeader = within(screen.getByRole("table")).getByRole(
            "button",
            { name: /admin\.field\.title/ },
        );

        fireEvent.click(titleHeader);
        expect(tableTitles()).toEqual([
            "Adab Menuntut Ilmu",
            "Fiqih Muamalah",
            "Zikir Pagi dan Petang",
        ]);

        fireEvent.click(titleHeader);
        expect(tableTitles()).toEqual([
            "Zikir Pagi dan Petang",
            "Fiqih Muamalah",
            "Adab Menuntut Ilmu",
        ]);
    });
});
