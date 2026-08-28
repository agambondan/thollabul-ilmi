import { render, screen, waitFor } from "@testing-library/react";

const mockDaily = jest.fn();

jest.mock("@/lib/api", () => ({
    hadithApi: { daily: (...a) => mockDaily(...a) },
}));

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

const DailyHadithWidget = require("@/components/DailyHadithWidget").default;

const mockHadith = {
    number: 1,
    translation: {
        ar: "إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ",
        id: "Amalan itu tergantung niatnya",
    },
    book: { slug: "bukhari", translation: { id: "Shahih Bukhari" } },
};

describe("DailyHadithWidget", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("shows loading state initially", () => {
        mockDaily.mockReturnValue(new Promise(() => {}));
        const { container } = render(<DailyHadithWidget />);
        expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
    });

    test("renders hadith after fetch", async () => {
        mockDaily.mockResolvedValue({
            ok: true,
            json: async () => ({ data: mockHadith }),
        });
        render(<DailyHadithWidget />);
        await waitFor(() => {
            expect(screen.getByText("hadith.daily_label")).toBeInTheDocument();
        });
        expect(
            screen.getByText(/Amalan itu tergantung niatnya/),
        ).toBeInTheDocument();
    });

    test("renders book name and number", async () => {
        mockDaily.mockResolvedValue({
            ok: true,
            json: async () => ({ data: mockHadith }),
        });
        render(<DailyHadithWidget />);
        await waitFor(() => {
            expect(screen.getByText(/Shahih Bukhari/)).toBeInTheDocument();
        });
    });

    test("returns null on error", async () => {
        mockDaily.mockRejectedValue(new Error("fail"));
        const { container } = render(<DailyHadithWidget />);
        await waitFor(() => {
            expect(container.innerHTML).toBe("");
        });
    });
});
