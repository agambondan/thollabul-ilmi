import React from "react";
import { render } from "@testing-library/react-native";

import { calculateFaraidh } from "../lib/faraidh";
import {
    FaraidhFamilyTreeMobile,
    formatHeirBadge,
    resolveHeirResult,
} from "../screens/explore/FaraidhFamilyTreeMobile";

const ESTATE = 240000000;

const renderTree = (heirs, total = ESTATE) =>
    render(
        <FaraidhFamilyTreeMobile
            calculation={calculateFaraidh(heirs, total)}
            heirs={heirs}
        />,
    );

describe("FaraidhFamilyTreeMobile", () => {
    test("istri + anak laki + anak perempuan: istri 1/8, anak tidak mahjub", () => {
        const { getAllByText, getByText, queryByText } = renderTree({
            istri: 1,
            anakL: 1,
            anakP: 1,
        });

        expect(getByText("1/8")).toBeTruthy();
        expect(getByText("Rp 30.000.000")).toBeTruthy();
        expect(getByText("Rp 140.000.000")).toBeTruthy();
        expect(getByText("Rp 70.000.000")).toBeTruthy();
        expect(getAllByText("Ashabah")).toHaveLength(2);
        expect(queryByText("Mahjub (Terhalang)")).toBeNull();
        expect(queryByText(/undefined/)).toBeNull();
    });

    test("Umariyyatain suami: suami 1/2, ibu 1/6, ayah ashabah", () => {
        const { getByText, queryByText } = renderTree({
            suami: 1,
            ayah: 1,
            ibu: 1,
        });

        expect(getByText("1/2")).toBeTruthy();
        expect(getByText("1/6")).toBeTruthy();
        expect(getByText("Ashabah")).toBeTruthy();
        expect(getByText("Rp 120.000.000")).toBeTruthy();
        expect(getByText("Rp 40.000.000")).toBeTruthy();
        expect(getByText("Rp 80.000.000")).toBeTruthy();
        expect(queryByText("Mahjub (Terhalang)")).toBeNull();
        expect(queryByText(/undefined/)).toBeNull();
    });

    test("Umariyyatain istri: istri 1/4, ibu 1/4, ayah ashabah", () => {
        const { getAllByText, getByText, queryByText } = renderTree({
            istri: 1,
            ayah: 1,
            ibu: 1,
        });

        expect(getAllByText("1/4")).toHaveLength(2);
        expect(getAllByText("Rp 60.000.000")).toHaveLength(2);
        expect(getByText("Ashabah")).toBeTruthy();
        expect(getByText("Rp 120.000.000")).toBeTruthy();
        expect(queryByText("Mahjub (Terhalang)")).toBeNull();
        expect(queryByText(/undefined/)).toBeNull();
    });

    test("only heirs that are really blocked are labelled mahjub", () => {
        const { getAllByText, getByText } = renderTree({
            ayah: 1,
            ibu: 1,
            kakek: 1,
            nenek: 1,
            saudaraL: 1,
        });

        expect(getAllByText("Mahjub (Terhalang)")).toHaveLength(3);
        expect(getByText("1/3")).toBeTruthy();
        expect(getByText("Ashabah")).toBeTruthy();
    });

    test("saudara seibu share one row and are not mahjub", () => {
        const { getAllByText, queryByText } = renderTree({
            suami: 1,
            saudaraSeibuL: 1,
            saudaraSeibuP: 1,
        });

        expect(getAllByText("1/3 bersama")).toHaveLength(2);
        expect(getAllByText("Rp 60.000.000")).toHaveLength(2);
        expect(queryByText("Mahjub (Terhalang)")).toBeNull();
    });

    test("Musytarakah keeps ibu and saudara out of mahjub", () => {
        const { getAllByText, getByText, queryByText } = renderTree({
            suami: 1,
            ibu: 1,
            saudaraL: 2,
        });

        expect(getAllByText("1/3 bersama")).toHaveLength(2);
        expect(getByText("Rp 40.000.000")).toBeTruthy();
        expect(getByText("Rp 80.000.000")).toBeTruthy();
        expect(queryByText("Mahjub (Terhalang)")).toBeNull();
    });

    test("Akdariyah: kakek shows furudh plus residue, saudari 1/2", () => {
        const { getAllByText, getByText, queryByText } = renderTree({
            kakek: 1,
            saudaraP: 1,
        });

        expect(getByText("1/6 + Ashabah")).toBeTruthy();
        expect(getByText("1/2")).toBeTruthy();
        expect(getAllByText("Rp 120.000.000")).toHaveLength(2);
        expect(queryByText("Mahjub (Terhalang)")).toBeNull();
    });

    test("renders nothing before there is a calculation", () => {
        const { toJSON } = render(
            <FaraidhFamilyTreeMobile calculation={null} heirs={{}} />,
        );
        expect(toJSON()).toBeNull();
    });
});

