import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LocaleProvider, useLocale } from "@/context/Locale";

// The dictionaries are code-split: Indonesian is bundled, English is fetched
// on demand, so each language is mocked as its own module.
jest.mock("@/lib/i18n/id", () => ({
    __esModule: true,
    default: { greeting: "Halo", welcome: "Selamat datang {name}" },
}));

jest.mock("@/lib/i18n/en", () => ({
    __esModule: true,
    default: { greeting: "Hello", welcome: "Welcome {name}" },
}));

const TestConsumer = () => {
    const { lang, t, setLang } = useLocale();
    return (
        <div>
            <span data-testid='lang'>{lang}</span>
            <span data-testid='greeting'>{t("greeting")}</span>
            <span data-testid='welcome'>{t("welcome", { name: "Budi" })}</span>
            <span data-testid='missing'>{t("missing.key")}</span>
            <button onClick={() => setLang("EN")}>Switch EN</button>
        </div>
    );
};

describe("LocaleProvider", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    test("defaults to ID language", () => {
        render(
            <LocaleProvider>
                <TestConsumer />
            </LocaleProvider>,
        );
        expect(screen.getByTestId("lang").textContent).toBe("ID");
    });

    test("translates with ID by default", () => {
        render(
            <LocaleProvider>
                <TestConsumer />
            </LocaleProvider>,
        );
        expect(screen.getByTestId("greeting").textContent).toBe("Halo");
    });

    test("translates with interpolation", () => {
        render(
            <LocaleProvider>
                <TestConsumer />
            </LocaleProvider>,
        );
        expect(screen.getByTestId("welcome").textContent).toBe(
            "Selamat datang Budi",
        );
    });

    test("returns undefined for missing translation without fallback", () => {
        render(
            <LocaleProvider>
                <TestConsumer />
            </LocaleProvider>,
        );
        expect(screen.getByTestId("missing").textContent).toBe("");
    });

    test("changes language via setLang", async () => {
        render(
            <LocaleProvider>
                <TestConsumer />
            </LocaleProvider>,
        );
        await userEvent.click(screen.getByText("Switch EN"));
        expect(screen.getByTestId("lang").textContent).toBe("EN");
        // The English chunk resolves asynchronously.
        await waitFor(() =>
            expect(screen.getByTestId("greeting").textContent).toBe("Hello"),
        );
    });

    test("persists language to localStorage", async () => {
        render(
            <LocaleProvider>
                <TestConsumer />
            </LocaleProvider>,
        );
        await userEvent.click(screen.getByText("Switch EN"));
        expect(localStorage.getItem("lang")).toBe("EN");
    });

    test("restores saved language from localStorage", async () => {
        localStorage.setItem("lang", "EN");
        render(
            <LocaleProvider>
                <TestConsumer />
            </LocaleProvider>,
        );
        await waitFor(() =>
            expect(screen.getByTestId("lang").textContent).toBe("EN"),
        );
    });

    test("ignores invalid localStorage lang value", () => {
        localStorage.setItem("lang", "FR");
        render(
            <LocaleProvider>
                <TestConsumer />
            </LocaleProvider>,
        );
        expect(screen.getByTestId("lang").textContent).toBe("ID");
    });
});
