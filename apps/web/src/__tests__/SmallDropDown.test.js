import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SmallDropdown from "@/components/dropdown/SmallDropDown";

jest.mock("react-icons/ri", () => ({
    RiArrowDropDownLine: () => <span data-testid='arrow-down' />,
    RiArrowDropUpLine: () => <span data-testid='arrow-up' />,
}));

describe("SmallDropdown", () => {
    test("renders flag and toggle button", () => {
        render(
            <SmallDropdown
                flag={<span>ID</span>}
                isSmallDropdownOpen={false}
                toggleSmallDropdown={jest.fn()}
            >
                <li>item</li>
            </SmallDropdown>,
        );
        expect(screen.getByText("ID")).toBeInTheDocument();
        expect(screen.getByRole("button")).toBeInTheDocument();
    });

    test("shows dropdown when open", () => {
        const { container } = render(
            <SmallDropdown
                flag={<span>ID</span>}
                isSmallDropdownOpen={true}
                toggleSmallDropdown={jest.fn()}
            >
                <li>item</li>
            </SmallDropdown>,
        );
        const ul = container.querySelector("ul");
        expect(ul.className).toContain("block");
    });

    test("hides dropdown when closed", () => {
        const { container } = render(
            <SmallDropdown
                flag={<span>ID</span>}
                isSmallDropdownOpen={false}
                toggleSmallDropdown={jest.fn()}
            >
                <li>item</li>
            </SmallDropdown>,
        );
        const ul = container.querySelector("ul");
        expect(ul.className).toContain("hidden");
    });

    test("calls toggle when button clicked", async () => {
        const toggle = jest.fn();
        render(
            <SmallDropdown
                flag={<span>ID</span>}
                isSmallDropdownOpen={false}
                toggleSmallDropdown={toggle}
            >
                <li>item</li>
            </SmallDropdown>,
        );
        await userEvent.click(screen.getByRole("button"));
        expect(toggle).toHaveBeenCalledTimes(1);
    });

    test("shows arrow down when closed", () => {
        render(
            <SmallDropdown
                flag={<span>ID</span>}
                isSmallDropdownOpen={false}
                toggleSmallDropdown={jest.fn()}
            >
                <li>item</li>
            </SmallDropdown>,
        );
        expect(screen.getByTestId("arrow-down")).toBeInTheDocument();
    });

    test("shows arrow up when open", () => {
        render(
            <SmallDropdown
                flag={<span>ID</span>}
                isSmallDropdownOpen={true}
                toggleSmallDropdown={jest.fn()}
            >
                <li>item</li>
            </SmallDropdown>,
        );
        expect(screen.getByTestId("arrow-up")).toBeInTheDocument();
    });
});