describe("resolveHeirResult", () => {
    test("maps camelCase heir keys to snake_case result rows", () => {
        const calculation = calculateFaraidh(
            { istri: 1, anakL: 1, anakP: 1 },
            ESTATE,
        );

        expect(resolveHeirResult(calculation, "istri").fraction).toEqual({
            num: 1,
            den: 8,
        });
        expect(resolveHeirResult(calculation, "anakL")).toMatchObject({
            hasAshabah: true,
            fraction: null,
        });
        expect(resolveHeirResult(calculation, "anakL").share).toBeCloseTo(
            (7 / 8) * (2 / 3),
            10,
        );
        expect(resolveHeirResult(calculation, "anakP").share).toBeCloseTo(
            (7 / 8) * (1 / 3),
            10,
        );
    });

    test("returns null for heirs without a result row", () => {
        const calculation = calculateFaraidh({ ayah: 1, saudaraL: 1 }, ESTATE);

        expect(resolveHeirResult(calculation, "saudaraL")).toBeNull();
        expect(resolveHeirResult(calculation, "unknown")).toBeNull();
        expect(resolveHeirResult(null, "ayah")).toBeNull();
    });

    test("merges furudh and residue rows of the same heir", () => {
        const calculation = calculateFaraidh({ ayah: 1, anakP: 1 }, ESTATE);
        const ayah = resolveHeirResult(calculation, "ayah");

        expect(ayah.fraction).toEqual({ num: 1, den: 6 });
        expect(ayah.hasAshabah).toBe(true);
        expect(ayah.share).toBeCloseTo(1 / 2, 10);
        expect(ayah.amount).toBeCloseTo(ESTATE / 2, 0);
        expect(formatHeirBadge(ayah)).toBe("1/6 + Ashabah");
    });

    test("splits a shared row by head count", () => {
        const calculation = calculateFaraidh(
            { suami: 1, saudaraSeibuL: 1, saudaraSeibuP: 2 },
            ESTATE,
        );
        const male = resolveHeirResult(calculation, "saudaraSeibuL");
        const female = resolveHeirResult(calculation, "saudaraSeibuP");

        expect(male.amount).toBeCloseTo(ESTATE / 2 / 3, 0);
        expect(female.amount).toBeCloseTo((ESTATE / 2 / 3) * 2, 0);
        expect(male.shared).toBe(true);
        expect(formatHeirBadge(male)).toBe("1/3 bersama");
    });
});

describe("formatHeirBadge", () => {
    test("formats plain furudh, ashabah and percentage fallbacks", () => {
        expect(
            formatHeirBadge({
                fraction: { num: 1, den: 8 },
                hasAshabah: false,
                share: 0.125,
                shared: false,
            }),
        ).toBe("1/8");
        expect(
            formatHeirBadge({
                fraction: null,
                hasAshabah: true,
                share: 0.5,
                shared: false,
            }),
        ).toBe("Ashabah");
        expect(
            formatHeirBadge({
                fraction: null,
                hasAshabah: false,
                share: 0.25,
                shared: false,
            }),
        ).toBe("25%");
    });
});
