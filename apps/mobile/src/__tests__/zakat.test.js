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

import {
    calculateZakat,
    NISAB_GOLD_GRAM,
    NISAB_HARVEST_KG,
    NISAB_SILVER_GRAM,
} from "../lib/zakat";
import {
    digitsOnly,
    formatCurrency,
    formatDecimalValue,
    formatNumericInput,
    MAX_CURRENCY_DIGITS,
    parseDecimalInput,
    parseNumericInput,
    sanitizeCurrencyInput,
    sanitizeDecimalInput,
} from "../screens/ExploreScreen.helpers";
import { WebAppZakatRoute } from "../screens/explore/WebAppZakatRoute";

const GOLD_PRICE = 2419000;

describe("sanitizeDecimalInput", () => {
    test("keeps dot and comma decimals as typed", () => {
        expect(sanitizeDecimalInput("85.5")).toBe("85.5");
        expect(sanitizeDecimalInput("85,5")).toBe("85,5");
        expect(sanitizeDecimalInput("653.5")).toBe("653.5");
    });

    test("keeps a trailing separator so the next digit can be typed", () => {
        expect(sanitizeDecimalInput("85.")).toBe("85.");
        expect(sanitizeDecimalInput("85,")).toBe("85,");
    });

    test("prefixes a zero to a leading separator", () => {
        expect(sanitizeDecimalInput(".")).toBe("0.");
        expect(sanitizeDecimalInput(",5")).toBe("0,5");
    });

    test("drops letters, signs, spaces and extra separators", () => {
        expect(sanitizeDecimalInput("8a5-.5 g")).toBe("85.5");
        expect(sanitizeDecimalInput("1.2.3")).toBe("1.23");
        expect(sanitizeDecimalInput("1,2.3,4")).toBe("1,234");
        expect(sanitizeDecimalInput("abc")).toBe("");
        expect(sanitizeDecimalInput("")).toBe("");
    });

    test("strips leading zeros but keeps a lone zero", () => {
        expect(sanitizeDecimalInput("007")).toBe("7");
        expect(sanitizeDecimalInput("0")).toBe("0");
        expect(sanitizeDecimalInput("00")).toBe("0");
        expect(sanitizeDecimalInput("0.50")).toBe("0.50");
    });

    test("caps the integer and fraction digits", () => {
        expect(sanitizeDecimalInput("9".repeat(30))).toBe("9".repeat(9));
        expect(sanitizeDecimalInput("85.123456")).toBe("85.123");
        expect(sanitizeDecimalInput(`${"9".repeat(12)}.5`)).toBe(
            `${"9".repeat(9)}.5`,
        );
    });

    test("accepts non-string values", () => {
        expect(sanitizeDecimalInput(85.5)).toBe("85.5");
        expect(sanitizeDecimalInput(undefined)).toBe("");
    });
});

describe("parseDecimalInput", () => {
    test("reads dot and comma decimals as the same number", () => {
        expect(parseDecimalInput("85.5")).toBe(85.5);
        expect(parseDecimalInput("85,5")).toBe(85.5);
        expect(parseDecimalInput("653.5")).toBe(653.5);
        expect(parseDecimalInput("12,25")).toBe(12.25);
    });

    test("whole numbers and incomplete input", () => {
        expect(parseDecimalInput("85")).toBe(85);
        expect(parseDecimalInput("85.")).toBe(85);
        expect(parseDecimalInput(".")).toBe(0);
        expect(parseDecimalInput("")).toBe(0);
        expect(parseDecimalInput("abc")).toBe(0);
        expect(parseDecimalInput(undefined)).toBe(0);
    });

    test("never returns more than the capped magnitude", () => {
        expect(parseDecimalInput("9".repeat(30))).toBe(999999999);
        expect(Number.isFinite(parseDecimalInput("9".repeat(400)))).toBe(true);
    });
});

