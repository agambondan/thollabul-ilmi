jest.mock("lucide-react-native", () => {
    const icon = () => null;
    return new Proxy(
        {},
        {
            get: (target, prop) => {
                if (prop === "__esModule") return false;
                if (!target[prop]) target[prop] = icon;
                return target[prop];
            },
        },
    );
});

import React from "react";
import { render } from "@testing-library/react-native";
import { MobileMenuSheet } from "../layout/MobileMenuSheet";

describe("MobileMenuSheet quick access selection", () => {
    test("highlights exactly one row matching the currently open feature", () => {
        const { getByTestId } = render(
            <MobileMenuSheet
                active='belajar'
                currentFeatureKey='tokoh'
                onClose={jest.fn()}
                onSelect={jest.fn()}
                visible
            />,
        );

        expect(
            getByTestId("mobile-menu-item-tokoh").props.accessibilityState
                .selected,
        ).toBe(true);
        expect(
            getByTestId("mobile-menu-item-peta").props.accessibilityState
                .selected,
        ).toBe(false);
        expect(
            getByTestId("mobile-menu-item-perawi").props.accessibilityState
                .selected,
        ).toBe(false);
    });

    test("highlights nothing when a different Belajar feature is open", () => {
        const { getByTestId } = render(
            <MobileMenuSheet
                active='belajar'
                currentFeatureKey='kajian'
                onClose={jest.fn()}
                onSelect={jest.fn()}
                visible
            />,
        );

        expect(
            getByTestId("mobile-menu-item-tokoh").props.accessibilityState
                .selected,
        ).toBe(false);
        expect(
            getByTestId("mobile-menu-item-peta").props.accessibilityState
                .selected,
        ).toBe(false);
        expect(
            getByTestId("mobile-menu-item-perawi").props.accessibilityState
                .selected,
        ).toBe(false);
    });

    test("highlights nothing when a different tab is active", () => {
        const { getByTestId } = render(
            <MobileMenuSheet
                active='quran'
                currentFeatureKey={null}
                onClose={jest.fn()}
                onSelect={jest.fn()}
                visible
            />,
        );

        expect(
            getByTestId("mobile-menu-item-tokoh").props.accessibilityState
                .selected,
        ).toBe(false);
        expect(
            getByTestId("mobile-menu-item-peta").props.accessibilityState
                .selected,
        ).toBe(false);
        expect(
            getByTestId("mobile-menu-item-perawi").props.accessibilityState
                .selected,
        ).toBe(false);
    });
});
