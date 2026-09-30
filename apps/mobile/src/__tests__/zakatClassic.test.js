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

const feature = { key: "zakat", title: "Kalkulator Zakat", type: "zakat" };

function ClassicZakat({ initial = {}, tab }) {
    const [goldGrams, setGoldGrams] = useState(initial.goldGrams ?? "");
    const [goldPrice, setGoldPrice] = useState(initial.goldPrice ?? "2419000");
    const [harvest, setHarvest] = useState(initial.harvest ?? "");
    const [ricePrice, setRicePrice] = useState(initial.ricePrice ?? "16000");
    const [riceKgPrice, setRiceKgPrice] = useState(
        initial.riceKgPrice ?? "16000",
    );
    const [silverGrams, setSilverGrams] = useState(initial.silverGrams ?? "");
    const [silverPrice, setSilverPrice] = useState(
        initial.silverPrice ?? "14000",
    );
    const [zakat, setZakat] = useState({
        assets: initial.assets ?? "",
        debts: "",
    });

    return createExploreClassicRenderers({
        activeFeature: feature,
        isWebAppLayout: false,
        session: null,
        setZakat,
        setZakatGoldGrams: setGoldGrams,
        setZakatGoldPrice: setGoldPrice,
        setZakatHarvestWeight: setHarvest,
        setZakatRiceKgPrice: setRiceKgPrice,
        setZakatRicePrice: setRicePrice,
        setZakatSilverGrams: setSilverGrams,
        setZakatSilverPrice: setSilverPrice,
        setZakatTab: jest.fn(),
        zakat,
        zakatFamilyCount: 1,
        zakatGoldGrams: goldGrams,
        zakatGoldHaul: true,
        zakatGoldPrice: goldPrice,
        zakatHarvestIrrigated: false,
        zakatHarvestWeight: harvest,
        zakatHaul: true,
        zakatHistory: [],
        zakatRiceKgPrice: riceKgPrice,
        zakatRicePrice: ricePrice,
        zakatSilverGrams: silverGrams,
        zakatSilverPrice: silverPrice,
        zakatTab: tab,
        zakatTimerRef: { current: null },
        zakatTradeHaul: true,
    }).renderFeatureContent();
}

const weightInputs = (view) => view.getAllByPlaceholderText("0");

describe("Classic zakat calculator", () => {
    test("gram fields have no Rp prefix, price fields keep it", () => {
        const gold = render(<ClassicZakat tab={4} />);
        expect(gold.getAllByText("Rp")).toHaveLength(2);
        gold.unmount();

        const harvest = render(<ClassicZakat tab={3} />);
        expect(harvest.getAllByText("Rp")).toHaveLength(1);
        harvest.unmount();

        const maal = render(<ClassicZakat tab={0} />);
        expect(maal.getAllByText("Rp")).toHaveLength(2);
    });

    test("85.5 g and 85,5 g both give Rp 5.170.613", () => {
        const view = render(<ClassicZakat tab={4} />);

        fireEvent.changeText(weightInputs(view)[0], "85.5");
        expect(view.getByDisplayValue("85.5")).toBeTruthy();
        expect(view.getByText("Rp 5.170.613")).toBeTruthy();

        fireEvent.changeText(weightInputs(view)[0], "85,5");
        expect(view.getByDisplayValue("85,5")).toBeTruthy();
        expect(view.getByText("Rp 5.170.613")).toBeTruthy();
    });

    test("silver weight accepts decimals too", () => {
        const view = render(<ClassicZakat tab={4} />);

        fireEvent.changeText(weightInputs(view)[1], "595,5");

        expect(view.getByDisplayValue("595,5")).toBeTruthy();
        expect(view.getByText("Rp 208.425")).toBeTruthy();
    });

    test("653.5 kg of harvest stays 653.5 and gives Rp 1.045.600", () => {
        const view = render(<ClassicZakat tab={3} />);

        fireEvent.changeText(weightInputs(view)[0], "653.5");

        expect(view.getByDisplayValue("653.5")).toBeTruthy();
        expect(view.getByText("Rp 1.045.600")).toBeTruthy();
    });

    test("weights and rupiah fields are capped", () => {
        const view = render(<ClassicZakat tab={4} />);

        fireEvent.changeText(weightInputs(view)[0], "9".repeat(30));
        expect(view.getByDisplayValue("9".repeat(9))).toBeTruthy();

        fireEvent.changeText(
            view.getByDisplayValue("2.419.000"),
            "9".repeat(30),
        );
        expect(view.getByDisplayValue("999.999.999.999.999")).toBeTruthy();
    });

    test("an empty gold price asks for it instead of using a hidden price", () => {
        const emas = render(
            <ClassicZakat
                initial={{ goldGrams: "100", goldPrice: "" }}
                tab={4}
            />,
        );
        expect(
            emas.getByText("Isi harga emas/gram untuk menghitung zakat."),
        ).toBeTruthy();
        emas.unmount();

        const maal = render(
            <ClassicZakat
                initial={{ assets: "200000000", goldPrice: "" }}
                tab={0}
            />,
        );
        expect(
            maal.getByText(
                "Isi harga emas/gram di tab Emas untuk menghitung zakat.",
            ),
        ).toBeTruthy();
        expect(maal.queryByText(/Nisab: Rp/)).toBeNull();
        expect(maal.queryByText("Rp 5.000.000")).toBeNull();
        expect(maal.getByText("-")).toBeTruthy();
    });

    test("an empty silver, rice or grain price asks for it", () => {
        const silver = render(
            <ClassicZakat initial={{ silverPrice: "" }} tab={4} />,
        );
        expect(
            silver.getByText("Isi harga perak/gram untuk menghitung zakat."),
        ).toBeTruthy();
        silver.unmount();

        const rice = render(
            <ClassicZakat initial={{ ricePrice: "" }} tab={1} />,
        );
        expect(
            rice.getByText("Isi harga beras/kg untuk menghitung zakat."),
        ).toBeTruthy();
        rice.unmount();

        const grain = render(
            <ClassicZakat initial={{ riceKgPrice: "" }} tab={3} />,
        );
        expect(
            grain.getByText("Isi harga gabah/kg untuk menghitung zakat."),
        ).toBeTruthy();
    });

    test("the maal tab shows the nisab while the gold price is filled", () => {
        const view = render(<ClassicZakat tab={0} />);

        expect(view.getByText(/Nisab: Rp 205\.615\.000/)).toBeTruthy();
    });
});
