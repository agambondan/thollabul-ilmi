import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const mockPush = jest.fn();
const mockList = jest.fn();
const mockAdd = jest.fn();
const mockRemove = jest.fn();
const mockUseAuth = { isAuthenticated: false, user: null };

jest.mock("@/context/Locale", () => ({
    useLocale: () => ({ t: (k) => k, lang: "ID" }),
}));

jest.mock("@/context/Auth", () => ({
    useAuth: () => mockUseAuth,
}));

jest.mock("next/navigation", () => ({
    useRouter: () => ({ push: mockPush }),
    useSearchParams: () => new URLSearchParams(),
    usePathname: () => "/",
}));

jest.mock("@/lib/api", () => ({
    bookmarkApi: {
        list: (...a) => mockList(...a),
        add: (...a) => mockAdd(...a),
        remove: (...a) => mockRemove(...a),
        update: jest.fn(),
    },
}));

jest.mock("@/lib/bookmarkLabels", () => ({
    BOOKMARK_COLORS: [
        {
            id: "emerald",
            tw: "bg-emerald-500",
            label_id: "Hijau",
            label_en: "Green",
        },
    ],
    colorById: (id) => ({
        id,
        tw: "bg-emerald-500",
        label_id: "Hijau",
        label_en: "Green",
    }),
    getBookmarkMeta: () => null,
    setBookmarkMeta: jest.fn(),
    clearBookmarkMeta: jest.fn(),
}));

const BookmarkButton = require("@/components/BookmarkButton").default;

describe("BookmarkButton", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        window.history.pushState({}, "", "/");
        mockList.mockResolvedValue({ json: async () => ({ items: [] }) });
        mockAdd.mockResolvedValue({
            ok: true,
            json: async () => ({ id: "bm1" }),
        });
        mockRemove.mockResolvedValue({ ok: true });
    });

    test("renders bookmark icon when not bookmarked", () => {
        render(<BookmarkButton refType='ayah' refId='1' />);
        expect(screen.getByTitle("bookmarks.save")).toBeInTheDocument();
    });

    test("redirects to login when guest clicks bookmark", () => {
        render(<BookmarkButton refType='ayah' refId='1' />);
        fireEvent.click(screen.getByTitle("bookmarks.save"));
        expect(mockPush).toHaveBeenCalledWith("/auth/login?next=%2F");
    });

    test("toggles bookmark when authenticated", async () => {
        mockUseAuth.isAuthenticated = true;
        mockUseAuth.user = { name: "Fulan" };
        render(<BookmarkButton refType='ayah' refId='1' />);
        fireEvent.click(screen.getByTitle("bookmarks.save"));
        await waitFor(() => {
            expect(screen.getByTitle("bookmarks.remove")).toBeInTheDocument();
        });
        mockUseAuth.isAuthenticated = false;
        mockUseAuth.user = null;
    });

    test("normalizes wrapped bookmark response from API", async () => {
        mockUseAuth.isAuthenticated = true;
        mockUseAuth.user = { name: "Fulan" };
        mockAdd.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: { id: "wrapped-bm" } }),
        });
        render(<BookmarkButton refType='ayah' refId='1' />);
        fireEvent.click(screen.getByTitle("bookmarks.save"));

        await waitFor(() => {
            expect(screen.getByTitle("bookmarks.remove")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByTitle("bookmarks.remove"));
        fireEvent.click(screen.getByText("bookmarks.remove"));

        await waitFor(() => {
            expect(mockRemove).toHaveBeenCalledWith("wrapped-bm");
        });
        mockUseAuth.isAuthenticated = false;
        mockUseAuth.user = null;
    });

    test("shows loading state during toggle", () => {
        mockUseAuth.isAuthenticated = true;
        mockUseAuth.user = { name: "Fulan" };
        mockAdd.mockImplementation(() => new Promise(() => {}));
        render(<BookmarkButton refType='ayah' refId='1' />);
        fireEvent.click(screen.getByTitle("bookmarks.save"));
        expect(screen.getByRole("button")).toBeDisabled();
        mockUseAuth.isAuthenticated = false;
        mockUseAuth.user = null;
    });
});
