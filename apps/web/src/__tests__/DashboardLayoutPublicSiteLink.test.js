import { render, screen, fireEvent } from "@testing-library/react";
import DashboardLayout from "@/app/dashboard/layout";

jest.mock("next/navigation", () => ({
    usePathname: () => "/dashboard",
    useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("next/link", () => ({ children, href, ...p }) => (
    <a href={href} {...p}>
        {children}
    </a>
));

jest.mock("@/context/Auth", () => ({
    useAuth: () => ({
        user: { name: "Fulan", email: "fulan@example.com" },
        isAuthenticated: true,
        isLoading: false,
        logout: jest.fn(),
    }),
}));

jest.mock("@/context/Locale", () => ({
    useLocale: () => ({
        lang: "ID",
        setLang: jest.fn(),
        t: (key) =>
            ({
                "link.public_site": "Situs Publik",
                "link.dashboard": "Dashboard",
            })[key] ?? key,
    }),
}));

jest.mock("@/lib/useTheme", () => ({
    useTheme: () => ({ isDark: false, toggleTheme: jest.fn() }),
}));

jest.mock("@/components/admin/AdminMutationToast", () => () => null);

describe("DashboardLayout public site link", () => {
    test("account dropdown links back to the public homepage", () => {
        const { container } = render(<DashboardLayout>{null}</DashboardLayout>);

        const headerButtons = container.querySelectorAll("header button");
        fireEvent.click(headerButtons[headerButtons.length - 1]);

        const link = screen.getByText("Situs Publik").closest("a");
        expect(link).toHaveAttribute("href", "/");
    });
});
