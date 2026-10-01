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

describe("MobileMenuSheet Lainnya (more) group selection", () => {
    test.each([
        ["settings", "pengaturan"],
        ["help", "bantuan"],
        ["about", "tentang"],
    ])(
        "highlights only the %s row when it is the open Profile view",
        (featureKey, selectedKey) => {
            const { getByTestId } = render(
                <MobileMenuSheet
                    active='profile'
                    currentFeatureKey={featureKey}
                    onClose={jest.fn()}
                    onSelect={jest.fn()}
                    visible
                />,
            );

            for (const key of ["pengaturan", "bantuan", "tentang"]) {
                expect(
                    getByTestId(`mobile-menu-item-${key}`).props
                        .accessibilityState.selected,
                ).toBe(key === selectedKey);
            }
        },
    );

    test("highlights nothing in Lainnya when on the Profile root (no featureKey)", () => {
        const { getByTestId } = render(
            <MobileMenuSheet
                active='profile'
                currentFeatureKey={null}
                onClose={jest.fn()}
                onSelect={jest.fn()}
                visible
            />,
        );

        for (const key of ["pengaturan", "bantuan", "tentang"]) {
            expect(
                getByTestId(`mobile-menu-item-${key}`).props.accessibilityState
                    .selected,
            ).toBe(false);
        }
    });

    test("leaves Akses Cepat selection unaffected while a Lainnya row is open", () => {
        const { getByTestId } = render(
            <MobileMenuSheet
                active='profile'
                currentFeatureKey='help'
                onClose={jest.fn()}
                onSelect={jest.fn()}
                visible
            />,
        );

        expect(
            getByTestId("mobile-menu-item-bantuan").props.accessibilityState
                .selected,
        ).toBe(true);
        for (const key of ["tokoh", "peta", "perawi"]) {
            expect(
                getByTestId(`mobile-menu-item-${key}`).props.accessibilityState
                    .selected,
            ).toBe(false);
        }
    });
});
