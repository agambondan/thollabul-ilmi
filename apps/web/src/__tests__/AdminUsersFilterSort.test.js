import {
    fireEvent,
    render,
    screen,
    waitFor,
    within,
} from "@testing-library/react";
import AdminUsersPage from "@/app/admin/users/page";
import { adminUserApi } from "@/lib/api";

jest.mock("@/lib/api", () => ({
    adminUserApi: {
        list: jest.fn(),
        updateRole: jest.fn(),
        delete: jest.fn(),
    },
}));

jest.mock("@/context/Auth", () => ({
    useAuth: () => ({ user: { id: 999 } }),
}));

jest.mock("@/context/Locale", () => ({
    useLocale: () => ({
        t: (key) => key,
        lang: "ID",
    }),
}));

const USERS = [
    { id: 1, name: "Zaid", email: "zaid@example.com", role: "user" },
    { id: 2, name: "Aisyah", email: "aisyah@example.com", role: "admin" },
    { id: 3, name: "Bilal", email: "bilal@example.com", role: "editor" },
];

// The page renders both a mobile card list and a desktop table unconditionally
// (visibility is CSS-only, via `md:hidden` / `hidden md:block`), so jsdom sees
// both at once. Scope every query to the desktop `<table>` to avoid duplicate
// matches from the mobile card view.
const tableNames = () =>
    within(screen.getByRole("table"))
        .getAllByRole("row")
        .slice(1)
        .map((row) => within(row).getAllByRole("cell")[0].textContent);

describe("Admin Users page — filter and sort", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        adminUserApi.list.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ items: USERS }),
        });
    });

    test("role filter narrows the list to a single role", async () => {
        render(<AdminUsersPage />);
        await waitFor(() => {
            expect(screen.getByRole("table")).toBeInTheDocument();
        });
        expect(tableNames()).toEqual(["Zaid", "Aisyah", "Bilal"]);

        const select = screen.getByRole("combobox", { name: "Role" });
        fireEvent.change(select, { target: { value: "admin" } });

        expect(tableNames()).toEqual(["Aisyah"]);
    });

    test("clicking the Name header sorts the list alphabetically, then reverses", async () => {
        render(<AdminUsersPage />);
        await waitFor(() => {
            expect(screen.getByRole("table")).toBeInTheDocument();
        });

        const nameHeader = within(screen.getByRole("table")).getByRole(
            "button",
            { name: /admin\.field\.name/ },
        );

        fireEvent.click(nameHeader);
        expect(tableNames()).toEqual(["Aisyah", "Bilal", "Zaid"]);

        fireEvent.click(nameHeader);
        expect(tableNames()).toEqual(["Zaid", "Bilal", "Aisyah"]);
    });
});
