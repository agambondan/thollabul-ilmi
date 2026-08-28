import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const mockPush = jest.fn();
const mockList = jest.fn();
const mockCreate = jest.fn();
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
    notesApi: {
        list: (...a) => mockList(...a),
        create: (...a) => mockCreate(...a),
        update: jest.fn(),
        delete: jest.fn(),
    },
}));

const NoteButton = require("@/components/NoteButton").default;

describe("NoteButton", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        window.history.pushState({}, "", "/");
        mockList.mockResolvedValue({ json: async () => [] });
        mockCreate.mockResolvedValue({
            ok: true,
            json: async () => ({ id: "note1", content: "test" }),
        });
    });

    test("renders add note button when no note exists", () => {
        render(<NoteButton refType='ayah' refId='1' />);
        expect(screen.getByTitle("notes.add")).toBeInTheDocument();
    });

    test("redirects to login when guest clicks", () => {
        render(<NoteButton refType='ayah' refId='1' />);
        fireEvent.click(screen.getByTitle("notes.add"));
        expect(mockPush).toHaveBeenCalledWith("/auth/login?next=%2F");
    });

    test("opens modal when authenticated", async () => {
        mockUseAuth.isAuthenticated = true;
        mockUseAuth.user = { name: "Fulan" };
        render(<NoteButton refType='ayah' refId='1' />);
        fireEvent.click(screen.getByTitle("notes.add"));
        await waitFor(() => {
            expect(
                screen.getByPlaceholderText("notes.content_placeholder"),
            ).toBeInTheDocument();
        });
        mockUseAuth.isAuthenticated = false;
        mockUseAuth.user = null;
    });
});
