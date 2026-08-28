import { renderHook } from "@testing-library/react";
import { useRequireAuth } from "@/lib/useRequireAuth";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
    useRouter: () => ({ push: mockPush }),
}));

const mockUseAuth = jest.fn();

jest.mock("@/context/Auth", () => ({
    useAuth: () => mockUseAuth(),
}));

describe("useRequireAuth", () => {
    beforeEach(() => {
        mockPush.mockClear();
        mockUseAuth.mockClear();
        window.history.pushState({}, "", "/dashboard/quran?surah=1");
    });

    test("redirects to login when not authenticated and not loading", () => {
        mockUseAuth.mockReturnValue({
            isLoading: false,
            isAuthenticated: false,
            token: null,
            user: null,
        });

        renderHook(() => useRequireAuth());
        expect(mockPush).toHaveBeenCalledWith(
            "/auth/login?next=%2Fdashboard%2Fquran%3Fsurah%3D1",
        );
    });

    test("does not redirect when loading", () => {
        mockUseAuth.mockReturnValue({
            isLoading: true,
            isAuthenticated: false,
            token: null,
            user: null,
        });

        renderHook(() => useRequireAuth());
        expect(mockPush).not.toHaveBeenCalled();
    });

    test("does not redirect when authenticated", () => {
        mockUseAuth.mockReturnValue({
            isLoading: false,
            isAuthenticated: true,
            token: "some-token",
            user: { id: 1 },
        });

        renderHook(() => useRequireAuth());
        expect(mockPush).not.toHaveBeenCalled();
    });
});
