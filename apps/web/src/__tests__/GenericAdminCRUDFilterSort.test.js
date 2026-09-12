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

// A field's own sortable column header is also a <button> whose accessible
// name is the plain field label ("Tabaqah", "Provinsi"), same text the
// filter toggle's aria-label starts with — disambiguate by excluding
// whichever button sits inside the table.
const openFilter = (label) => {
    const matches = screen.getAllByRole("button", {
        name: new RegExp(`^${label}`),
    });
    fireEvent.click(matches.find((el) => !el.closest("table")));
};

describe("GenericAdminCRUD — filter and sort", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        api.list.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ items: ITEMS }),
        });
    });

    test("a select-type field's own options become a checkbox filter", async () => {
        render(<GenericAdminCRUD title='Perawi' api={api} fields={fields} />);
        await waitFor(() => {
            expect(screen.getByRole("table")).toBeInTheDocument();
        });
        expect(tableNames()).toEqual([
            "Perawi Zaid",
            "Perawi Amr",
            "Perawi Malik",
        ]);

        openFilter("Tabaqah");
        fireEvent.click(screen.getByRole("checkbox", { name: "tabiin" }));
        expect(tableNames()).toEqual(["Perawi Amr"]);
    });

    test("checking two values on the same filter matches either (OR)", async () => {
        render(<GenericAdminCRUD title='Perawi' api={api} fields={fields} />);
        await waitFor(() => {
            expect(screen.getByRole("table")).toBeInTheDocument();
        });

        openFilter("Tabaqah");
        fireEvent.click(screen.getByRole("checkbox", { name: "sahabat" }));
        fireEvent.click(screen.getByRole("checkbox", { name: "tabiin" }));
        expect(tableNames()).toEqual([
            "Perawi Zaid",
            "Perawi Amr",
            "Perawi Malik",
        ]);
    });

    test("a `filterable: true` text field derives its checkbox options from loaded rows", async () => {
        render(<GenericAdminCRUD title='Perawi' api={api} fields={fields} />);
        await waitFor(() => {
            expect(screen.getByRole("table")).toBeInTheDocument();
        });

        openFilter("Provinsi");
        expect(
            screen.getByRole("checkbox", { name: "DKI Jakarta" }),
        ).toBeInTheDocument();

        fireEvent.click(
            screen.getByRole("checkbox", { name: "Jawa Barat" }),
        );
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
