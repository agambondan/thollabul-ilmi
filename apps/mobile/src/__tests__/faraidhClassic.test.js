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

jest.mock("../components/NotificationCenter", () => ({
    NotificationCenter: () => null,
}));

jest.mock("../screens/HistoricalMapScreen", () => ({
    HistoricalMapContent: () => null,
}));

jest.mock("../screens/TokohTarikhContent", () => ({
    TokohTarikhContent: () => null,
}));

jest.mock("../screens/MasjidDirectoryContent", () => ({
    MasjidDirectoryContent: () => null,
}));

jest.mock("../screens/RadioIslamicContent", () => ({
    RadioIslamicContent: () => null,
}));

import React, { useState } from "react";
import { fireEvent, render } from "@testing-library/react-native";

import { createExploreClassicRenderers } from "../screens/explore/ExploreClassicRenderers";

const feature = {
    key: "faraidh",
    title: "Kalkulator Faraidh",
    type: "faraidh",
};

const emptyHeirs = {
    anakL: 0,
    anakP: 0,
    ayah: 0,
    ibu: 0,
    istri: 0,
    kakek: 0,
    nenek: 0,
    saudaraL: 0,
    saudaraP: 0,
    suami: 0,
};

const makeFaraidh = (overrides = {}) => ({
    bequest: "",
    debts: "",
    estate: "",
    ...overrides,
    heirs: { ...emptyHeirs, ...(overrides.heirs ?? {}) },
});

function ClassicFaraidh({ initial, onState }) {
    const [faraidh, setFaraidh] = useState(initial);
    onState?.(faraidh);

    return createExploreClassicRenderers({
        activeFeature: feature,
        faraidh,
        faraidhCatatan: "",
        faraidhHistory: [],
        isWebAppLayout: false,
        savingFaraidh: false,
        session: null,
        setFaraidh,
        setFaraidhCatatan: jest.fn(),
        setFaraidhHistory: jest.fn(),
        setSavingFaraidh: jest.fn(),
        setShowFaraidhHistory: jest.fn(),
        showFaraidhHistory: false,
    }).renderFeatureContent();
}

const plusButtons = (view) => view.getAllByText("+");
const minusButtons = (view) => view.getAllByText("−");
const SUAMI = 0;
const ISTRI = 1;
const ANAK_L = 2;

describe("Classic faraidh bequest limit", () => {
    test("limits the bequest to 1/3 of the estate after debts", () => {
        const view = render(
            <ClassicFaraidh
                initial={makeFaraidh({
                    bequest: "100000000",
                    debts: "60000000",
                    estate: "240000000",
                    heirs: { anakL: 1 },
                })}
            />,
        );

        expect(
            view.getByText(
                "Wasiat melebihi batas, dihitung maksimal Rp 60.000.000.",
            ),
        ).toBeTruthy();
        expect(view.getAllByText("Rp 120.000.000").length).toBeGreaterThan(0);
    });

    test("without debts the limit is 1/3 of the whole estate", () => {
        const view = render(
            <ClassicFaraidh
                initial={makeFaraidh({
                    bequest: "100000000",
                    estate: "240000000",
                    heirs: { anakL: 1 },
                })}
            />,
        );

        expect(
            view.getByText(
                "Wasiat melebihi batas, dihitung maksimal Rp 80.000.000.",
            ),
        ).toBeTruthy();
        expect(view.getAllByText("Rp 160.000.000").length).toBeGreaterThan(0);
    });

    test("a bequest within the net limit is not capped", () => {
        const view = render(
            <ClassicFaraidh
                initial={makeFaraidh({
                    bequest: "50000000",
                    debts: "60000000",
                    estate: "240000000",
                    heirs: { anakL: 1 },
                })}
            />,
        );

        expect(view.queryByText(/Wasiat melebihi batas/)).toBeNull();
        expect(view.getAllByText("Rp 130.000.000").length).toBeGreaterThan(0);
    });

    test("debts above the estate leave nothing to distribute", () => {
        const view = render(
            <ClassicFaraidh
                initial={makeFaraidh({
                    bequest: "10000000",
                    debts: "150000000",
                    estate: "100000000",
                    heirs: { anakL: 1 },
                })}
            />,
        );

        expect(view.queryByText("Hasil Bagi")).toBeNull();
        expect(view.queryByText(/Wasiat melebihi batas/)).toBeNull();
    });
});

describe("Classic faraidh spouse exclusivity", () => {
    const renderStateful = (heirs = {}) => {
        const state = { current: null };
        const view = render(
            <ClassicFaraidh
                initial={makeFaraidh({ heirs })}
                onState={(faraidh) => {
                    state.current = faraidh;
                }}
            />,
        );
        return { state, view };
    };

    test("adding a wife drops the husband", () => {
        const { state, view } = renderStateful({ suami: 1 });

        fireEvent.press(plusButtons(view)[ISTRI]);

        expect(state.current.heirs.istri).toBe(1);
        expect(state.current.heirs.suami).toBe(0);
    });

    test("adding a husband drops every wife", () => {
        const { state, view } = renderStateful({ istri: 3 });

        fireEvent.press(plusButtons(view)[SUAMI]);

        expect(state.current.heirs.suami).toBe(1);
        expect(state.current.heirs.istri).toBe(0);
    });

    test("adding more wives keeps the count growing", () => {
        const { state, view } = renderStateful({ istri: 1 });

        fireEvent.press(plusButtons(view)[ISTRI]);
        fireEvent.press(plusButtons(view)[ISTRI]);

        expect(state.current.heirs.istri).toBe(3);
        expect(state.current.heirs.suami).toBe(0);
    });

    test("other heirs and the minus buttons leave the spouse alone", () => {
        const { state, view } = renderStateful({ anakL: 1, suami: 1 });

        fireEvent.press(plusButtons(view)[ANAK_L]);
        expect(state.current.heirs.anakL).toBe(2);
        expect(state.current.heirs.suami).toBe(1);

        fireEvent.press(minusButtons(view)[ANAK_L]);
        expect(state.current.heirs.anakL).toBe(1);
        expect(state.current.heirs.suami).toBe(1);

        fireEvent.press(minusButtons(view)[SUAMI]);
        expect(state.current.heirs.suami).toBe(0);
        expect(state.current.heirs.istri).toBe(0);
    });
});
