import { render, screen } from "@testing-library/react";
import Footer from "@/components/Footer";

jest.mock("@/context/Locale", () => ({
    useLocale: () => ({ t: (k) => k, lang: "ID" }),
}));

jest.mock("next/link", () => ({ children, href, ...p }) => (
    <a href={href} {...p}>
        {children}
    </a>
));

describe("Footer", () => {
    test("renders branding", () => {
        render(<Footer />);
        expect(screen.getByText("Thullaabul 'Ilmi")).toBeInTheDocument();
        expect(screen.getByText("طُلَّابُ الْعِلْمِ")).toBeInTheDocument();
    });

    test("renders column titles", () => {
        render(<Footer />);
        expect(screen.getByText("footer.worship")).toBeInTheDocument();
        expect(screen.getByText("footer.tracker")).toBeInTheDocument();
        expect(screen.getByText("footer.content")).toBeInTheDocument();
        expect(screen.getByText("footer.tools")).toBeInTheDocument();
    });

    test("renders link labels", () => {
        render(<Footer />);
        expect(screen.getByText("link.quran")).toBeInTheDocument();
        expect(screen.getByText("link.hadith")).toBeInTheDocument();
        expect(screen.getByText("link.prayer_schedule")).toBeInTheDocument();
    });

    test("renders quote text", () => {
        render(<Footer />);
        expect(screen.getByText(/footer.quote/)).toBeInTheDocument();
    });

    test("renders tagline", () => {
        render(<Footer />);
        expect(screen.getByText(/footer.tagline/)).toBeInTheDocument();
    });

    test("renders current year", () => {
        render(<Footer />);
        const yr = String(new Date().getFullYear());
        expect(screen.getByText(new RegExp(yr))).toBeInTheDocument();
    });

    test("links have valid hrefs", () => {
        render(<Footer />);
        const links = screen.getAllByRole("link");
        expect(links.length).toBeGreaterThan(0);
        links.forEach((link) => {
            expect(link.getAttribute("href")).toBeTruthy();
        });
    });
});
