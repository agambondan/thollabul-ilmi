import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ThemeProvider, { UseThemeContext, ThemeContext } from "@/context/Theme";

const TestConsumer = () => {
    const { theme, SetTheme } = UseThemeContext();
    return (
        <div>
            <span data-testid='theme'>{theme}</span>
            <button onClick={() => SetTheme("dark")}>Set Dark</button>
        </div>
    );
};

describe("ThemeProvider", () => {
    test("provides default theme as empty string", () => {
        render(
            <ThemeProvider>
                <TestConsumer />
            </ThemeProvider>,
        );
        expect(screen.getByTestId("theme").textContent).toBe("");
    });

    test("allows setting theme via SetTheme", async () => {
        render(
            <ThemeProvider>
                <TestConsumer />
            </ThemeProvider>,
        );
        await userEvent.click(screen.getByText("Set Dark"));
        expect(screen.getByTestId("theme").textContent).toBe("dark");
    });

    test("renders children", () => {
        render(
            <ThemeProvider>
                <p>child</p>
            </ThemeProvider>,
        );
        expect(screen.getByText("child")).toBeInTheDocument();
    });
});

describe("UseThemeContext", () => {
    test("throws when used outside ThemeProvider", () => {
        expect(() => render(<TestConsumer />)).toThrow(
            "UseThemeContext should be used within the scope of a Theme Component",
        );
    });

    test("returns context within provider", () => {
        let contextValue;
        const Capture = () => {
            contextValue = UseThemeContext();
            return null;
        };
        render(
            <ThemeProvider>
                <Capture />
            </ThemeProvider>,
        );
        expect(contextValue).toHaveProperty("theme");
        expect(contextValue).toHaveProperty("SetTheme");
    });
});
