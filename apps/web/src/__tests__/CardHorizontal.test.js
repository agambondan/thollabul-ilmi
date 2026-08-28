import { render, screen } from "@testing-library/react";
import CardHorizontal from "@/components/card/CardHorizontal";

jest.mock("@/lib/translation", () => ({
    getLocalizedTranslation: (translation, lang) =>
        translation?.idn || translation?.id || "",
}));

const mockSurat = {
    number: 1,
    translation: {
        ar: "سُورَةُ الْفَاتِحَةِ",
        latin_en: "Al-Fatihah",
        idn: "Pembukaan",
    },
    revelation_type: "Meccan",
    number_of_ayahs: 7,
};

const t = (k) => {
    const map = { "quran.meccan": "Meccan", "quran.medinan": "Medinan" };
    return map[k] || k;
};

describe("CardHorizontal", () => {
    test("renders surah number", () => {
        const { container } = render(<CardHorizontal surat={mockSurat} />);
        expect(container.textContent).toContain("1");
    });

    test("renders latin name", () => {
        render(<CardHorizontal surat={mockSurat} />);
        expect(screen.getByText("Al-Fatihah")).toBeInTheDocument();
    });

    test("renders ayah count with default unit", () => {
        const { container } = render(<CardHorizontal surat={mockSurat} />);
        expect(container.textContent).toContain("7 Ayat");
    });

    test("renders with custom ayah unit", () => {
        const { container } = render(
            <CardHorizontal surat={mockSurat} ayahUnit='Ayahs' />,
        );
        expect(container.textContent).toContain("7 Ayahs");
    });

    test("renders revelation type", () => {
        const { container } = render(
            <CardHorizontal surat={mockSurat} t={t} />,
        );
        expect(container.textContent).toContain("Meccan");
    });

    test("renders Medinan revelation type", () => {
        const medinan = { ...mockSurat, revelation_type: "Medinan" };
        const { container } = render(<CardHorizontal surat={medinan} t={t} />);
        expect(container.textContent).toContain("Medinan");
    });

    test("renders arabic name without prefix", () => {
        const { container } = render(<CardHorizontal surat={mockSurat} />);
        const arabicSpan = container.querySelector(
            '[style*="font-family: Uthmani"]',
        );
        expect(arabicSpan).toBeInTheDocument();
        expect(arabicSpan.textContent).toBe("الْفَاتِحَةِ");
    });
});
