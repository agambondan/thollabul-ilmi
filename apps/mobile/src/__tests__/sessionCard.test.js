jest.mock("../context/SessionContext", () => ({
    useSession: jest.fn(),
}));

jest.mock("../context/FeedbackContext", () => ({
    useFeedback: jest.fn(),
}));

jest.mock("../api/auth", () => ({
    forgotPassword: jest.fn(),
    register: jest.fn(),
}));

import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import { SessionCard } from "../components/SessionCard";
import { flushAsyncWork } from "../test-utils/async";

const { useSession } = require("../context/SessionContext");
const { useFeedback } = require("../context/FeedbackContext");
const { forgotPassword, register } = require("../api/auth");

const mockFeedback = {
    showError: jest.fn(),
    showInfo: jest.fn(),
    showSuccess: jest.fn(),
};

const defaultSession = {
    error: "",
    loading: false,
    user: null,
    signIn: jest.fn(),
    signOut: jest.fn(),
};

beforeEach(() => {
    jest.clearAllMocks();
    useSession.mockReturnValue(defaultSession);
    useFeedback.mockReturnValue(mockFeedback);
});

describe("SessionCard", () => {
    test("renders email and password inputs when no user", () => {
        const { getByPlaceholderText } = render(<SessionCard />);
        expect(getByPlaceholderText("Email")).toBeTruthy();
        expect(getByPlaceholderText("Kata sandi")).toBeTruthy();
    });

    test("calls signIn on submit", async () => {
        const signIn = jest.fn().mockResolvedValue({});
        useSession.mockReturnValue({ ...defaultSession, signIn });
        const { getAllByText } = render(<SessionCard />);
        await act(async () => {
            fireEvent.press(getAllByText("Masuk")[1]);
        });
        await flushAsyncWork();
        expect(signIn).toHaveBeenCalledTimes(1);
        expect(signIn).toHaveBeenCalledWith({
            email: expect.any(String),
            password: expect.any(String),
        });
    });

    test("toggles password visibility", () => {
        const { getByLabelText } = render(<SessionCard />);
        fireEvent.press(getByLabelText("Lihat kata sandi"));
    });

    test("switches to register mode", () => {
        const { getByText, getByPlaceholderText } = render(<SessionCard />);
        fireEvent.press(getByText("Daftar"));
        expect(getByText("Daftar Akun")).toBeTruthy();
        expect(getByPlaceholderText("Nama")).toBeTruthy();
        expect(
            getByPlaceholderText("Kata sandi (min. 8 karakter)"),
        ).toBeTruthy();
    });

    test("switches to forgot mode", () => {
        const { getByText, queryByPlaceholderText, getAllByText } = render(
            <SessionCard />,
        );
        fireEvent.press(getByText("Lupa Sandi"));
        expect(getAllByText("Lupa Sandi").length).toBeGreaterThanOrEqual(1);
        expect(queryByPlaceholderText("Kata sandi")).toBeNull();
    });

    test("submitRegister calls register API", async () => {
        register.mockResolvedValue({});
        useSession.mockReturnValue({ ...defaultSession, signIn: jest.fn() });
        const { getByText, getByPlaceholderText, findByText } = render(
            <SessionCard />,
        );
        fireEvent.press(getByText("Daftar"));
        const nameInput = getByPlaceholderText("Nama");
        const emailInput = getByPlaceholderText("Email");
        const passwordInput = getByPlaceholderText(
            "Kata sandi (min. 8 karakter)",
        );
        fireEvent.changeText(nameInput, "Test User");
        fireEvent.changeText(emailInput, "test@test.com");
        fireEvent.changeText(passwordInput, "password123");
        await act(async () => {
            fireEvent.press(getByText("Buat Akun"));
        });
        await findByText("Akun berhasil dibuat. Silakan masuk.");
        expect(register).toHaveBeenCalledWith({
            email: "test@test.com",
            name: "Test User",
            password: "password123",
        });
    });

    test("forgotPassword calls API", async () => {
        forgotPassword.mockResolvedValue("Email terkirim");
        const { getByText, getByPlaceholderText } = render(<SessionCard />);
        fireEvent.press(getByText("Lupa Sandi"));
        const emailInput = getByPlaceholderText("Email");
        fireEvent.changeText(emailInput, "test@test.com");
        await act(async () => {
            fireEvent.press(getByText("Kirim Tautan Reset"));
        });
        await waitFor(() => {
            expect(getByText("Email terkirim")).toBeTruthy();
        });
        expect(forgotPassword).toHaveBeenCalledWith("test@test.com");
    });

    test("renders user info when logged in", () => {
        useSession.mockReturnValue({
            ...defaultSession,
            user: { name: "Test User", email: "test@test.com" },
        });
        const { getByText } = render(<SessionCard />);
        expect(getByText("Sudah Masuk")).toBeTruthy();
        expect(getByText("Test User")).toBeTruthy();
        expect(getByText("test@test.com")).toBeTruthy();
    });

    test("calls signOut on keluar button", () => {
        const signOut = jest.fn();
        useSession.mockReturnValue({
            ...defaultSession,
            user: { name: "Test", email: "test@test.com" },
            signOut,
        });
        const { getByText } = render(<SessionCard />);
        fireEvent.press(getByText("Keluar"));
        expect(signOut).toHaveBeenCalledTimes(1);
    });
});
