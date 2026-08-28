import React from "react";
import { render } from "@testing-library/react";

jest.mock("react-flag-icon-css", () => {
    return {
        __esModule: true,
        default: () =>
            jest.fn(({ code }) => (
                <span className={`flag-icon flag-icon-${code}`} />
            )),
    };
});

describe("FlagIcon", () => {
    test("renders flag icon with code", () => {
        const FlagIcon = require("@/components/icon/Flag").default;
        const { container } = render(<FlagIcon code='id' />);
        const el = container.querySelector(".flag-icon");
        expect(el).toBeInTheDocument();
        expect(el.className).toContain("flag-icon-id");
    });
});
