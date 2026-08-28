jest.mock("../api/client", () => ({
    deleteJson: jest.fn(),
    postJson: jest.fn(),
    putJson: jest.fn(),
    requestJson: jest.fn(),
}));

const { deleteJson, postJson, putJson, requestJson } = require("../api/client");
const {
    deleteAccount,
    getAuthSessions,
    revokeAuthSession,
    login,
    register,
    forgotPassword,
    refreshSession,
    logout,
    getMe,
    updatePassword,
    updateProfile,
} = require("../api/auth");

describe("auth api", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("login calls postJson and normalizes session", async () => {
        postJson.mockResolvedValueOnce({
            token: "abc",
            refresh_token: "def",
            user: { id: 1, name: "Test" },
        });
        const result = await login({ email: "a@b.com", password: "secret" });
        expect(postJson).toHaveBeenCalledWith("/api/v1/auth/login", {
            email: "a@b.com",
            password: "secret",
        });
        expect(result).toEqual({
            token: "abc",
            refreshToken: "def",
            user: { id: 1, name: "Test" },
        });
    });

    test("login handles missing token/user", async () => {
        postJson.mockResolvedValueOnce({});
        const result = await login({ email: "a@b.com", password: "x" });
        expect(result.token).toBeUndefined();
        expect(result.user).toBeNull();
    });

    test("register calls postJson", async () => {
        postJson.mockResolvedValueOnce({});
        await register({ name: "A", email: "a@b.com", password: "secret" });
        expect(postJson).toHaveBeenCalledWith("/api/v1/auth/register", {
            email: "a@b.com",
            name: "A",
            password: "secret",
        });
    });

    test("forgotPassword calls postJson and returns message", async () => {
        postJson.mockResolvedValueOnce({ message: "Email sent" });
        const result = await forgotPassword("a@b.com");
        expect(postJson).toHaveBeenCalledWith("/api/v1/auth/forgot-password", {
            email: "a@b.com",
        });
        expect(result).toBe("Email sent");
    });

    test("forgotPassword returns fallback message", async () => {
        postJson.mockResolvedValueOnce({});
        const result = await forgotPassword("a@b.com");
        expect(result).toBe(
            "If your email is registered, a reset link has been sent.",
        );
    });

    test("refreshSession calls postJson and normalizes", async () => {
        postJson.mockResolvedValueOnce({
            token: "new-token",
            refresh_token: "new-refresh",
            user: { id: 1 },
        });
        const result = await refreshSession("old-refresh");
        expect(postJson).toHaveBeenCalledWith("/api/v1/auth/refresh", {
            refresh_token: "old-refresh",
        });
        expect(result.token).toBe("new-token");
        expect(result.refreshToken).toBe("new-refresh");
    });

    test("logout calls postJson", async () => {
        await logout("some-token");
        expect(postJson).toHaveBeenCalledWith("/api/v1/auth/logout", {
            refresh_token: "some-token",
        });
    });

    test("getMe calls requestJson with auth", async () => {
        requestJson.mockResolvedValueOnce({ id: 1, name: "Me" });
        const result = await getMe();
        expect(requestJson).toHaveBeenCalledWith("/api/v1/auth/me", {
            auth: true,
        });
        expect(result).toEqual({ id: 1, name: "Me" });
    });

    test("getAuthSessions sends refresh token header and normalizes data array", async () => {
        requestJson.mockResolvedValueOnce({ data: [{ id: 1, current: true }] });
        const result = await getAuthSessions("refresh-token");
        expect(requestJson).toHaveBeenCalledWith("/api/v1/auth/sessions", {
            auth: true,
            headers: { "X-Refresh-Token": "refresh-token" },
        });
        expect(result).toEqual([{ id: 1, current: true }]);
    });

    test("revokeAuthSession sends refresh token header", async () => {
        await revokeAuthSession(7, "refresh-token");
        expect(deleteJson).toHaveBeenCalledWith("/api/v1/auth/sessions/7", {
            auth: true,
            headers: { "X-Refresh-Token": "refresh-token" },
        });
    });

    test("updateProfile calls putJson with preferred language", async () => {
        putJson.mockResolvedValueOnce({ id: 1, preferred_lang: "en" });
        const result = await updateProfile({ preferredLang: "en" });
        expect(putJson).toHaveBeenCalledWith(
            "/api/v1/auth/me",
            {
                preferred_lang: "en",
            },
            { auth: true },
        );
        expect(result).toEqual({ id: 1, preferred_lang: "en" });
    });

    test("updatePassword calls putJson with backend field names", async () => {
        await updatePassword({
            oldPassword: "old-pass",
            newPassword: "new-pass-123",
        });
        expect(putJson).toHaveBeenCalledWith(
            "/api/v1/auth/password",
            {
                old_password: "old-pass",
                new_password: "new-pass-123",
            },
            { auth: true },
        );
    });

    test("deleteAccount calls self-delete endpoint with auth", async () => {
        await deleteAccount();
        expect(deleteJson).toHaveBeenCalledWith("/api/v1/auth/me", {
            auth: true,
        });
    });
});
