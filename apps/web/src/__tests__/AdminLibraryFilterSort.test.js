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
        getExtractedText: jest.fn(),
        extractText: jest.fn(),
        upsertExtractedText: jest.fn(),
        generateDraft: jest.fn(),
    },
    adminQuizApi: {
        create: jest.fn(),
    },
    authFetch: jest.fn(),
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

// The "Status" sortable column header is also a <button> whose accessible
// name contains "admin.library.status", same as the status filter toggle's
// aria-label — disambiguate by picking the one that isn't inside the table.
const openStatusFilter = () => {
    const matches = screen.getAllByRole("button", {
        name: /admin\.library\.status/,
    });
    fireEvent.click(matches.find((el) => !el.closest("table")));
};

describe("Admin Library page — filter and sort", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        adminLibraryApi.list.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ items: ITEMS }),
        });
    });

    test("checking one category narrows the list to that category", async () => {
        render(<AdminLibraryPage />);
        await waitFor(() => {
            expect(screen.getByRole("table")).toBeInTheDocument();
        });
        expect(tableTitles()).toEqual([
            "Riyadhus Shalihinriyadhus-shalihin",
            "Al Wajizal-wajiz",
            "Bulughul Marambulughul-maram",
        ]);

        fireEvent.click(
            screen.getByRole("button", { name: /admin\.field\.category/ }),
        );
        fireEvent.click(screen.getByRole("checkbox", { name: "Fiqh" }));

        expect(tableTitles()).toEqual(["Al Wajizal-wajiz"]);
    });

    test("checking two categories matches either (OR)", async () => {
        render(<AdminLibraryPage />);
        await waitFor(() => {
            expect(screen.getByRole("table")).toBeInTheDocument();
        });

        fireEvent.click(
            screen.getByRole("button", { name: /admin\.field\.category/ }),
        );
        fireEvent.click(screen.getByRole("checkbox", { name: "Fiqh" }));
        fireEvent.click(screen.getByRole("checkbox", { name: "Hadith" }));

        expect(tableTitles()).toEqual([
            "Riyadhus Shalihinriyadhus-shalihin",
            "Al Wajizal-wajiz",
            "Bulughul Marambulughul-maram",
        ]);
    });

    test("checking one status narrows the list to that status", async () => {
        render(<AdminLibraryPage />);
        await waitFor(() => {
            expect(screen.getByRole("table")).toBeInTheDocument();
        });

        openStatusFilter();
        fireEvent.click(screen.getByRole("checkbox", { name: "draft" }));

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

    test("editing a book with legacy category preserves the category in the select", async () => {
        adminLibraryApi.list.mockReset();
        adminLibraryApi.list.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                items: [
                    {
                        id: 99,
                        title: "Buku Legacy",
                        slug: "buku-legacy",
                        author: "Ulama Kuno",
                        category: "Kisah Para Nabi",
                        level: "Lanjut",
                        language: "Arab/Indonesia",
                        format: "pdf",
                        status: "published",
                        license_status: "verified",
                    },
                ],
            }),
        });

        render(<AdminLibraryPage />);
        await waitFor(() => {
            expect(screen.getByRole("table")).toBeInTheDocument();
        });

        const editButtons = screen.getAllByRole("button", {
            name: /common\.edit/,
        });
        fireEvent.click(editButtons[0]);

        // Find the category select and verify the selected value
        const selects = screen.getAllByRole("combobox");
        const categorySelect = selects.find(
            (s) => s.value === "Kisah Para Nabi",
        );
        expect(categorySelect).toBeInTheDocument();
        expect(categorySelect.value).toBe("Kisah Para Nabi");
    });

    test("extract modal shows license warning for unverified book", async () => {
        adminLibraryApi.list.mockReset();
        adminLibraryApi.list.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                items: [
                    {
                        id: 99,
                        title: "Buku Unverified",
                        slug: "buku-unverified",
                        author: "Penulis",
                        category: "Aqidah",
                        format: "pdf",
                        status: "published",
                        license_status: "unverified",
                    },
                ],
            }),
        });
        adminLibraryApi.getExtractedText.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: [] }),
        });

        render(<AdminLibraryPage />);
        await waitFor(() => {
            expect(screen.getByRole("table")).toBeInTheDocument();
        });

        const extractButtons = screen.getAllByRole("button", {
            name: /Ekstrak Teks/,
        });
        fireEvent.click(extractButtons[0]);

        await waitFor(() => {
            expect(screen.getByText(/Peringatan Lisensi/)).toBeInTheDocument();
        });
    });

    test("editing and saving extracted page text updates the page", async () => {
        adminLibraryApi.list.mockReset();
        adminLibraryApi.list.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                items: [
                    {
                        id: 101,
                        title: "Buku Page Edit",
                        slug: "buku-page-edit",
                        author: "Penulis",
                        category: "Aqidah",
                        format: "pdf",
                        status: "published",
                        license_status: "verified",
                    },
                ],
            }),
        });
        adminLibraryApi.getExtractedText.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                data: [
                    {
                        page_number: 1,
                        text: "Teks halaman pertama sebelum diedit",
                        confident: true,
                    },
                ],
            }),
        });
        adminLibraryApi.upsertExtractedText.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ updated: 1 }),
        });

        render(<AdminLibraryPage />);
        await waitFor(() => {
            expect(screen.getByRole("table")).toBeInTheDocument();
        });

        const extractButtons = screen.getAllByRole("button", {
            name: /Ekstrak Teks/,
        });
        fireEvent.click(extractButtons[0]);

        await waitFor(() => {
            expect(screen.getByText("Teks halaman pertama sebelum diedit")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole("button", { name: "Edit" }));
        const dialog = screen.getByRole("dialog");
        const textarea = within(dialog).getByRole("textbox");
        fireEvent.change(textarea, { target: { value: "Teks halaman pertama setelah diedit" } });

        fireEvent.click(screen.getByRole("button", { name: "Simpan Koreksi" }));

        await waitFor(() => {
            expect(adminLibraryApi.upsertExtractedText).toHaveBeenCalledWith(101, {
                pages: [{ page_number: 1, text: "Teks halaman pertama setelah diedit" }],
            });
            expect(screen.getByText("Teks halaman pertama setelah diedit")).toBeInTheDocument();
        });
    });

    test("generates and saves lesson draft to lessons API", async () => {
        const { authFetch } = require("@/lib/api");
        adminLibraryApi.list.mockReset();
        adminLibraryApi.list.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                items: [
                    {
                        id: 102,
                        title: "Tiga Landasan Utama",
                        slug: "tiga-landasan-utama",
                        author: "Syaikh Muhammad",
                        category: "Aqidah",
                        format: "pdf",
                        source_type: "uploaded",
                        status: "published",
                        license_status: "verified",
                    },
                ],
            }),
        });
        adminLibraryApi.getExtractedText.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                data: [
                    { page_number: 1, text: "Bab Pertama: Mengenal Allah", confident: true },
                ],
            }),
        });
        adminLibraryApi.generateDraft.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                data: {
                    target: "lesson",
                    book_id: 102,
                    book_title: "Tiga Landasan Utama",
                    start_page: 1,
                    end_page: 1,
                    lesson_steps: [
                        {
                            title: "Bab Pertama: Mengenal Allah",
                            kind: "teori",
                            body: "Mengenal Allah dengan dalil-dalil-Nya",
                            dalil: "QS. Al-Baqarah: 21",
                            source_citation: "Buku: Tiga Landasan Utama, Halaman: 1",
                            source_page: 1,
                        },
                    ],
                },
            }),
        });
        authFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: { id: 1 } }),
        });

        render(<AdminLibraryPage />);
        await waitFor(() => {
            expect(screen.getByRole("table")).toBeInTheDocument();
        });

        const extractButtons = screen.getAllByRole("button", {
            name: /Ekstrak Teks/,
        });
        fireEvent.click(extractButtons[0]);

        await waitFor(() => {
            expect(screen.getByText("Bab Pertama: Mengenal Allah")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText("Bangkitkan Draft"));

        await waitFor(() => {
            expect(screen.getByRole("button", { name: "Simpan sebagai Modul Belajar" })).toBeInTheDocument();
        });

        const saveBtn = screen.getByRole("button", { name: "Simpan sebagai Modul Belajar" });
        fireEvent.click(saveBtn);

        await waitFor(() => {
            expect(authFetch).toHaveBeenCalledWith(
                "/api/v1/lessons",
                expect.objectContaining({
                    method: "POST",
                })
            );
        });
    });
});