describe("rupiah input helpers keep their integer behaviour", () => {
    test("digitsOnly, parseNumericInput and formatNumericInput", () => {
        expect(digitsOnly("Rp 2.419.000")).toBe("2419000");
        expect(parseNumericInput("2.419.000")).toBe(2419000);
        expect(parseNumericInput("85,5")).toBe(855);
        expect(formatNumericInput("2419000")).toBe("2.419.000");
        expect(formatNumericInput("")).toBe("");
    });

    test("sanitizeCurrencyInput caps the digits", () => {
        expect(sanitizeCurrencyInput("2.419.000")).toBe("2419000");
        expect(sanitizeCurrencyInput("9".repeat(30))).toBe(
            "9".repeat(MAX_CURRENCY_DIGITS),
        );
        expect(MAX_CURRENCY_DIGITS).toBe(15);
        expect(Number.isSafeInteger(Number("9".repeat(15)))).toBe(true);
    });
});

describe("formatDecimalValue", () => {
    test("uses the decimal separator of the app language", () => {
        expect(formatDecimalValue(653.5, "idn")).toBe("653,5");
        expect(formatDecimalValue(653.5, "en")).toBe("653.5");
        expect(formatDecimalValue(1045600, "idn")).toBe("1.045.600");
        expect(formatDecimalValue(85.12345, "idn")).toBe("85,123");
        expect(formatDecimalValue(undefined)).toBe("0");
    });
});

describe("calculateZakat gold and silver", () => {
    test("85.5 g of gold gives 2.5% of its value", () => {
        const result = calculateZakat({
            goldGrams: 85.5,
            goldPrice: GOLD_PRICE,
            silverPrice: 14000,
        });

        expect(result.goldValue).toBe(206824500);
        expect(result.zakatGold).toBeCloseTo(5170612.5, 6);
        expect(formatCurrency(result.zakatGold)).toBe("Rp 5.170.613");
    });

    test("the comma decimal gives the same result as the dot", () => {
        const fromDot = calculateZakat({
            goldGrams: parseDecimalInput("85.5"),
            goldPrice: GOLD_PRICE,
            silverPrice: 14000,
        });
        const fromComma = calculateZakat({
            goldGrams: parseDecimalInput("85,5"),
            goldPrice: GOLD_PRICE,
            silverPrice: 14000,
        });

        expect(fromComma.zakatGold).toBe(fromDot.zakatGold);
        expect(fromComma.zakatGold).toBeLessThan(6000000);
    });

    test("the nisab is exactly 85 g of gold", () => {
        const base = { goldPrice: GOLD_PRICE, silverPrice: 14000 };

        expect(NISAB_GOLD_GRAM).toBe(85);
        expect(calculateZakat({ ...base, goldGrams: 84.999 }).zakatGold).toBe(
            0,
        );
        expect(
            calculateZakat({ ...base, goldGrams: 85 }).zakatGold,
        ).toBeGreaterThan(0);
    });

    test("silver alone can reach its own nisab of 595 g", () => {
        const base = { goldPrice: GOLD_PRICE, silverPrice: 14000 };

        expect(NISAB_SILVER_GRAM).toBe(595);
        expect(calculateZakat({ ...base, silverGrams: 594.5 }).zakatGold).toBe(
            0,
        );
        expect(
            calculateZakat({ ...base, silverGrams: 595 }).zakatGold,
        ).toBeCloseTo(595 * 14000 * 0.025, 6);
    });

    test("no zakat before haul", () => {
        expect(
            calculateZakat({
                goldGrams: 100,
                goldHaul: false,
                goldPrice: GOLD_PRICE,
                silverPrice: 14000,
            }).zakatGold,
        ).toBe(0);
    });

    test("an empty gold or silver price gives no result", () => {
        const noGold = calculateZakat({
            goldGrams: 100,
            goldPrice: 0,
            silverPrice: 14000,
        });
        const noSilver = calculateZakat({
            goldGrams: 100,
            goldPrice: GOLD_PRICE,
            silverPrice: 0,
        });

        expect(noGold.goldPriceMissing).toBe(true);
        expect(noGold.zakatGold).toBe(0);
        expect(noSilver.silverPriceMissing).toBe(true);
        expect(noSilver.goldPriceMissing).toBe(false);
        expect(noSilver.zakatGold).toBe(0);
    });
});

