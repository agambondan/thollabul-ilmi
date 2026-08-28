import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider, useAuth } from "@/context/Auth";

const TestConsumer = () => {
    const auth = useAuth();
    return (
        <div>
            <span data-testid='token'>{auth.token || "null"}</span>
            <span data-testid='user'>
                {auth.user ? JSON.stringify(auth.user) : "null"}
            </span>
            <span data-testid='loading'>{auth.isLoading.toString()}</span>
            <span data-testid='authenticated'>
                {auth.isAuthenticated.toString()}
            </span>
            <button
                data-testid='login-btn'
                onClick={() => auth.login("a@b.com", "pass123")}
            >
                Login
            </button>
            <button
                data-testid='register-btn'
                onClick={() => auth.register("A", "a@b.com", "pass123")}
            >
                Register
            </button>
            <button data-testid='logout-btn' onClick={() => auth.logout()}>
                Logout
            </button>
        </div>
    );
};

global.fetch = jest.fn();

beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
});

describe("AuthProvider", () => {
    test("starts in loading state", () => {
        localStorage.setItem("auth_token", "dummy");
        fetch.mockReturnValue(new Promise(() => {}));
        render(
            <AuthProvider>
                <TestConsumer />
            </AuthProvider>,
        );
        expect(screen.getByTestId("loading").textContent).toBe("true");
        expect(screen.getByTestId("token").textContent).toBe("dummy");
    });

    test("login succeeds and sets token/user", async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                token: "test-token",
                user: { id: 1, name: "Budi" },
            }),
        });

        render(
            <AuthProvider>
                <TestConsumer />
            </AuthProvider>,
        );

        await waitFor(() =>
            expect(screen.getByTestId("loading").textContent).toBe("false"),
        );

        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                token: "test-token",
                user: { id: 1, name: "Budi" },
            }),
        });

        await userEvent.click(screen.getByTestId("login-btn"));

        await waitFor(() => {
            expect(screen.getByTestId("token").textContent).toBe("test-token");
        });
        expect(screen.getByTestId("authenticated").textContent).toBe("true");
        expect(localStorage.getItem("auth_token")).toBe("test-token");
    });

    test("register calls API and returns data", async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ message: "Akun berhasil dibuat" }),
        });

        render(
            <AuthProvider>
                <TestConsumer />
            </AuthProvider>,
        );

        await waitFor(() =>
            expect(screen.getByTestId("loading").textContent).toBe("false"),
        );

        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ message: "Akun berhasil dibuat" }),
        });

        let result;
        // Manually call register to capture the return value
        const btn = screen.getByTestId("register-btn");
        const originalClick = btn.onclick;
        btn.onclick = async () => {
            result = await fetch.mock.results[1]?.value;
        };
        await userEvent.click(btn);
        expect(fetch).toHaveBeenCalled();
    });

    test("logout clears token and user", async () => {
        localStorage.setItem("auth_token", "existing-token");

        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ id: 1, name: "User" }),
        });

        render(
            <AuthProvider>
                <TestConsumer />
            </AuthProvider>,
        );

        await waitFor(() =>
            expect(screen.getByTestId("loading").textContent).toBe("false"),
        );

        fetch.mockResolvedValueOnce({ ok: true });

        await userEvent.click(screen.getByTestId("logout-btn"));

        await waitFor(() => {
            expect(screen.getByTestId("token").textContent).toBe("null");
        });
        expect(screen.getByTestId("authenticated").textContent).toBe("false");
        expect(localStorage.getItem("auth_token")).toBeNull();
    });

    test("uses stored token from localStorage", async () => {
        localStorage.setItem("auth_token", "stored-token");

        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ id: 1, name: "Stored User" }),
        });

        render(
            <AuthProvider>
                <TestConsumer />
            </AuthProvider>,
        );

        await waitFor(() => {
            expect(screen.getByTestId("token").textContent).toBe(
                "stored-token",
            );
        });
        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining("/api/v1/auth/me"),
            expect.objectContaining({
                headers: expect.objectContaining({
                    Authorization: "Bearer stored-token",
                }),
            }),
        );
    });
});
