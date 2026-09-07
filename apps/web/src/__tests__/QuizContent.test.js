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
        t: (key) => key,
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
        expect(await screen.findByText(mockQuestions[0].question)).toBeInTheDocument();
    });
});
