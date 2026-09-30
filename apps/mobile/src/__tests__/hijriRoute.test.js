import React from "react";
import { fireEvent, render, within } from "@testing-library/react-native";

import { WebAppHijriRoute } from "../screens/explore/WebAppHijriRoute";

const todayItem = {
    id: "hijri-today",
    title: "Today",
    body: "12 Dzulhijjah 1447 H",
    raw: {
        day: 12,
        month: 12,
        month_name: "Dzulhijjah",
        type: "hijri_today",
        year: 1447,
        gregorian_year: 2026,
        gregorian_month: 5,
        gregorian_day: 29,
    },
};

const inputOf = (utils) => utils.getByTestId("web-app-hijri-converter-input");
const resultOf = (utils) =>
    utils.queryByTestId("web-app-hijri-converter-result");

describe("WebAppHijriRoute converter", () => {
    test("starts with today's date and today's Hijri result", () => {
        const utils = render(<WebAppHijriRoute items={[todayItem]} />);

        expect(inputOf(utils).props.value).toBe("2026-05-29");
        expect(resultOf(utils)).toBeTruthy();
        expect(utils.getAllByText("12 Dzulhijjah 1447 هـ").length).toBe(2);
        expect(
            utils.getByText(
                "Hasil berupa estimasi kalender Hijriah aritmetika. Penetapan resmi mengikuti rukyat hilal dan bisa berbeda 1-2 hari.",
            ),
        ).toBeTruthy();
    });

    test("converts the entered Gregorian date when Konversi is pressed", () => {
        const utils = render(<WebAppHijriRoute items={[todayItem]} />);

        fireEvent.changeText(inputOf(utils), "2027-02-08");
        fireEvent.press(utils.getByTestId("web-app-hijri-converter-button"));

        const result = resultOf(utils);
        expect(result).toBeTruthy();
        expect(utils.getByText("1 Ramadan 1448 هـ")).toBeTruthy();
        expect(utils.getByText("1 Ramadan 1448 H")).toBeTruthy();
        expect(utils.queryByTestId("web-app-hijri-converter-error")).toBeNull();
        expect(inputOf(utils).props.value).toBe("2027-02-08");
    });

    test("does not change the result until the button is pressed", () => {
        const utils = render(<WebAppHijriRoute items={[todayItem]} />);

        fireEvent.changeText(inputOf(utils), "2027-02-08");

        expect(utils.queryByText("1 Ramadan 1448 H")).toBeNull();
        expect(
            utils.getAllByText("12 Dzulhijjah 1447 H").length,
        ).toBeGreaterThan(0);
    });

    test("converts when the keyboard submit key is pressed", () => {
        const utils = render(<WebAppHijriRoute items={[todayItem]} />);

        fireEvent.changeText(inputOf(utils), "2025-03-01");
        fireEvent(inputOf(utils), "submitEditing");

        expect(utils.getByText("1 Ramadan 1446 H")).toBeTruthy();
    });

    test("accepts day-first dates and converts them", () => {
        const utils = render(<WebAppHijriRoute items={[todayItem]} />);

        fireEvent.changeText(inputOf(utils), "30/09/2026");
        fireEvent.press(utils.getByTestId("web-app-hijri-converter-button"));

        expect(utils.getByText("17 Rabiul Akhir 1448 H")).toBeTruthy();
    });

    test("shows a format error and hides the result for unreadable text", () => {
        const utils = render(<WebAppHijriRoute items={[todayItem]} />);

        fireEvent.changeText(inputOf(utils), "kemarin");
        fireEvent.press(utils.getByTestId("web-app-hijri-converter-button"));

        expect(
            utils.getByText(
                "Format tanggal belum sesuai. Tulis seperti 2026-09-30 (tahun-bulan-tanggal).",
            ),
        ).toBeTruthy();
        expect(resultOf(utils)).toBeNull();
    });

    test("shows a date error for impossible calendar dates", () => {
        const utils = render(<WebAppHijriRoute items={[todayItem]} />);

        fireEvent.changeText(inputOf(utils), "2026-02-30");
        fireEvent.press(utils.getByTestId("web-app-hijri-converter-button"));

        expect(
            utils.getByText(
                "Tanggal tidak valid. Periksa bulan (1-12) dan jumlah hari pada bulan tersebut.",
            ),
        ).toBeTruthy();
        expect(resultOf(utils)).toBeNull();
    });

    test("shows a range error for dates before the Hijri calendar", () => {
        const utils = render(<WebAppHijriRoute items={[todayItem]} />);

        fireEvent.changeText(inputOf(utils), "0500-01-01");
        fireEvent.press(utils.getByTestId("web-app-hijri-converter-button"));

        expect(
            utils.getByText(
                "Tanggal harus 19 Juli 622 M atau sesudahnya (awal kalender Hijriah).",
            ),
        ).toBeTruthy();
        expect(resultOf(utils)).toBeNull();
    });

    test("clears the error as soon as the text is edited and recovers", () => {
        const utils = render(<WebAppHijriRoute items={[todayItem]} />);

        fireEvent.changeText(inputOf(utils), "kemarin");
        fireEvent.press(utils.getByTestId("web-app-hijri-converter-button"));
        expect(utils.getByTestId("web-app-hijri-converter-error")).toBeTruthy();

        fireEvent.changeText(inputOf(utils), "2026-09-30");
        expect(utils.queryByTestId("web-app-hijri-converter-error")).toBeNull();

        fireEvent.press(utils.getByTestId("web-app-hijri-converter-button"));
        expect(utils.getByText("17 Rabiul Akhir 1448 H")).toBeTruthy();
        expect(utils.queryByTestId("web-app-hijri-converter-error")).toBeNull();
    });

    test("keeps converting when today's Hijri date could not be loaded", () => {
        const utils = render(<WebAppHijriRoute error items={[]} />);

        expect(inputOf(utils).props.value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(resultOf(utils)).toBeNull();

        fireEvent.changeText(inputOf(utils), "2027-02-08");
        fireEvent.press(utils.getByTestId("web-app-hijri-converter-button"));

        expect(utils.getByText("1 Ramadan 1448 H")).toBeTruthy();
    });

    test("uses the same labels as the today card for the same date", () => {
        const utils = render(<WebAppHijriRoute items={[todayItem]} />);

        fireEvent.press(utils.getByTestId("web-app-hijri-converter-button"));

        expect(
            utils.getAllByText("12 Dzulhijjah 1447 H").length,
        ).toBeGreaterThan(0);
        expect(utils.getAllByText("12 Dzulhijjah 1447 هـ").length).toBe(2);
    });

    test.each([
        ["2026-09-30", 1448, 4, "Rabiul Akhir", 17],
        ["2027-02-08", 1448, 9, "Ramadan", 1],
        ["2025-03-01", 1446, 9, "Ramadan", 1],
        ["2024-07-07", 1445, 12, "Dzulhijjah", 30],
        ["2026-12-31", 1448, 7, "Rajab", 21],
        ["2024-02-29", 1445, 8, "Sya'ban", 19],
        ["2028-02-29", 1449, 10, "Syawal", 3],
        ["2000-01-01", 1420, 9, "Ramadan", 24],
        ["1900-03-01", 1317, 10, "Syawal", 28],
    ])(
        "converting %s reproduces the backend today-card date",
        (gregorian, year, month, monthName, day) => {
            const [gregorianYear, gregorianMonth, gregorianDay] = gregorian
                .split("-")
                .map(Number);
            const utils = render(
                <WebAppHijriRoute
                    items={[
                        {
                            id: "hijri-today",
                            raw: {
                                date_str: `${day} ${monthName} ${year} H`,
                                day,
                                gregorian_day: gregorianDay,
                                gregorian_month: gregorianMonth,
                                gregorian_year: gregorianYear,
                                month,
                                month_name: monthName,
                                type: "hijri_today",
                                year,
                            },
                        },
                    ]}
                />,
            );
            expect(inputOf(utils).props.value).toBe(gregorian);

            fireEvent.press(
                utils.getByTestId("web-app-hijri-converter-button"),
            );

            const result = within(resultOf(utils));
            expect(
                result.getByText(`${day} ${monthName} ${year} H`),
            ).toBeTruthy();
            expect(
                result.getByText(`${day} ${monthName} ${year} هـ`),
            ).toBeTruthy();
        },
    );
});
