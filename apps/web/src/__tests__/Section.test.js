import { render, screen } from "@testing-library/react";
import Section from "@/components/Section";

describe("Section", () => {
    test("renders children", () => {
        render(
            <Section>
                <p>hello</p>
            </Section>,
        );
        expect(screen.getByText("hello")).toBeInTheDocument();
    });

    test("renders section element with base classes", () => {
        const { container } = render(<Section>test</Section>);
        const section = container.querySelector("section");
        expect(section).toBeInTheDocument();
        expect(section.className).toContain("bg-gray-50");
        expect(section.className).toContain("dark:bg-gray-950");
    });
});
