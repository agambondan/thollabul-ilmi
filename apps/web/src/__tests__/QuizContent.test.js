import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import QuizContent from "@/components/QuizContent";

const mockSession = jest.fn();
const mockSubmit = jest.fn();

jest.mock("@/lib/api", () => ({
    quizApi: {
        session: (...args) => mockSession(...args),
        submit: (...args) => mockSubmit(...args),
    },
}));

jest.mock("@/context/Locale", () => ({
    useLocale: () => ({
        t: (key, fallback) => fallback ?? key,
        lang: "ID",
    }),
}));

jest.mock("@/context/Auth", () => ({
    useAuth: () => ({ isAuthenticated: false }),
}));

const mockQuestions = [
    {
        id: 1,
        question: "Berapa jumlah ayat surat Al-Fatihah?",
        options: ["5", "6", "7", "8"],
        answer: 2,
        correct_answer: "7",
        explanation: "Surat Al-Fatihah terdiri dari 7 ayat.",
        category: "hafalan",
    },
];

describe("QuizContent", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
        mockSession.mockResolvedValue({
            ok: true,
            json: async () => ({ items: mockQuestions }),
        });
    });

    test("starts quiz with selected category", async () => {
        render(<QuizContent />);

        fireEvent.click(screen.getByText(/Sambung Ayat \/ Quran/i));
        fireEvent.click(screen.getByRole("button", { name: "quiz.start" }));

        await waitFor(() => {
            expect(mockSession).toHaveBeenCalledWith({
                count: 10,
                type: "hafalan",
                lang: "ID",
            });
        });
        expect(
            await screen.findByText(mockQuestions[0].question),
        ).toBeInTheDocument();
    });

    test("shows share score CTA and leaderboard link on quiz finish", async () => {
        Object.assign(navigator, {
            clipboard: {
                writeText: jest.fn().mockResolvedValue(undefined),
            },
        });

        render(<QuizContent />);

        fireEvent.click(screen.getByRole("button", { name: "quiz.start" }));

        await screen.findByText(mockQuestions[0].question);

        fireEvent.click(screen.getByText("7"));
        fireEvent.click(screen.getByRole("button", { name: "quiz.see_result" }));

        expect(await screen.findByText("quiz.finished")).toBeInTheDocument();
        const shareBtn = screen.getByRole("button", { name: "quiz.share_score" });
        expect(shareBtn).toBeInTheDocument();
        fireEvent.click(shareBtn);
        await waitFor(() => {
            expect(navigator.clipboard.writeText).toHaveBeenCalled();
            expect(screen.getByRole("button", { name: "quiz.copied_to_clipboard" })).toBeInTheDocument();
        });

        const leaderboardLink = screen.getByRole("link", { name: "quiz.view_leaderboard" });
        expect(leaderboardLink).toHaveAttribute("href", "/leaderboard");
    });
});