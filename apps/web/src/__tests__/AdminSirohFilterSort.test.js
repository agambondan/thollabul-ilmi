import {
    fireEvent,
    render,
    screen,
    waitFor,
    within,
} from "@testing-library/react";
import AdminSirahPage from "@/app/admin/siroh/page";
import { adminSirohApi } from "@/lib/api";

jest.mock("@/lib/api", () => ({
    adminSirohApi: {
        listCategories: jest.fn(),
        listContents: jest.fn(),
        createCategory: jest.fn(),
        updateCategory: jest.fn(),
        deleteCategory: jest.fn(),
        deleteContent: jest.fn(),
    },
    parseApiError: jest.fn(),
}));

jest.mock("@/context/Locale", () => ({
    useLocale: () => ({
        t: (key) => key,
        lang: "ID",
    }),
}));

const CATEGORIES = [
    { id: 1, title: "Periode Makkah", slug: "makkah", order: 1 },
    { id: 2, title: "Periode Madinah", slug: "madinah", order: 2 },
];

const CONTENTS = [
    { id: 1, title: "Kelahiran Nabi", category_id: 1, order: 2 },
    { id: 2, title: "Hijrah ke Madinah", category_id: 2, order: 1 },
    { id: 3, title: "Fathu Makkah", category_id: 1, order: 3 },
];

// The contents column is a plain card list, not a table — scope every query to
// its own container so the categories column's similarly-shaped cards never
// bleed into the assertions.
const contentTitles = () => {
    const container = screen.getByTestId("sirah-contents-list");
    return Array.from(container.querySelectorAll(":scope > div")).map(
        (row) => row.querySelector("p").textContent,
    );
};

describe("Admin Siroh page — filter and sort contents", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        adminSirohApi.listCategories.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ items: CATEGORIES }),
        });
        adminSirohApi.listContents.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ items: CONTENTS }),
        });
    });

    test("checking one category narrows the contents list to that category", async () => {
        render(<AdminSirahPage />);
        await waitFor(() => {
            expect(
                screen.getByTestId("sirah-contents-list"),
            ).toBeInTheDocument();
        });
        expect(contentTitles()).toEqual([
            "Kelahiran Nabi",
            "Hijrah ke Madinah",
            "Fathu Makkah",
        ]);

        fireEvent.click(
            screen.getByRole("button", { name: /^admin\.field\.category:/ }),
        );
        fireEvent.click(
            screen.getByRole("checkbox", { name: "Periode Madinah" }),
        );

        expect(contentTitles()).toEqual(["Hijrah ke Madinah"]);
    });

    test("checking two categories matches either (OR)", async () => {
        render(<AdminSirahPage />);
        await waitFor(() => {
            expect(
                screen.getByTestId("sirah-contents-list"),
            ).toBeInTheDocument();
        });

        fireEvent.click(
            screen.getByRole("button", { name: /^admin\.field\.category:/ }),
        );
        fireEvent.click(
            screen.getByRole("checkbox", { name: "Periode Madinah" }),
        );
        fireEvent.click(
            screen.getByRole("checkbox", { name: "Periode Makkah" }),
        );

        expect(contentTitles()).toEqual([
            "Kelahiran Nabi",
            "Hijrah ke Madinah",
            "Fathu Makkah",
        ]);
    });

    test("clicking the title sort toggle sorts alphabetically, then reverses", async () => {
        render(<AdminSirahPage />);
        await waitFor(() => {
            expect(
                screen.getByTestId("sirah-contents-list"),
            ).toBeInTheDocument();
        });

        const titleSort = screen.getByRole("button", {
            name: /admin\.field\.title/,
        });

        fireEvent.click(titleSort);
        expect(contentTitles()).toEqual([
            "Fathu Makkah",
            "Hijrah ke Madinah",
            "Kelahiran Nabi",
        ]);

        fireEvent.click(titleSort);
        expect(contentTitles()).toEqual([
            "Kelahiran Nabi",
            "Hijrah ke Madinah",
            "Fathu Makkah",
        ]);
    });

    test("clicking the order sort toggle sorts numerically", async () => {
        render(<AdminSirahPage />);
        await waitFor(() => {
            expect(
                screen.getByTestId("sirah-contents-list"),
            ).toBeInTheDocument();
        });

        const orderSort = screen.getByRole("button", {
            name: /admin\.field\.order/,
        });

        fireEvent.click(orderSort);
        expect(contentTitles()).toEqual([
            "Hijrah ke Madinah",
            "Kelahiran Nabi",
            "Fathu Makkah",
        ]);
    });
});
