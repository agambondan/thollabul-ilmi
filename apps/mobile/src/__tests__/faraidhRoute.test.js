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

import React, { useState } from "react";
import { fireEvent, render } from "@testing-library/react-native";

import { WebAppFaraidhRoute } from "../screens/explore/WebAppFaraidhRoute";

const emptyHeirs = {
    anakL: 0,
    anakP: 0,
    ayah: 0,
    cucuL: 0,
    cucuP: 0,
    ibu: 0,
    istri: 0,
    kakek: 0,
    nenek: 0,
    saudaraL: 0,
    saudaraP: 0,
    saudaraSeayahL: 0,
    saudaraSeayahP: 0,
    saudaraSeibuL: 0,
    saudaraSeibuP: 0,
    suami: 0,
};

const makeFaraidh = (overrides = {}) => ({
    bequest: "",
    debts: "",
    estate: "",
    heirs: { ...emptyHeirs },
    ...overrides,
});

const renderRoute = (faraidh, contextOverrides = {}) =>
    render(<WebAppFaraidhRoute context={{ faraidh, ...contextOverrides }} />);

function StatefulRoute({ initial }) {
    const [faraidh, setFaraidh] = useState(initial);
    return <WebAppFaraidhRoute context={{ faraidh, setFaraidh }} />;
}

const isDisabled = (node) => Boolean(node.props.accessibilityState?.disabled);

describe("WebAppFaraidhRoute bequest limit", () => {
    test("limits the bequest to 1/3 of the estate after debts", () => {
        const { getByText } = renderRoute(
            makeFaraidh({
                bequest: "100000000",
                debts: "60000000",
                estate: "240000000",
            }),
        );

        expect(getByText("Maksimal wasiat: Rp 60.000.000")).toBeTruthy();
        expect(
            getByText(
                "Wasiat melebihi batas, dihitung maksimal Rp 60.000.000.",
            ),
        ).toBeTruthy();
        expect(getByText("Rp 120.000.000")).toBeTruthy();
    });

    test("without debts the limit is 1/3 of the whole estate", () => {
        const { getByText, queryByText } = renderRoute(
            makeFaraidh({ bequest: "50000000", estate: "240000000" }),
        );

        expect(getByText("Maksimal wasiat: Rp 80.000.000")).toBeTruthy();
        expect(queryByText(/melebihi batas/)).toBeNull();
        expect(getByText("Rp 190.000.000")).toBeTruthy();
    });

    test("a bequest within the net limit is not capped", () => {
        const { getByText, queryByText } = renderRoute(
            makeFaraidh({
                bequest: "60000000",
                debts: "60000000",
                estate: "240000000",
            }),
        );

        expect(getByText("Maksimal wasiat: Rp 60.000.000")).toBeTruthy();
        expect(queryByText(/melebihi batas/)).toBeNull();
        expect(getByText("Rp 120.000.000")).toBeTruthy();
    });

    test("debts above the estate leave no room for a bequest", () => {
        const { getByText } = renderRoute(
            makeFaraidh({
                bequest: "10000000",
                debts: "150000000",
                estate: "100000000",
            }),
        );

        expect(getByText("Maksimal wasiat: Rp 0")).toBeTruthy();
        expect(
            getByText("Wasiat melebihi batas, dihitung maksimal Rp 0."),
        ).toBeTruthy();
    });
});

describe("WebAppFaraidhRoute spouse exclusivity", () => {
    const pressAndResolve = (testID, heirs) => {
        const setFaraidh = jest.fn();
        const { getByTestId } = renderRoute(makeFaraidh({ heirs }), {
            setFaraidh,
        });
        fireEvent.press(getByTestId(testID));
        const updater = setFaraidh.mock.calls[0][0];
        return updater(makeFaraidh({ heirs }));
    };

    test("adding a wife drops the husband", () => {
        const next = pressAndResolve("web-app-faraidh-heir-istri-plus", {
            ...emptyHeirs,
            suami: 1,
        });

        expect(next.heirs.istri).toBe(1);
        expect(next.heirs.suami).toBe(0);
    });

    test("adding a husband drops every wife", () => {
        const next = pressAndResolve("web-app-faraidh-heir-suami-plus", {
            ...emptyHeirs,
            istri: 3,
        });

        expect(next.heirs.suami).toBe(1);
        expect(next.heirs.istri).toBe(0);
    });

    test("other heirs and the minus buttons leave the spouse alone", () => {
        const withHusband = { ...emptyHeirs, suami: 1 };
        const child = pressAndResolve(
            "web-app-faraidh-heir-anakL-plus",
            withHusband,
        );
        expect(child.heirs.anakL).toBe(1);
        expect(child.heirs.suami).toBe(1);

        const wives = { ...emptyHeirs, istri: 2 };
        const fewer = pressAndResolve(
            "web-app-faraidh-heir-istri-minus",
            wives,
        );
        expect(fewer.heirs.istri).toBe(1);
        expect(fewer.heirs.suami).toBe(0);
    });

    test("the stepper counts switch from husband to wife in the form", () => {
        const { getByTestId } = render(
            <StatefulRoute
                initial={makeFaraidh({ heirs: { ...emptyHeirs, suami: 1 } })}
            />,
        );

        expect(
            isDisabled(getByTestId("web-app-faraidh-heir-suami-minus")),
        ).toBe(false);

        fireEvent.press(getByTestId("web-app-faraidh-heir-istri-plus"));

        expect(
            isDisabled(getByTestId("web-app-faraidh-heir-suami-minus")),
        ).toBe(true);
        expect(
            isDisabled(getByTestId("web-app-faraidh-heir-istri-minus")),
        ).toBe(false);

        fireEvent.press(getByTestId("web-app-faraidh-heir-suami-plus"));

        expect(
            isDisabled(getByTestId("web-app-faraidh-heir-suami-minus")),
        ).toBe(false);
        expect(
            isDisabled(getByTestId("web-app-faraidh-heir-istri-minus")),
        ).toBe(true);
    });
});

describe("WebAppFaraidhRoute currency fields", () => {
    test("caps the estate at 15 digits", () => {
        const setFaraidh = jest.fn();
        const { getAllByPlaceholderText } = renderRoute(makeFaraidh(), {
            setFaraidh,
        });

        fireEvent.changeText(getAllByPlaceholderText("0")[0], "9".repeat(30));

        const next = setFaraidh.mock.calls[0][0](makeFaraidh());
        expect(next.estate).toBe("9".repeat(15));
    });
});

describe("WebAppFaraidhRoute Umariyyatain", () => {
    test("shows the corrected shares and notice for suami, ayah and ibu", () => {
        const { getAllByText, getByText } = renderRoute(
            makeFaraidh({
                estate: "240000000",
                heirs: { ...emptyHeirs, ayah: 1, ibu: 1, suami: 1 },
            }),
        );

        expect(
            getByText(/^Umariyyatain: ibu mendapat 1\/3 dari sisa/),
        ).toBeTruthy();
        expect(getAllByText("Rp 120.000.000").length).toBeGreaterThan(0);
        expect(getAllByText("Rp 80.000.000").length).toBeGreaterThan(0);
        expect(getAllByText("Rp 40.000.000").length).toBeGreaterThan(0);
        expect(getByText("1/6 · 16.67%")).toBeTruthy();
        expect(getByText("Sisa · 33.33%")).toBeTruthy();
    });
});
