import { render, screen, waitFor } from "@testing-library/react";
import DailyAyahWidget from "@/components/DailyAyahWidget";

const mockFetch = jest.fn();
global.fetch = mockFetch;

jest.mock("@/context/Locale", () => ({
    useLocale: () => ({ t: (k) => k, lang: "ID" }),
}));

jest.mock("@/lib/translation", () => ({
    getLocalizedTranslation: (t, lang) => t?.[`${lang.toLowerCase()}`] ?? null,
}));

jest.mock("next/link", () => ({ children, href, ...p }) => (
    <a href={href} {...p}>
        {children}
    </a>
));

const mockAyah = {
    number: 1,
    translation: {
        ar: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
        id: "Dengan nama Allah",
        idn: "Dengan nama Allah Yang Maha Pengasih",
    },
    surah: {
        translation: {
            latin_en: "Al-Fatihah",
            latin_idn: "Al-Fatihah",
        },
    },
};

describe("DailyAyahWidget", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("shows loading state initially", () => {
        mockFetch.mockReturnValue(new Promise(() => {}));
        const { container } = render(<DailyAyahWidget />);
        expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
    });

    test("renders ayah after fetch", async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({ data: mockAyah }),
        });
        render(<DailyAyahWidget />);
        await waitFor(() => {
            expect(
                screen.getByText("quran.daily_ayah_label"),
            ).toBeInTheDocument();
        });
        expect(
            screen.getByText("بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ"),
        ).toBeInTheDocument();
        const meaning = screen.getByText(/Dengan nama Allah/);
        expect(meaning).toBeInTheDocument();
    });

    test("renders surah name and ayah number", async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({ data: mockAyah }),
        });
        render(<DailyAyahWidget />);
        await waitFor(() => {
            expect(screen.getByText(/Al-Fatihah/)).toBeInTheDocument();
        });
    });

    test("renders read more link", async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({ data: mockAyah }),
        });
        render(<DailyAyahWidget />);
        await waitFor(() => {
            expect(screen.getByText(/hadith.read_more/)).toBeInTheDocument();
        });
        const link = screen.getByText(/hadith.read_more/).closest("a");
        expect(link.getAttribute("href")).toContain("/quran/surah/al-fatihah");
    });

    test("returns null on fetch error", async () => {
        mockFetch.mockResolvedValue({ ok: false });
        const { container } = render(<DailyAyahWidget />);
        await waitFor(() => {
            expect(container.innerHTML).toBe("");
        });
    });
});
