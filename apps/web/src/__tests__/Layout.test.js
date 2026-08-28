import { render, screen } from "@testing-library/react";
import Layout from "@/components/Layout";

jest.mock("@/components/Navbar", () => () => (
    <nav data-testid='navbar'>Navbar</nav>
));

jest.mock("@/context/Locale", () => ({
    useLocale: () => ({ t: (k) => k, lang: "ID" }),
}));

jest.mock("@/context/Auth", () => ({
    useAuth: () => ({ isAuthenticated: false, user: null, logout: jest.fn() }),
}));

jest.mock("next/navigation", () => ({
    useRouter: () => ({ push: jest.fn() }),
    useSearchParams: () => new URLSearchParams(),
    usePathname: () => "/",
}));

jest.mock("next/link", () => ({ children, href, ...p }) => (
    <a href={href} {...p}>
        {children}
    </a>
));

jest.mock("@/lib/const", () => ({
    linksMenu: [],
    linksMenuContent: [],
}));

jest.mock("@/lib/converter", () => ({
    ConvertFLagLanguage: () => null,
}));

jest.mock("@/components/dropdown/SmallDropDown", () => () => <div />);

describe("Layout", () => {
    test("renders Navbar", () => {
        render(<Layout />);
        expect(screen.getByTestId("navbar")).toBeInTheDocument();
        expect(screen.getByText("Navbar")).toBeInTheDocument();
    });
});