describe("calculateZakat agriculture", () => {
    test("653.5 kg keeps its decimal and gives 10% of the grain price", () => {
        const result = calculateZakat({
            harvest: parseDecimalInput("653.5"),
            riceKgPrice: 16000,
        });

        expect(result.zakatAgriculture).toBeCloseTo(1045600, 6);
        expect(formatCurrency(result.zakatAgriculture)).toBe("Rp 1.045.600");
    });

    test("irrigated land pays 5%", () => {
        const result = calculateZakat({
            harvest: 1000,
            harvestIrrigated: true,
            riceKgPrice: 16000,
        });

        expect(result.harvestRate).toBe(0.05);
        expect(result.zakatAgriculture).toBeCloseTo(800000, 6);
    });

    test("the nisab is 653 kg", () => {
        expect(NISAB_HARVEST_KG).toBe(653);
        expect(
            calculateZakat({ harvest: 652.9, riceKgPrice: 16000 })
                .zakatAgriculture,
        ).toBe(0);
        expect(
            calculateZakat({ harvest: 653, riceKgPrice: 16000 })
                .zakatAgriculture,
        ).toBeGreaterThan(0);
    });

    test("an empty grain price gives no result", () => {
        const result = calculateZakat({ harvest: 1000, riceKgPrice: 0 });

        expect(result.riceKgPriceMissing).toBe(true);
        expect(result.zakatAgriculture).toBe(0);
    });
});

describe("calculateZakat maal, trade and fitrah", () => {
    test("maal is 2.5% of net assets once the gold nisab is reached", () => {
        const result = calculateZakat({
            assets: 300000000,
            debts: 50000000,
            goldPrice: GOLD_PRICE,
        });

        expect(result.nisab).toBe(205615000);
        expect(result.net).toBe(250000000);
        expect(result.zakatMaal).toBeCloseTo(6250000, 6);
    });

    test("an empty gold price never falls back to a hidden price", () => {
        const maal = calculateZakat({ assets: 200000000, goldPrice: 0 });
        const trade = calculateZakat({ goldPrice: 0, tradeCapital: 200000000 });

        expect(maal.goldPriceMissing).toBe(true);
        expect(maal.zakatMaal).toBe(0);
        expect(trade.zakatTrade).toBe(0);
    });

    test("200 jt is below the real nisab of 205.615.000", () => {
        const result = calculateZakat({
            assets: 200000000,
            goldPrice: GOLD_PRICE,
        });

        expect(result.zakatMaal).toBe(0);
    });

    test("maal and trade need their own haul", () => {
        const base = { assets: 300000000, goldPrice: GOLD_PRICE };

        expect(calculateZakat({ ...base, haul: false }).zakatMaal).toBe(0);
        expect(
            calculateZakat({
                goldPrice: GOLD_PRICE,
                tradeCapital: 300000000,
                tradeHaul: false,
            }).zakatTrade,
        ).toBe(0);
    });

    test("trade nets capital, stock and receivables against debt", () => {
        const result = calculateZakat({
            goldPrice: GOLD_PRICE,
            tradeCapital: 150000000,
            tradeDebt: 20000000,
            tradeReceivable: 50000000,
            tradeStock: 100000000,
        });

        expect(result.tradeNet).toBe(280000000);
        expect(result.zakatTrade).toBeCloseTo(7000000, 6);
    });

    test("fitrah is 2.5 kg of rice per person", () => {
        const result = calculateZakat({ familyCount: 4, ricePrice: 16000 });

        expect(result.zakatFitrah).toBe(160000);
    });

    test("an empty rice price gives no fitrah", () => {
        const result = calculateZakat({ familyCount: 4, ricePrice: 0 });

        expect(result.ricePriceMissing).toBe(true);
        expect(result.zakatFitrah).toBe(0);
    });
});

