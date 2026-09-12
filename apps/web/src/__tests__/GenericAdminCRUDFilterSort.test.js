import {
    fireEvent,
    render,
    screen,
    waitFor,
    within,
} from "@testing-library/react";
import GenericAdminCRUD from "@/components/panel/GenericAdminCRUD";

jest.mock("@/lib/api", () => ({
    parseApiError: jest.fn(),
}));

const ITEMS = [
    { id: 1, name: "Perawi Zaid", tabaqah: "sahabat", province: "DKI Jakarta" },
    { id: 2, name: "Perawi Amr", tabaqah: "tabiin", province: "Jawa Barat" },
    { id: 3, name: "Perawi Malik", tabaqah: "sahabat", province: "DKI Jakarta" },
];

const api = {
    list: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
};

const fields = [
    { key: "name", label: "Nama", type: "text" },
    {
        key: "tabaqah",
        label: "Tabaqah",
        type: "select",
        options: ["sahabat", "tabiin"],
    },
    { key: "province", label: "Provinsi", type: "text", filterable: true },
];

// GenericAdminCRUD renders both a mobile card list and a desktop table
// unconditionally (visibility is CSS-only), so scope queries to the table.
const tableNames = () =>
    within(screen.getByRole("table"))
        .getAllByRole("row")
        .slice(1)
        .map((row) => within(row).getAllByRole("cell")[0].textContent);

describe("GenericAdminCRUD — filter and sort", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        api.list.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ items: ITEMS }),
        });
    });

    test("a select-type field's own options become a filter dropdown", async () => {
        render(<GenericAdminCRUD title='Perawi' api={api} fields={fields} />);
        await waitFor(() => {
            expect(screen.getByRole("table")).toBeInTheDocument();
        });
        expect(tableNames()).toEqual([
            "Perawi Zaid",
            "Perawi Amr",
            "Perawi Malik",
        ]);

        fireEvent.change(
            screen.getByRole("combobox", { name: "Tabaqah" }),
            { target: { value: "tabiin" } },
        );
        expect(tableNames()).toEqual(["Perawi Amr"]);
    });

    test("a `filterable: true` text field derives its options from loaded rows", async () => {
        render(<GenericAdminCRUD title='Perawi' api={api} fields={fields} />);
        await waitFor(() => {
            expect(screen.getByRole("table")).toBeInTheDocument();
        });

        const provinceFilter = screen.getByRole("combobox", {
            name: "Provinsi",
        });
        expect(
            within(provinceFilter).getByRole("option", {
                name: "DKI Jakarta",
            }),
        ).toBeInTheDocument();

        fireEvent.change(provinceFilter, {
            target: { value: "Jawa Barat" },
        });
        expect(tableNames()).toEqual(["Perawi Amr"]);
    });

    test("clicking a column header sorts by that field, then reverses", async () => {
        render(<GenericAdminCRUD title='Perawi' api={api} fields={fields} />);
        await waitFor(() => {
            expect(screen.getByRole("table")).toBeInTheDocument();
        });

        const nameHeader = within(screen.getByRole("table")).getByRole(
            "button",
            { name: /Nama/ },
        );

        fireEvent.click(nameHeader);
        expect(tableNames()).toEqual([
            "Perawi Amr",
            "Perawi Malik",
            "Perawi Zaid",
        ]);

        fireEvent.click(nameHeader);
        expect(tableNames()).toEqual([
            "Perawi Zaid",
            "Perawi Malik",
            "Perawi Amr",
        ]);
    });
});
