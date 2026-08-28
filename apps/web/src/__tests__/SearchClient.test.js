import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SearchClient from "@/app/search/SearchClient";

jest.mock("@/lib/api", () => {
    const mockFn = jest.fn();
    return {
        searchApi: {
            search: mockFn,
        },
    };
});

const { searchApi } = require("@/lib/api");

jest.mock("@/context/Locale", () => ({
    useLocale: () => ({
        t: (key) => {
            const map = {
                "search.title": "Pencarian",
                "search.placeholder": "Cari...",
                "search.type.all": "Semua",
                "search.type.ayah": "Al-Quran",
                "search.type.hadith": "Hadith",
                "common.search": "Cari",
                "common.no_results": "Tidak ditemukan",
                "search.error": "Terjadi kesalahan",
            };
            return map[key] || key;
        },
        lang: "id",
    }),
    LocaleProvider: ({ children }) => children,
}));

jest.mock("@/lib/useLayoutMode", () => ({
    useLayoutMode: () => ({ isWide: false }),
}));

jest.mock("next/link", () => ({ children, href, ...props }) => (
    <a href={href} {...props}>
        {children}
    </a>
));

const mockAllResults = {
    ayahs: [
        {
            id: 1,
            number: 1,
            surah: { number: 1, translation: { latin_en: "Al-Fatihah" } },
            translation: { ar: "بِسْمِ اللَّهِ", idn: "Dengan nama Allah" },
        },
    ],
    ayah_total: 3,
    hadiths: [
        {
            id: 1,
            number: 42,
            book: { slug: "bukhari", translation: { latin_en: "Bukhari" } },
            translation: { ar: "النَّص", idn: "Terjemahan" },
            grade: "Sahih",
        },
    ],
    hadith_total: 3,
    doas: [{ id: 1, title: "Doa Tidur", translation: { idn: "Bacaan tidur" } }],
    doa_total: 3,
    dictionaries: [{ id: 1, term: "Taqwa", definition: "Ketakwaan" }],
    dictionary_total: 3,
    kajians: [{ id: 1, title: "Kajian Tafsir", speaker: "Ustadz" }],
    kajian_total: 3,
    perawis: [
        { id: 1, nama_latin: "Bukhari", nama_lengkap: "Muhammad bin Ismail" },
    ],
    perawi_total: 3,
    total: 18,
};

const mockHadithOnly = {
    hadiths: [
        {
            id: 1,
            number: 42,
            book: { slug: "bukhari", translation: { latin_en: "Bukhari" } },
            translation: { ar: "النَّص", idn: "Terjemahan" },
            grade: "Sahih",
        },
        {
            id: 2,
            number: 7,
            book: { slug: "muslim", translation: { latin_en: "Muslim" } },
            translation: { ar: "نَصٌّ", idn: "Terjemahan lain" },
            grade: "Hasan",
        },
    ],
    hadith_total: 5,
    total: 5,
};

const mockDoaOnly = {
    doas: [{ id: 1, title: "Doa Tidur", translation: { idn: "Bacaan tidur" } }],
    doa_total: 3,
    total: 3,
};

function mockSearchResponse(data) {
    return Promise.resolve({ json: () => Promise.resolve(data) });
}

beforeEach(() => {
    jest.clearAllMocks();
});

