import { render, screen } from "@testing-library/react";
import {
    Spinner1,
    Spinner2,
    Spinner3,
    Spinner4,
} from "@/components/spinner/Spinner";

describe("Spinner1", () => {
    test("renders loading text", () => {
        render(<Spinner1 />);
        expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    test("uses h-screen when isProp is passed", () => {
        const { container } = render(<Spinner1 isProp />);
        expect(container.innerHTML).toContain("h-screen");
    });

    test("uses h-full when isProp is undefined", () => {
        const { container } = render(<Spinner1 />);
        expect(container.innerHTML).toContain("h-full");
    });
});

describe("Spinner2", () => {
    test("renders with role status", () => {
        const { container } = render(<Spinner2 />);
        expect(container.querySelector('[role="status"]')).toBeInTheDocument();
    });
});

describe("Spinner3", () => {
    test("renders centered spinner", () => {
        const { container } = render(<Spinner3 />);
        const outer = container.firstChild;
        expect(outer.className).toContain("h-screen");
    });
});

describe("Spinner4", () => {
    test("renders with absolute positioning", () => {
        const { container } = render(<Spinner4 />);
        const outer = container.firstChild;
        expect(outer.className).toContain("absolute");
    });
});