function ZakatHarness({ initial = {}, tab }) {
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

    return (
        <WebAppZakatRoute
            setZakat={setZakat}
            setZakatGoldGrams={setGoldGrams}
            setZakatGoldPrice={setGoldPrice}
            setZakatHarvestWeight={setHarvest}
            setZakatRiceKgPrice={setRiceKgPrice}
            setZakatRicePrice={setRicePrice}
            setZakatSilverGrams={setSilverGrams}
            setZakatSilverPrice={setSilverPrice}
            zakat={zakat}
            zakatGoldGrams={goldGrams}
            zakatGoldPrice={goldPrice}
            zakatHarvestWeight={harvest}
            zakatRiceKgPrice={riceKgPrice}
            zakatRicePrice={ricePrice}
            zakatSilverGrams={silverGrams}
            zakatSilverPrice={silverPrice}
            zakatTab={tab}
        />
    );
}

const inputsByPlaceholder = (view) => view.getAllByPlaceholderText("0");

describe("WebAppZakatRoute gold and silver tab", () => {
    test("85,5 g and 85.5 g both stay 85.5 g and give Rp 5.170.613", () => {
        const view = render(<ZakatHarness tab={4} />);
        const [, goldWeight] = inputsByPlaceholder(view);

        fireEvent.changeText(goldWeight, "85.5");
        expect(view.getByDisplayValue("85.5")).toBeTruthy();
        expect(view.getByText("Rp 5.170.613")).toBeTruthy();
        expect(view.getByText("2,5% x Rp 206.824.500")).toBeTruthy();

        fireEvent.changeText(inputsByPlaceholder(view)[1], "85,5");
        expect(view.getByDisplayValue("85,5")).toBeTruthy();
        expect(view.getByText("Rp 5.170.613")).toBeTruthy();
    });

    test("typing one character at a time keeps the decimal point", () => {
        const view = render(<ZakatHarness tab={4} />);

        ["8", "85", "85,", "85,5"].forEach((text) => {
            fireEvent.changeText(inputsByPlaceholder(view)[1], text);
        });

        expect(view.getByDisplayValue("85,5")).toBeTruthy();
        expect(view.getByText("Rp 5.170.613")).toBeTruthy();
    });

    test("below the nisab shows no zakat", () => {
        const view = render(<ZakatHarness tab={4} />);

        fireEvent.changeText(inputsByPlaceholder(view)[1], "84,9");

        expect(view.queryByText("Rp 5.170.613")).toBeNull();
        expect(view.getAllByText("Rp 0").length).toBeGreaterThan(0);
    });

    test("a 30-digit weight is capped instead of producing garbage", () => {
        const view = render(<ZakatHarness tab={4} />);

        fireEvent.changeText(inputsByPlaceholder(view)[1], "9".repeat(30));

        expect(view.getByDisplayValue("9".repeat(9))).toBeTruthy();
        expect(
            view.queryByText(/\d{3}\.\d{3}\.\d{3}\.\d{3}\.\d{3}\.\d{3}/),
        ).toBeNull();
    });

    test("the gold price keeps integer rupiah and is capped at 15 digits", () => {
        const view = render(<ZakatHarness tab={4} />);

        fireEvent.changeText(inputsByPlaceholder(view)[0], "9".repeat(30));

        expect(view.getByDisplayValue("999.999.999.999.999")).toBeTruthy();
    });

    test("an empty gold price asks for it and computes nothing", () => {
        const view = render(
            <ZakatHarness
                initial={{ goldGrams: "100", goldPrice: "" }}
                tab={4}
            />,
        );

        expect(
            view.getByText("Isi harga emas/gram untuk menghitung zakat."),
        ).toBeTruthy();
        expect(view.queryByText(/Nisab emas:/)).toBeNull();
        expect(view.queryByTestId("web-app-zakat-save")).toBeNull();
    });

    test("an empty silver price asks for it too", () => {
        const view = render(
            <ZakatHarness
                initial={{ goldGrams: "100", silverPrice: "" }}
                tab={4}
            />,
        );

        expect(
            view.getByText("Isi harga perak/gram untuk menghitung zakat."),
        ).toBeTruthy();
        expect(view.queryByTestId("web-app-zakat-save")).toBeNull();
    });
});