describe("SearchClient", () => {
    // ============ Initial state ============
    test("renders search input and submit button", () => {
        render(<SearchClient />);
        expect(screen.getByPlaceholderText("Cari...")).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: /Cari/i }),
        ).toBeInTheDocument();
    });

    test("shows all 7 filter tabs", () => {
        render(<SearchClient />);
        expect(screen.getByText("Semua")).toBeInTheDocument();
        expect(screen.getByText("Al-Quran")).toBeInTheDocument();
        expect(screen.getByText("Hadith")).toBeInTheDocument();
        expect(screen.getByText("Doa")).toBeInTheDocument();
        expect(screen.getByText("Kamus")).toBeInTheDocument();
        expect(screen.getByText("Kajian")).toBeInTheDocument();
        expect(screen.getByText("Perawi")).toBeInTheDocument();
    });

    test("renders title", () => {
        render(<SearchClient />);
        expect(screen.getByText("Pencarian")).toBeInTheDocument();
    });

    test("uses initialQuery prop", () => {
        render(<SearchClient initialQuery='taqwa' />);
        expect(screen.getByPlaceholderText("Cari...")).toHaveValue("taqwa");
    });

    // ============ Search flow ============
    test("calls searchApi on form submit", async () => {
        searchApi.search.mockReturnValue(mockSearchResponse(mockAllResults));
        const user = userEvent.setup();
        render(<SearchClient />);
        await user.type(screen.getByPlaceholderText("Cari..."), "taqwa");
        await user.click(screen.getByRole("button", { name: /Cari/i }));
        await waitFor(() => {
            expect(searchApi.search).toHaveBeenCalledWith(
                "taqwa",
                "all",
                "id",
                0,
                20,
            );
        });
    });

    test("shows loading state during search", async () => {
        let resolveSearch;
        searchApi.search.mockReturnValue(
            new Promise((resolve) => {
                resolveSearch = resolve;
            }),
        );
        const user = userEvent.setup();
        render(<SearchClient />);
        await user.type(screen.getByPlaceholderText("Cari..."), "taqwa");
        await user.click(screen.getByRole("button", { name: /Cari/i }));
        expect(screen.queryByText("Dengan nama Allah")).not.toBeInTheDocument();
        resolveSearch({ json: () => Promise.resolve(mockAllResults) });
        await waitFor(() => {
            expect(screen.getByText("Dengan nama Allah")).toBeInTheDocument();
        });
    });

    test("hides loading after results arrive", async () => {
        searchApi.search.mockReturnValue(mockSearchResponse(mockAllResults));
        const user = userEvent.setup();
        render(<SearchClient />);
        await user.type(screen.getByPlaceholderText("Cari..."), "taqwa");
        await user.click(screen.getByRole("button", { name: /Cari/i }));
        await waitFor(() => {
            expect(screen.getByText("Dengan nama Allah")).toBeInTheDocument();
        });
    });

    // ============ Results rendering in "all" tab ============
    test('shows ayah results in "all" tab', async () => {
        searchApi.search.mockReturnValue(mockSearchResponse(mockAllResults));
        const user = userEvent.setup();
        render(<SearchClient />);
        await user.type(screen.getByPlaceholderText("Cari..."), "taqwa");
        await user.click(screen.getByRole("button", { name: /Cari/i }));
        await waitFor(() => {
            expect(screen.getByText("Al-Fatihah : 1")).toBeInTheDocument();
        });
    });

    test('shows hadith results in "all" tab', async () => {
        searchApi.search.mockReturnValue(mockSearchResponse(mockAllResults));
        const user = userEvent.setup();
        render(<SearchClient />);
        await user.type(screen.getByPlaceholderText("Cari..."), "taqwa");
        await user.click(screen.getByRole("button", { name: /Cari/i }));
        await waitFor(() => {
            expect(screen.getByText("Bukhari : 42")).toBeInTheDocument();
        });
    });

    test('shows doa results in "all" tab', async () => {
        searchApi.search.mockReturnValue(mockSearchResponse(mockAllResults));
        const user = userEvent.setup();
        render(<SearchClient />);
        await user.type(screen.getByPlaceholderText("Cari..."), "taqwa");
        await user.click(screen.getByRole("button", { name: /Cari/i }));
        await waitFor(() => {
            expect(screen.getByText("Doa Tidur")).toBeInTheDocument();
        });
    });

    test('shows kamus results in "all" tab', async () => {
        searchApi.search.mockReturnValue(mockSearchResponse(mockAllResults));
        const user = userEvent.setup();
        render(<SearchClient />);
        await user.type(screen.getByPlaceholderText("Cari..."), "taqwa");
        await user.click(screen.getByRole("button", { name: /Cari/i }));
        await waitFor(() => {
            expect(screen.getByText("Taqwa")).toBeInTheDocument();
        });
    });

    test('shows kajian results in "all" tab', async () => {
        searchApi.search.mockReturnValue(mockSearchResponse(mockAllResults));
        const user = userEvent.setup();
        render(<SearchClient />);
        await user.type(screen.getByPlaceholderText("Cari..."), "taqwa");
        await user.click(screen.getByRole("button", { name: /Cari/i }));
        await waitFor(() => {
            expect(screen.getByText("Kajian Tafsir")).toBeInTheDocument();
        });
    });

    test('shows perawi results in "all" tab', async () => {
        searchApi.search.mockReturnValue(mockSearchResponse(mockAllResults));
        const user = userEvent.setup();
        render(<SearchClient />);
        await user.type(screen.getByPlaceholderText("Cari..."), "taqwa");
        await user.click(screen.getByRole("button", { name: /Cari/i }));
        await waitFor(() => {
            expect(screen.getByText("Bukhari")).toBeInTheDocument();
        });
    });

    // ============ "Lihat Semua" links ============
    test('each category shows "Lihat Semua" in "all" tab', async () => {
        searchApi.search.mockReturnValue(mockSearchResponse(mockAllResults));
        const user = userEvent.setup();
        render(<SearchClient />);
        await user.type(screen.getByPlaceholderText("Cari..."), "taqwa");
        await user.click(screen.getByRole("button", { name: /Cari/i }));
        await waitFor(() => {
            const links = screen.getAllByText(/Lihat Semua/i);
            expect(links.length).toBe(6);
        });
    });

    test('"Lihat Semua" links point to correct type-specific URL', async () => {
        searchApi.search.mockReturnValue(mockSearchResponse(mockAllResults));
        const user = userEvent.setup();
        render(<SearchClient />);
        await user.type(screen.getByPlaceholderText("Cari..."), "taqwa");
        await user.click(screen.getByRole("button", { name: /Cari/i }));
        await waitFor(() => {
            const links = screen.getAllByText(/Lihat Semua/i);
            const ayahLink = links.find((l) =>
                l.getAttribute("href")?.includes("type=ayah"),
            );
            expect(ayahLink).toHaveAttribute(
                "href",
                "/search?q=taqwa&type=ayah",
            );
        });
    });

    // ============ Individual tabs ============
    test('clicking "Hadith" tab shows only hadith results', async () => {
        searchApi.search.mockReturnValue(mockSearchResponse(mockAllResults));
        const user = userEvent.setup();
        render(<SearchClient />);
        await user.type(screen.getByPlaceholderText("Cari..."), "taqwa");
        await user.click(screen.getByRole("button", { name: /Cari/i }));
        await waitFor(() => {
            expect(screen.getByText("Bukhari : 42")).toBeInTheDocument();
        });
        searchApi.search.mockReturnValue(mockSearchResponse(mockHadithOnly));
        const tabButtons = screen.getAllByRole("button");
        const hadithTab = tabButtons.find((b) => b.textContent === "Hadith");
        await user.click(hadithTab);
        await waitFor(() => {
            expect(searchApi.search).toHaveBeenLastCalledWith(
                "taqwa",
                "hadith",
                "id",
                0,
                20,
            );
        });
    });

    test('clicking "Doa" tab shows only doa results', async () => {
        searchApi.search.mockReturnValue(mockSearchResponse(mockAllResults));
        const user = userEvent.setup();
        render(<SearchClient />);
        await user.type(screen.getByPlaceholderText("Cari..."), "taqwa");
        await user.click(screen.getByRole("button", { name: /Cari/i }));
        await waitFor(() => {
            expect(screen.getByText("Doa Tidur")).toBeInTheDocument();
        });
        searchApi.search.mockReturnValue(mockSearchResponse(mockDoaOnly));
        const tabButtons = screen.getAllByRole("button");
        const doaTab = tabButtons.find((b) => b.textContent === "Doa");
        await user.click(doaTab);
        await waitFor(() => {
            expect(searchApi.search).toHaveBeenLastCalledWith(
                "taqwa",
                "doa",
                "id",
                0,
                20,
            );
        });
    });

    // ============ Edge cases ============
    test('empty results shows "Tidak ditemukan" message', async () => {
        searchApi.search.mockReturnValue(mockSearchResponse({ total: 0 }));
        const user = userEvent.setup();
        render(<SearchClient />);
        await user.type(
            screen.getByPlaceholderText("Cari..."),
            "xyznonexistent",
        );
        await user.click(screen.getByRole("button", { name: /Cari/i }));
        await waitFor(() => {
            expect(screen.getByText(/Tidak ditemukan/)).toBeInTheDocument();
        });
    });

    test("error state shows error message", async () => {
        searchApi.search.mockRejectedValue(new Error("Network error"));
        const user = userEvent.setup();
        render(<SearchClient />);
        await user.type(screen.getByPlaceholderText("Cari..."), "taqwa");
        await user.click(screen.getByRole("button", { name: /Cari/i }));
        await waitFor(() => {
            expect(screen.getByText("Terjadi kesalahan")).toBeInTheDocument();
        });
    });

    test("empty query does not trigger search", async () => {
        const user = userEvent.setup();
        render(<SearchClient />);
        await user.click(screen.getByRole("button", { name: /Cari/i }));
        expect(searchApi.search).not.toHaveBeenCalled();
    });

    test('"Muat Lainnya" button appears when more results available', async () => {
        const manyHadiths = Array.from({ length: 20 }, (_, i) => ({
            id: i + 1,
            number: i + 1,
            book: { slug: "bukhari", translation: { latin_en: "Bukhari" } },
            translation: { ar: "نَص", idn: "Hadis" },
            grade: "Sahih",
        }));
        searchApi.search.mockReturnValue(
            mockSearchResponse({
                hadiths: manyHadiths,
                hadith_total: 25,
                total: 25,
            }),
        );
        const user = userEvent.setup();
        render(<SearchClient />);
        await user.type(screen.getByPlaceholderText("Cari..."), "hadis");
        await user.click(screen.getByRole("button", { name: /Cari/i }));
        const tabButtons = screen.getAllByRole("button");
        const hadithTab = tabButtons.find((b) => b.textContent === "Hadith");
        await user.click(hadithTab);
        await waitFor(() => {
            expect(screen.getByText("Muat Lainnya")).toBeInTheDocument();
        });
    });

    test('calls searchApi with page increment on "Muat Lainnya"', async () => {
        const manyHadiths = Array.from({ length: 20 }, (_, i) => ({
            id: i + 1,
            number: i + 1,
            book: { slug: "bukhari", translation: { latin_en: "Bukhari" } },
            translation: { ar: "نَص", idn: "Hadis" },
            grade: "Sahih",
        }));
        searchApi.search.mockReturnValue(
            mockSearchResponse({
                hadiths: manyHadiths,
                hadith_total: 25,
                total: 25,
            }),
        );
        const user = userEvent.setup();
        render(<SearchClient />);
        await user.type(screen.getByPlaceholderText("Cari..."), "hadis");
        await user.click(screen.getByRole("button", { name: /Cari/i }));
        const tabButtons = screen.getAllByRole("button");
        const hadithTab = tabButtons.find((b) => b.textContent === "Hadith");
        await user.click(hadithTab);
        await waitFor(() => {
            expect(screen.getByText("Muat Lainnya")).toBeInTheDocument();
        });
        const secondPage = manyHadiths.slice(0, 5).map((h, i) => ({
            ...h,
            id: 100 + i,
            number: 100 + i,
        }));
        searchApi.search.mockReturnValue(
            mockSearchResponse({
                hadiths: [...manyHadiths, ...secondPage],
                hadith_total: 25,
                total: 25,
            }),
        );
        await user.click(screen.getByText("Muat Lainnya"));
        await waitFor(() => {
            expect(searchApi.search).toHaveBeenLastCalledWith(
                "hadis",
                "hadith",
                "id",
                1,
                20,
            );
        });
    });
});
