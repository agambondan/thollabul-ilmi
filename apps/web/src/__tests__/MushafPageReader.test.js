import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import MushafPageReader from "@/components/quran/MushafPageReader";

const mockByPage = jest.fn();
const mockMufrodatByPage = jest.fn();

jest.mock("@/lib/api", () => ({
    quranApi: {
        byPage: (...args) => mockByPage(...args),
        mufrodatByPage: (...args) => mockMufrodatByPage(...args),
    },
}));

jest.mock("@/context/Locale", () => ({
    useLocale: () => ({
        lang: "ID",
        t: (key) =>
            ({
                "common.loading": "Memuat",
                "mushaf.go": "Buka",
                "mushaf.go_to_page": "Halaman",
                "mushaf.translation_on": "Tampilkan Terjemahan",
                "mushaf.translation_off": "Sembunyikan Terjemahan",
                "mushaf.prev_page": "Halaman Sebelumnya",
                "mushaf.next_page": "Halaman Berikutnya",
                "mushaf.zoom_in": "Perbesar",
                "mushaf.zoom_out": "Perkecil",
                "mushaf.juz": "Juz",
                "mushaf.page": "Halaman",
                "mushaf.surah": "Surah",
                "mushaf.placeholder": "—",
                "mushaf.font_lpmq": "Kemenag (LPMQ)",
                "mushaf.font_kitab": "Uthmani (King Fahd)",
                "mushaf.font_indopak": "Indopak",
                "mushaf.font_naskh": "Naskh",
            })[key] ?? key,
    }),
}));

jest.mock("@/lib/useQuranFont", () => ({
    QURAN_FONTS: [{ id: "lpmq", label: "Kemenag (LPMQ)", cls: "font-lpmq" }],
    useQuranFont: () => ({
        fontCls: "font-lpmq",
        fontId: "lpmq",
        setFont: jest.fn(),
        arabicFontSize: 40,
        setArabicFontSize: jest.fn(),
    }),
}));

const ayah = {
    id: 2156,
    number: 16,
    page: 295,
    juz_number: 15,
    surah: { number: 18, translation: { latin_idn: "Al-Kahf" } },
    translation: { idn: "Dan apabila kamu meninggalkan mereka." },
};

const word = {
    id: 37713,
    ayah_id: 2156,
    word_index: 1,
    arabic: "وَإِذِ",
    transliteration: "wa-idhi",
    indonesian: "dan apabila",
};

describe("MushafPageReader", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        window.history.replaceState(null, "", "/quran/page-mushaf?page=295");
        mockByPage.mockResolvedValue({ json: async () => ({ items: [ayah] }) });
        mockMufrodatByPage.mockResolvedValue({
            json: async () => ({ items: [word] }),
        });
    });

    test("loads by mushaf page, renders localized labels, and keeps page in URL", async () => {
        render(<MushafPageReader />);

        expect(await screen.findByText("وَإِذِ")).toBeInTheDocument();
        expect(mockByPage).toHaveBeenCalledWith(295);
        expect(screen.getByText("Juz")).toBeInTheDocument();
        expect(screen.getByText("Halaman")).toBeInTheDocument();
        expect(screen.getByText("Surah")).toBeInTheDocument();
        expect(screen.getByText("18. Al-Kahf")).toBeInTheDocument();
        expect(screen.getByText("dan apabila")).toBeInTheDocument();
        expect(window.location.search).toBe("?page=295");
    });

    test("next button moves to the next mushaf page", async () => {
        render(<MushafPageReader />);
        expect(await screen.findByText("وَإِذِ")).toBeInTheDocument();
        expect(mockByPage).toHaveBeenCalledWith(295);

        fireEvent.click(
            screen.getByRole("button", { name: "Halaman Berikutnya" }),
        );

        await waitFor(() => expect(mockByPage).toHaveBeenCalledWith(296));
        expect(window.location.search).toBe("?page=296");
    });
});
