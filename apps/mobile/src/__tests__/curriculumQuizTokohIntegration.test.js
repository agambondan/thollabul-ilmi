import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { TokohTarikhContent } from "../screens/TokohTarikhContent";
import { WebAppLessonsRoute } from "../screens/explore/WebAppLessonsRoute";
import { WebAppQuizRoute } from "../screens/explore/WebAppQuizRoute";
import { staticLessons } from "../data/staticLessons";
import { staticQuizQuestions } from "../data/staticQuiz";
import { staticTokohTarikh } from "../data/staticTokohTarikh";

jest.mock("../api/client", () => ({
    requestJson: jest.fn(),
    putJson: jest.fn(),
}));

jest.mock("../hooks/useLayoutModePreference", () => ({
    useLayoutModePreference: jest.fn(() => ({
        isDarkTheme: false,
        isWebAppLayout: true,
    })),
}));

jest.mock("../i18n/MobileLocaleProvider", () => ({
    useMobileLocale: () => ({
        t: (key, params) => {
            if (key === "explore.quiz.progressLabel")
                return `Pertanyaan ${params?.current} / ${params?.total}`;
            if (key === "explore.quiz.scoreCorrect")
                return `Skor: ${params?.score}`;
            if (key === "explore.quiz.title") return "Quiz Islami";
            return key;
        },
    }),
}));

const client = require("../api/client");

describe("Curriculum, Quiz, and Tokoh Tarikh Mobile Integration", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("static dataset contains all 12 modules including 4 new modules", () => {
        expect(staticLessons).toHaveLength(12);
        const slugs = staticLessons.map((m) => m.slug);
        expect(slugs).toContain("tahsin-tajwid");
        expect(slugs).toContain("aqidah-salaf");
        expect(slugs).toContain("sholat-sifat-nabi");
        expect(slugs).toContain("dzikir-doa-harian");

        const tahsin = staticLessons.find((m) => m.slug === "tahsin-tajwid");
        expect(tahsin.category).toBe("Al-Quran");
        expect(tahsin.steps.length).toBeGreaterThanOrEqual(5);

        const aqidah = staticLessons.find((m) => m.slug === "aqidah-salaf");
        expect(aqidah.category).toBe("Aqidah");
        expect(aqidah.steps.length).toBeGreaterThanOrEqual(4);

        const sholat = staticLessons.find((m) => m.slug === "sholat-sifat-nabi");
        expect(sholat.category).toBe("Fiqh Ibadah");
        expect(sholat.steps.length).toBeGreaterThanOrEqual(5);

        const dzikir = staticLessons.find((m) => m.slug === "dzikir-doa-harian");
        expect(dzikir.category).toBe("Ibadah Harian");
        expect(dzikir.steps.length).toBeGreaterThanOrEqual(5);
    });

    test("static dataset contains 100 quiz questions and 20 historical figures", () => {
        expect(staticQuizQuestions).toHaveLength(100);
        expect(staticTokohTarikh).toHaveLength(20);
    });

    test("renders WebAppLessonsRoute with category filter and step transitions", async () => {
        client.requestJson.mockResolvedValueOnce({ items: [] });
        const { getByText, getAllByText } = render(
            <WebAppLessonsRoute feature={{ key: "lessons" }} />,
        );

        await waitFor(() => {
            expect(getAllByText("Tata Cara Wudhu").length).toBeGreaterThanOrEqual(1);
        });

        expect(getAllByText("Al-Quran").length).toBeGreaterThanOrEqual(1);
        expect(getAllByText("Fiqh Ibadah").length).toBeGreaterThanOrEqual(1);
        expect(getAllByText("Aqidah").length).toBeGreaterThanOrEqual(1);

        fireEvent.press(getAllByText("Al-Quran")[0]);
        await waitFor(() => {
            expect(getAllByText("Tahsin & Tajwid Dasar").length).toBeGreaterThanOrEqual(1);
        });

        fireEvent.press(getAllByText("Tahsin & Tajwid Dasar")[0]);
        await waitFor(() => {
            expect(getAllByText(/Makharijul Huruf/i).length).toBeGreaterThanOrEqual(1);
        });
    });

    test("renders WebAppQuizRoute with 100 questions pool and category filtering", async () => {
        const setAnswers = jest.fn();
        const { getByText, getAllByTestId } = render(
            <WebAppQuizRoute
                activeFeature={{ key: "quiz" }}
                answers={{}}
                items={[]}
                loading={false}
                setAnswers={setAnswers}
            />,
        );

        expect(getByText("Quiz Islami")).toBeTruthy();
        expect(getByText("Semua")).toBeTruthy();
        expect(getByText("Hadits")).toBeTruthy();
        expect(getByText("Fiqh")).toBeTruthy();

        const options = getAllByTestId("web-app-quiz-option");
        expect(options.length).toBeGreaterThanOrEqual(2);

        fireEvent.press(options[0]);
        expect(setAnswers).toHaveBeenCalled();
    });

    test("TokohTarikhContent falls back to 20 static figures on network failure", async () => {
        client.requestJson.mockRejectedValueOnce(new Error("Network offline"));
        const { getByText, getAllByTestId } = render(<TokohTarikhContent />);

        await waitFor(() => {
            expect(getByText("Abu Bakar Ash-Shiddiq")).toBeTruthy();
        });

        expect(getByText("Umar bin Khattab")).toBeTruthy();
        expect(getByText("20 tokoh")).toBeTruthy();
        expect(getAllByTestId("tokoh-web-app-card").length).toBe(20);
    });
});
