import { render, screen, fireEvent } from "@testing-library/react";
import { Navbar } from "@/components/Navbar";

const mockPush = jest.fn();
const mockLogout = jest.fn();
const mockSetLang = jest.fn();

const mockUseAuth = { isAuthenticated: false, user: null, logout: mockLogout };

jest.mock("@/context/Locale", () => ({
    useLocale: () => ({ t: (k) => k, lang: "ID", setLang: mockSetLang }),
}));

jest.mock("@/context/Auth", () => ({
    useAuth: () => mockUseAuth,
}));

jest.mock("next/navigation", () => ({
    useRouter: () => ({ push: mockPush }),
    useSearchParams: () => new URLSearchParams(),
    usePathname: () => "/",
}));

jest.mock("next/link", () => ({ children, href, ...p }) => (
    <a href={href} {...p}>
        {children}
    </a>
));

jest.mock("@/lib/const", () => ({
    linksMenu: [
        { label: "Quran", labelKey: "link.quran", href: "/quran", icon: "📖" },
        {
            label: "Hadith",
            labelKey: "link.hadith",
            href: "/hadith",
            icon: "📚",
        },
    ],
    linksMenuContent: [
        { label: "Doa", labelKey: "link.doa", href: "/doa", icon: "🤲" },
    ],
}));

jest.mock("@/lib/converter", () => ({
    ConvertFLagLanguage: (l) => (l === "ID" ? "🇮🇩" : "🇬🇧"),
}));

jest.mock(
    "@/components/dropdown/SmallDropDown",
    () =>
        ({ children, toggleSmallDropdown, isSmallDropdownOpen }) => (
            <div data-testid='small-dropdown' data-open={isSmallDropdownOpen}>
                <button onClick={toggleSmallDropdown}>toggle</button>
                {children}
            </div>
        ),
);

beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
    jest.clearAllMocks();
});

describe("Navbar", () => {
    test("renders branding", () => {
        render(<Navbar />);
        expect(screen.getByText("Thullaabul 'Ilmi")).toBeInTheDocument();
        expect(screen.getByText("طُلَّابُ الْعِلْمِ")).toBeInTheDocument();
    });

    test("renders navigation links from linksMenu", () => {
        render(<Navbar />);
        expect(screen.getByText("link.quran")).toBeInTheDocument();
        expect(screen.getByText("link.hadith")).toBeInTheDocument();
    });

    test("renders search link", () => {
        render(<Navbar />);
        const searchLinks = screen.getAllByText("nav.search");
        expect(searchLinks.length).toBeGreaterThanOrEqual(1);
    });

    test("renders theme toggle button", () => {
        render(<Navbar />);
        const themeButtons = screen.getAllByText("nav.dark");
        expect(themeButtons.length).toBeGreaterThanOrEqual(1);
    });

    test("theme toggle switches dark mode", () => {
        render(<Navbar />);
        const buttons = screen.getAllByText("nav.dark");
        fireEvent.click(buttons[0]);
        expect(localStorage.getItem("theme")).toBe("dark");
    });

    test("renders login link when not authenticated", () => {
        render(<Navbar />);
        const loginLinks = screen.getAllByText("nav.login");
        expect(loginLinks.length).toBeGreaterThanOrEqual(1);
    });

    test("mobile menu toggle opens and closes", () => {
        render(<Navbar />);
        const toggleText = screen.getByText("nav.open_menu");
        const toggleBtn = toggleText.closest("button");
        fireEvent.click(toggleBtn);
        expect(screen.getByText("nav.menu")).toBeInTheDocument();
        expect(screen.getByText("nav.close_menu")).toBeInTheDocument();
    });

    test("renders authenticated profile menu", () => {
        mockUseAuth.isAuthenticated = true;
        mockUseAuth.user = { name: "Fulan", role: "user" };
        const { container } = render(<Navbar />);
        expect(container.querySelector('a[href="/dashboard"]')).toBeTruthy();
        mockUseAuth.isAuthenticated = false;
        mockUseAuth.user = null;
    });
});
