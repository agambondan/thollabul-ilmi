import React from "react";
import { render, act, fireEvent, waitFor } from "@testing-library/react-native";
import { Text, View } from "react-native";

jest.mock("lucide-react-native", () => ({
    CheckCircle2: ({ color, size, strokeWidth }) => null,
    Info: ({ color, size, strokeWidth }) => null,
    X: ({ color, size, strokeWidth }) => null,
    XCircle: ({ color, size, strokeWidth }) => null,
}));

jest.mock("../utils/haptics", () => ({
    hapticSuccess: jest.fn(),
    hapticError: jest.fn(),
    hapticWarning: jest.fn(),
}));

import { FeedbackProvider, useFeedback } from "../context/FeedbackContext";

function TestConsumer() {
    const fb = useFeedback();
    return (
        <View>
            <Text
                testID='show-success'
                onPress={() => fb.showSuccess("Saved!")}
            >
                ShowSuccess
            </Text>
            <Text testID='show-error' onPress={() => fb.showError("Failed!")}>
                ShowError
            </Text>
            <Text testID='show-info' onPress={() => fb.showInfo("Hey!")}>
                ShowInfo
            </Text>
        </View>
    );
}

afterEach(() => {
    jest.clearAllMocks();
});

describe("FeedbackProvider", () => {
    test("wraps children", () => {
        const { getByText } = render(
            <FeedbackProvider>
                <Text>hello</Text>
            </FeedbackProvider>,
        );
        expect(getByText("hello")).toBeTruthy();
    });

    test("showSuccess renders a toast with the message", () => {
        const { getByText } = render(
            <FeedbackProvider>
                <TestConsumer />
            </FeedbackProvider>,
        );

        fireEvent.press(getByText("ShowSuccess"));
        expect(getByText("Saved!")).toBeTruthy();
    });

    test("showError renders a toast with the message", () => {
        const { getByText } = render(
            <FeedbackProvider>
                <TestConsumer />
            </FeedbackProvider>,
        );

        fireEvent.press(getByText("ShowError"));
        expect(getByText("Failed!")).toBeTruthy();
    });

    test("showInfo renders a toast with the message", () => {
        const { getByText } = render(
            <FeedbackProvider>
                <TestConsumer />
            </FeedbackProvider>,
        );

        fireEvent.press(getByText("ShowInfo"));
        expect(getByText("Hey!")).toBeTruthy();
    });

    test("toast auto-dismisses after timeout", async () => {
        jest.useFakeTimers();

        const { getByText, queryByText } = render(
            <FeedbackProvider>
                <TestConsumer />
            </FeedbackProvider>,
        );

        fireEvent.press(getByText("ShowSuccess"));
        expect(getByText("Saved!")).toBeTruthy();

        act(() => {
            jest.advanceTimersByTime(3300);
        });

        await waitFor(() => {
            expect(queryByText("Saved!")).toBeNull();
        });

        jest.useRealTimers();
    });

    test("dismiss button clears the toast", () => {
        const { getByText, getByLabelText, queryByText } = render(
            <FeedbackProvider>
                <TestConsumer />
            </FeedbackProvider>,
        );

        fireEvent.press(getByText("ShowSuccess"));
        expect(getByText("Saved!")).toBeTruthy();

        fireEvent.press(getByLabelText("Tutup notifikasi"));

        expect(queryByText("Saved!")).toBeNull();
    });

    test("useFeedback returns showError, showInfo, showSuccess", () => {
        let fb;
        function Capture() {
            fb = useFeedback();
            return null;
        }

        render(
            <FeedbackProvider>
                <Capture />
            </FeedbackProvider>,
        );

        expect(fb).toBeDefined();
        expect(typeof fb.showError).toBe("function");
        expect(typeof fb.showInfo).toBe("function");
        expect(typeof fb.showSuccess).toBe("function");
    });
});
