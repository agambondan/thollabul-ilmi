import {
    fireEvent,
    render,
    screen,
    waitFor,
    within,
} from "@testing-library/react";
import AdminLessonsPage from "@/app/admin/lessons/page";
import { authFetch } from "@/lib/api";

jest.mock("@/lib/api", () => ({
    authFetch: jest.fn(),
    parseApiError: jest.fn(),
}));

jest.mock("@/context/Locale", () => ({
    useLocale: () => ({
        t: (key) => key,
        lang: "ID",
    }),
}));

jest.mock("react-hot-toast", () => ({
    __esModule: true,
    default: { success: jest.fn(), error: jest.fn() },
}));

const MODULES = [
    {
        id: 1,
        title: "Belajar Wudhu",
        slug: "belajar-wudhu",
        order: 2,
        steps: [],
    },
    {
        id: 2,
        title: "Adab Menuntut Ilmu",
        slug: "adab-ilmu",
        order: 1,
        steps: [],
    },
    { id: 3, title: "Cara Sholat", slug: "cara-sholat", order: 3, steps: [] },
];

// The page renders both a mobile card list and a desktop table unconditionally
// (visibility is CSS-only, via `md:hidden` / `hidden md:block`), so jsdom sees
// both at once. Scope every query to the desktop `<table>` to avoid duplicate
// matches from the mobile card view.
const tableTitles = () =>
    within(screen.getByRole("table"))
        .getAllByRole("row")
        .slice(1)
        .map((row) => within(row).getAllByRole("cell")[1].textContent);

describe("Admin Lessons page — sort", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        global.fetch = jest.fn().mockResolvedValueOnce({
            ok: true,
            json: async () => ({ items: MODULES }),
        });
    });

    test("clicking the Judul header sorts the list alphabetically, then reverses", async () => {
        render(<AdminLessonsPage />);
        await waitFor(() => {
            expect(screen.getByRole("table")).toBeInTheDocument();
        });
        expect(tableTitles()).toEqual([
            "Belajar Wudhu",
            "Adab Menuntut Ilmu",
            "Cara Sholat",
        ]);

        const titleHeader = within(screen.getByRole("table")).getByRole(
            "button",
            { name: /Judul/ },
        );

        fireEvent.click(titleHeader);
        expect(tableTitles()).toEqual([
            "Adab Menuntut Ilmu",
            "Belajar Wudhu",
            "Cara Sholat",
        ]);

        fireEvent.click(titleHeader);
        expect(tableTitles()).toEqual([
            "Cara Sholat",
            "Belajar Wudhu",
            "Adab Menuntut Ilmu",
        ]);
    });

    test("clicking the Urutan header sorts the list numerically", async () => {
        render(<AdminLessonsPage />);
        await waitFor(() => {
            expect(screen.getByRole("table")).toBeInTheDocument();
        });

        const orderHeader = within(screen.getByRole("table")).getByRole(
            "button",
            { name: /Urutan/ },
        );

        fireEvent.click(orderHeader);
        expect(tableTitles()).toEqual([
            "Adab Menuntut Ilmu",
            "Belajar Wudhu",
            "Cara Sholat",
        ]);
    });
});
