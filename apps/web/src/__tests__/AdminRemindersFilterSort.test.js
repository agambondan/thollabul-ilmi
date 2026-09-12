import {
    fireEvent,
    render,
    screen,
    waitFor,
    within,
} from "@testing-library/react";
import AdminRemindersPage from "@/app/admin/reminders/page";
import { adminReminderApi } from "@/lib/api";

jest.mock("@/lib/api", () => ({
    adminReminderApi: {
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
        title: "Sabar Itu Indah",
        text: "...",
        type: "ulama",
        is_active: true,
    },
    {
        id: 2,
        title: "Jangan Menunda",
        text: "...",
        type: "quote",
        is_active: true,
    },
    {
        id: 3,
        title: "Ingat Kematian",
        text: "...",
        type: "advice",
        is_active: false,
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
        .map(
            (row) =>
                within(row).getAllByRole("cell")[0].querySelector("p")
                    .textContent,
        );

// The "Tipe" sortable column header is also a <button> whose accessible
// name contains "Tipe", same as the filter toggle's aria-label —
// disambiguate by picking the one that isn't inside the table.
const openTypeFilter = () => {
    const matches = screen.getAllByRole("button", { name: /Tipe/ });
    fireEvent.click(matches.find((el) => !el.closest("table")));
};

describe("Admin Reminders page — filter and sort", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        adminReminderApi.list.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ items: ITEMS }),
        });
    });

    test("checking one type narrows the list to that type", async () => {
        render(<AdminRemindersPage />);
        await waitFor(() => {
            expect(screen.getByRole("table")).toBeInTheDocument();
        });
        expect(tableTitles()).toEqual([
            "Sabar Itu Indah",
            "Jangan Menunda",
            "Ingat Kematian",
        ]);

        openTypeFilter();
        fireEvent.click(screen.getByRole("checkbox", { name: "Quote" }));

        expect(tableTitles()).toEqual(["Jangan Menunda"]);
    });

    test("checking two types matches either (OR)", async () => {
        render(<AdminRemindersPage />);
        await waitFor(() => {
            expect(screen.getByRole("table")).toBeInTheDocument();
        });

        openTypeFilter();
        fireEvent.click(screen.getByRole("checkbox", { name: "Quote" }));
        fireEvent.click(screen.getByRole("checkbox", { name: "Pengingat" }));

        expect(tableTitles()).toEqual(["Jangan Menunda", "Ingat Kematian"]);
    });

    test("clicking the Judul header sorts the list alphabetically, then reverses", async () => {
        render(<AdminRemindersPage />);
        await waitFor(() => {
            expect(screen.getByRole("table")).toBeInTheDocument();
        });

        const titleHeader = within(screen.getByRole("table")).getByRole(
            "button",
            { name: /Judul/ },
        );

        fireEvent.click(titleHeader);
        expect(tableTitles()).toEqual([
            "Ingat Kematian",
            "Jangan Menunda",
            "Sabar Itu Indah",
        ]);

        fireEvent.click(titleHeader);
        expect(tableTitles()).toEqual([
            "Sabar Itu Indah",
            "Jangan Menunda",
            "Ingat Kematian",
        ]);
    });
});
