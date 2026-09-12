import {
    fireEvent,
    render,
    screen,
    waitFor,
    within,
} from "@testing-library/react";
import AdminQuizPage from "@/app/admin/quiz/page";
import { adminQuizApi } from "@/lib/api";

jest.mock("@/lib/api", () => ({
    adminQuizApi: {
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
        question: "Siapa nabi terakhir?",
        category: "sirah",
        options: ["a", "b", "c", "d"],
        answer: 0,
    },
    {
        id: 2,
        question: "Berapa rakaat sholat subuh?",
        category: "fiqh",
        options: ["a", "b", "c", "d"],
        answer: 0,
    },
    {
        id: 3,
        question: "Apa rukun iman?",
        category: "aqidah",
        options: ["a", "b", "c", "d"],
        answer: 0,
    },
];

// The page renders both a mobile card list and a desktop table unconditionally
// (visibility is CSS-only, via `md:hidden` / `hidden md:block`), so jsdom sees
// both at once. Scope every query to the desktop `<table>` to avoid duplicate
// matches from the mobile card view.
const tableQuestions = () =>
    within(screen.getByRole("table"))
        .getAllByRole("row")
        .slice(1) // skip the header row
        .map((row) => within(row).getAllByRole("cell")[0].textContent);

// The "Kategori" sortable column header is also a <button> whose accessible
// name contains "admin.field.category", same as the filter toggle's
// aria-label — disambiguate by picking the one that isn't inside the table.
const openCategoryFilter = () => {
    const matches = screen.getAllByRole("button", {
        name: /admin\.field\.category/,
    });
    fireEvent.click(matches.find((el) => !el.closest("table")));
};

describe("Admin Quiz page — filter and sort", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        adminQuizApi.list.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ items: ITEMS }),
        });
    });

    test("checking one category narrows the list to that category", async () => {
        render(<AdminQuizPage />);
        await waitFor(() => {
            expect(screen.getByRole("table")).toBeInTheDocument();
        });
        expect(tableQuestions()).toEqual([
            "Siapa nabi terakhir?",
            "Berapa rakaat sholat subuh?",
            "Apa rukun iman?",
        ]);

        openCategoryFilter();
        fireEvent.click(screen.getByRole("checkbox", { name: "fiqh" }));

        expect(tableQuestions()).toEqual(["Berapa rakaat sholat subuh?"]);
    });

    test("checking two categories matches either (OR)", async () => {
        render(<AdminQuizPage />);
        await waitFor(() => {
            expect(screen.getByRole("table")).toBeInTheDocument();
        });

        openCategoryFilter();
        fireEvent.click(screen.getByRole("checkbox", { name: "fiqh" }));
        fireEvent.click(screen.getByRole("checkbox", { name: "aqidah" }));

        expect(tableQuestions()).toEqual([
            "Berapa rakaat sholat subuh?",
            "Apa rukun iman?",
        ]);
    });

    test("clicking the Question header sorts the list alphabetically, then reverses", async () => {
        render(<AdminQuizPage />);
        await waitFor(() => {
            expect(screen.getByRole("table")).toBeInTheDocument();
        });

        const questionHeader = within(screen.getByRole("table")).getByRole(
            "button",
            { name: /admin\.quiz\.question/ },
        );

        fireEvent.click(questionHeader);
        expect(tableQuestions()).toEqual([
            "Apa rukun iman?",
            "Berapa rakaat sholat subuh?",
            "Siapa nabi terakhir?",
        ]);

        fireEvent.click(questionHeader);
        expect(tableQuestions()).toEqual([
            "Siapa nabi terakhir?",
            "Berapa rakaat sholat subuh?",
            "Apa rukun iman?",
        ]);
    });
});