describe("WebAppZakatRoute agriculture tab", () => {
    test("653.5 kg stays 653.5 kg and gives Rp 1.045.600", () => {
        const view = render(<ZakatHarness tab={3} />);

        fireEvent.changeText(inputsByPlaceholder(view)[0], "653.5");

        expect(view.getByDisplayValue("653.5")).toBeTruthy();
        expect(view.getAllByText("Rp 1.045.600").length).toBeGreaterThan(0);
        expect(view.getByText("10% x 653,5 kg x Rp 16.000/kg")).toBeTruthy();
    });

    test("653,5 kg with a comma is the same harvest", () => {
        const view = render(<ZakatHarness tab={3} />);

        fireEvent.changeText(inputsByPlaceholder(view)[0], "653,5");

        expect(view.getByDisplayValue("653,5")).toBeTruthy();
        expect(view.getAllByText("Rp 1.045.600").length).toBeGreaterThan(0);
    });

    test("an empty grain price asks for it", () => {
        const view = render(
            <ZakatHarness
                initial={{ harvest: "1000", riceKgPrice: "" }}
                tab={3}
            />,
        );

        expect(
            view.getByText("Isi harga gabah/kg untuk menghitung zakat."),
        ).toBeTruthy();
        expect(view.queryByTestId("web-app-zakat-save")).toBeNull();
    });
});

describe("WebAppZakatRoute maal, trade and fitrah tabs", () => {
    test("an empty gold price no longer computes maal with Rp 1.050.000", () => {
        const view = render(
            <ZakatHarness
                initial={{ assets: "200000000", goldPrice: "" }}
                tab={0}
            />,
        );

        expect(
            view.getByText("Isi harga emas/gram untuk menghitung zakat."),
        ).toBeTruthy();
        expect(view.queryByText(/Nisab: Rp/)).toBeNull();
        expect(view.queryByText("Rp 5.000.000")).toBeNull();
        expect(view.queryByTestId("web-app-zakat-save")).toBeNull();
    });

    test("the maal nisab follows the typed gold price", () => {
        const view = render(<ZakatHarness tab={0} />);

        expect(view.getByText("Nisab: Rp 205.615.000")).toBeTruthy();
    });

    test("the trade tab asks for the gold price as well", () => {
        const view = render(
            <ZakatHarness initial={{ goldPrice: "" }} tab={2} />,
        );

        expect(
            view.getByText("Isi harga emas/gram untuk menghitung zakat."),
        ).toBeTruthy();
    });

    test("an empty rice price gives no fitrah and asks for it", () => {
        const view = render(
            <ZakatHarness initial={{ ricePrice: "" }} tab={1} />,
        );

        expect(
            view.getByText("Isi harga beras/kg untuk menghitung zakat."),
        ).toBeTruthy();
        expect(view.queryByTestId("web-app-zakat-save")).toBeNull();
    });

    test("fitrah with a price is computed and can be saved", () => {
        const view = render(<ZakatHarness tab={1} />);

        expect(view.getAllByText("Rp 40.000").length).toBeGreaterThan(0);
        expect(view.getByTestId("web-app-zakat-save")).toBeTruthy();
    });

    test("currency fields cap at 15 digits", () => {
        const view = render(<ZakatHarness tab={0} />);
        const [, assets] = inputsByPlaceholder(view);

        fireEvent.changeText(assets, "9".repeat(30));

        expect(view.getByDisplayValue("999.999.999.999.999")).toBeTruthy();
        expect(
            view.queryByText(/\d{3}\.\d{3}\.\d{3}\.\d{3}\.\d{3}\.\d{3}/),
        ).toBeNull();
    });
});
