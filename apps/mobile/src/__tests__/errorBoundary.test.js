import { fireEvent, render } from "@testing-library/react-native";
import { Text, View } from "react-native";
import { ErrorBoundary } from "../components/ErrorBoundary";

function ProblemChild({ shouldThrow = false }) {
    if (shouldThrow) {
        throw new Error("Render error occurred");
    }
    return <Text testID='good-child'>All is well</Text>;
}

describe("ErrorBoundary", () => {
    const originalConsoleError = console.error;
    beforeAll(() => {
        console.error = jest.fn();
    });
    afterAll(() => {
        console.error = originalConsoleError;
    });

    test("renders children when no error occurs", () => {
        const { getByTestId } = render(
            <ErrorBoundary>
                <ProblemChild shouldThrow={false} />
            </ErrorBoundary>,
        );
        expect(getByTestId("good-child")).toBeTruthy();
    });

    test("renders fallback UI when child throws error", () => {
        const onError = jest.fn();
        const { getByTestId, getByText } = render(
            <ErrorBoundary onError={onError}>
                <ProblemChild shouldThrow={true} />
            </ErrorBoundary>,
        );

        expect(getByTestId("error-boundary-fallback")).toBeTruthy();
        expect(getByText("Terjadi Kesalahan")).toBeTruthy();
        expect(getByText("Render error occurred")).toBeTruthy();
        expect(onError).toHaveBeenCalled();
    });

    test("allows retry via reset button", () => {
        const onReset = jest.fn();
        const { getByTestId } = render(
            <ErrorBoundary onReset={onReset}>
                <ProblemChild shouldThrow={true} />
            </ErrorBoundary>,
        );

        fireEvent.press(getByTestId("error-boundary-retry"));
        expect(onReset).toHaveBeenCalledTimes(1);
    });
});
