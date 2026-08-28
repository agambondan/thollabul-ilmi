import { render, screen } from "@testing-library/react";
import Header from "@/components/Header";

describe("Header", () => {
    test("renders header text", () => {
        render(<Header />);
        expect(screen.getByText("Header")).toBeInTheDocument();
    });
});
