import { render, screen, fireEvent } from "@testing-library/react";
import Sidebar from "@/components/Sidebar";

const mockUseAuth = { isAuthenticated: false, user: null };

jest.mock("@/context/Locale", () => ({
    useLocale: () => ({ t: (k) => k, lang: "ID" }),
}));

jest.mock("@/context/Auth", () => ({
    useAuth: () => mockUseAuth,
}));

jest.mock("next/navigation", () => ({
    usePathname: () => "/quran",
}));

jest.mock("next/link", () => ({ children, href, ...p }) => (
    <a href={href} {...p}>
        {children}
    </a>
));

describe("Sidebar", () => {
    test("renders sidebar branding", () => {
        render(<Sidebar />);
        expect(screen.getByText("Thullaabul Ilmi")).toBeInTheDocument();
    });

    test("renders group titles", () => {
        render(<Sidebar />);
        expect(screen.getByText("sidebar.main_reading")).toBeInTheDocument();
        expect(screen.getByText("sidebar.islamic_content")).toBeInTheDocument();
        expect(screen.getByText("sidebar.tools")).toBeInTheDocument();
    });

    test("does not render auth-gated groups when not authenticated", () => {
        render(<Sidebar />);
        expect(
            screen.queryByText("sidebar.worship_tracker"),
        ).not.toBeInTheDocument();
        expect(screen.queryByText("sidebar.account")).not.toBeInTheDocument();
    });

    test("renders nav links", () => {
        render(<Sidebar />);
        expect(screen.getByText("link.quran")).toBeInTheDocument();
        expect(screen.getByText("link.hadith")).toBeInTheDocument();
    });

    test("active link has active styling", () => {
        render(<Sidebar />);
        const link = screen.getByText("link.quran").closest("a");
        expect(link.className).toContain("bg-emerald-50");
    });

    test("renders close button when onClose provided", () => {
        const onClose = jest.fn();
        render(<Sidebar onClose={onClose} />);
        const closeBtn = screen.getByLabelText("nav.close_sidebar");
        fireEvent.click(closeBtn);
        expect(onClose).toHaveBeenCalled();
    });

    test("renders authenticated section when user is logged in", () => {
        mockUseAuth.isAuthenticated = true;
        mockUseAuth.user = { name: "Fulan", email: "fulan@test.com" };
        render(<Sidebar />);
        expect(screen.getByText("sidebar.worship_tracker")).toBeInTheDocument();
        expect(screen.getByText("sidebar.account")).toBeInTheDocument();
        expect(screen.getByText("fulan@test.com")).toBeInTheDocument();
        mockUseAuth.isAuthenticated = false;
        mockUseAuth.user = null;
    });
});
