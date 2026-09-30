jest.mock("../api/imsakiyah", () => ({
    getImsakiyahMonth: jest.fn(),
}));

import React from "react";
import { act, fireEvent, render, within } from "@testing-library/react-native";
import { ScrollView, StyleSheet } from "react-native";

import { WebAppImsakiyahRoute } from "../screens/explore/WebAppImsakiyahRoute";
import { flushAsyncWork } from "../test-utils/async";

const { getImsakiyahMonth } = require("../api/imsakiyah");

const COLUMN_LABELS = [
    "Imsak",
    "Subuh",
    "Terbit",
    "Dzuhur",
    "Asr",
    "Maghrib",
    "Isya",
];

const makeRow = (date, prayers = {}) => ({
    date,
    prayers: {
        imsak: "04:10",
        fajr: "04:20",
        sunrise: "05:38",
        dhuhr: "11:43",
        asr: "14:49",
        maghrib: "17:47",
        isha: "18:56",
        ...prayers,
    },
});

const septemberRows = [
    makeRow("2026-09-29", { maghrib: "17:52" }),
    makeRow("2026-09-30", { maghrib: "17:51" }),
];
const septemberItems = septemberRows.map((raw, index) => ({
    id: `imsak-${index}`,
    raw,
}));
const octoberRows = [
    makeRow("2026-10-01", { imsak: "04:05", maghrib: "17:50" }),
    makeRow("2026-10-02", { imsak: "04:04", maghrib: "17:49" }),
    makeRow("2026-10-03", { imsak: "04:03", maghrib: "17:49" }),
];
const novemberRows = [
    makeRow("2026-11-01", { imsak: "03:55", maghrib: "17:50" }),
];

const deferred = () => {
    let resolve;
    let reject;
    const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, reject, resolve };
};

const press = async (utils, testID) => {
    fireEvent.press(utils.getByTestId(testID));
    await flushAsyncWork();
};

const labelOf = (utils) =>
    utils.getByTestId("web-app-imsakiyah-month-label").props.children;

beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers({ now: new Date(2026, 8, 30, 10, 0, 0) });
});

afterEach(() => {
    jest.useRealTimers();
});

describe("WebAppImsakiyahRoute table", () => {
    test("shows one header with all seven prayer columns", () => {
        const utils = render(<WebAppImsakiyahRoute items={septemberItems} />);

        const header = utils.getByTestId("web-app-imsakiyah-header");
        COLUMN_LABELS.forEach((label) => {
            expect(within(header).getByText(label)).toBeTruthy();
        });
        expect(within(header).getByText("No")).toBeTruthy();
    });

    test("renders every time of every row, including Maghrib", () => {
        const utils = render(<WebAppImsakiyahRoute items={septemberItems} />);

        const rows = utils.getAllByTestId("web-app-imsakiyah-row");
        expect(rows).toHaveLength(2);
        rows.forEach((row) => {
            expect(within(row).getAllByText(/^\d{2}:\d{2}$/)).toHaveLength(7);
        });
        expect(within(rows[0]).getByText("17:52")).toBeTruthy();
        expect(within(rows[1]).getByText("17:51")).toBeTruthy();
    });

    test("uses a single shared horizontal scroller instead of one per row", () => {
        const utils = render(<WebAppImsakiyahRoute items={septemberItems} />);

        const horizontal = utils
            .UNSAFE_getAllByType(ScrollView)
            .filter((scroller) => scroller.props.horizontal);
        expect(horizontal).toHaveLength(1);
        expect(horizontal[0].props.testID).toBe(
            "web-app-imsakiyah-table-scroll",
        );
        utils.getAllByTestId("web-app-imsakiyah-row").forEach((row) => {
            expect(within(row).UNSAFE_queryAllByType(ScrollView)).toHaveLength(
                0,
            );
        });
    });

    test("labels each time for screen readers now that labels moved to the header", () => {
        const utils = render(<WebAppImsakiyahRoute items={septemberItems} />);

        const maghrib = within(
            utils.getAllByTestId("web-app-imsakiyah-row")[1],
        ).getByText("17:51");
        expect(maghrib.props.accessibilityLabel).toBe("Maghrib 17:51");
    });

    test("highlights only today's row", () => {
        const utils = render(<WebAppImsakiyahRoute items={septemberItems} />);

        const [yesterday, today] = utils.getAllByTestId(
            "web-app-imsakiyah-row",
        );
        expect(StyleSheet.flatten(today.props.style).backgroundColor).toBe(
            "#ecfdf5",
        );
        expect(
            StyleSheet.flatten(yesterday.props.style).backgroundColor,
        ).toBeUndefined();
    });

    test("labels the visible month from the first row", () => {
        const utils = render(<WebAppImsakiyahRoute items={septemberItems} />);

        expect(labelOf(utils)).toBe("September 2026");
    });
});

describe("WebAppImsakiyahRoute month arrows", () => {
    test("moves to the next month and shows that month's schedule", async () => {
        getImsakiyahMonth.mockResolvedValue(octoberRows);
        const utils = render(<WebAppImsakiyahRoute items={septemberItems} />);

        await press(utils, "web-app-imsakiyah-next-month");

        expect(getImsakiyahMonth).toHaveBeenCalledTimes(1);
        expect(getImsakiyahMonth).toHaveBeenCalledWith({
            month: 10,
            year: 2026,
        });
        expect(labelOf(utils)).toBe("Oktober 2026");
        const rows = utils.getAllByTestId("web-app-imsakiyah-row");
        expect(rows).toHaveLength(3);
        expect(within(rows[0]).getByText("04:05")).toBeTruthy();
        expect(within(rows[0]).getByText("1")).toBeTruthy();
        expect(utils.queryByText("17:52")).toBeNull();
    });

    test("moves back to the previous month", async () => {
        getImsakiyahMonth.mockResolvedValue(octoberRows);
        const utils = render(<WebAppImsakiyahRoute items={septemberItems} />);

        await press(utils, "web-app-imsakiyah-prev-month");

        expect(getImsakiyahMonth).toHaveBeenCalledWith({
            month: 8,
            year: 2026,
        });
        expect(labelOf(utils)).toBe("Agustus 2026");
    });

    test("returns to the original month without fetching it again", async () => {
        getImsakiyahMonth.mockResolvedValue(octoberRows);
        const utils = render(<WebAppImsakiyahRoute items={septemberItems} />);

        await press(utils, "web-app-imsakiyah-next-month");
        await press(utils, "web-app-imsakiyah-prev-month");

        expect(getImsakiyahMonth).toHaveBeenCalledTimes(1);
        expect(labelOf(utils)).toBe("September 2026");
        expect(utils.getAllByTestId("web-app-imsakiyah-row")).toHaveLength(2);
        expect(utils.getByText("17:52")).toBeTruthy();
    });

    test("does not refetch a month that already loaded", async () => {
        getImsakiyahMonth.mockResolvedValue(octoberRows);
        const utils = render(<WebAppImsakiyahRoute items={septemberItems} />);

        await press(utils, "web-app-imsakiyah-next-month");
        await press(utils, "web-app-imsakiyah-prev-month");
        await press(utils, "web-app-imsakiyah-next-month");

        expect(getImsakiyahMonth).toHaveBeenCalledTimes(1);
        expect(labelOf(utils)).toBe("Oktober 2026");
        expect(utils.getAllByTestId("web-app-imsakiyah-row")).toHaveLength(3);
    });

    test("wraps from December to January of the next year", async () => {
        getImsakiyahMonth.mockResolvedValue([makeRow("2027-01-01")]);
        const utils = render(
            <WebAppImsakiyahRoute
                items={[{ id: "dec", raw: makeRow("2026-12-01") }]}
            />,
        );

        await press(utils, "web-app-imsakiyah-next-month");

        expect(getImsakiyahMonth).toHaveBeenCalledWith({
            month: 1,
            year: 2027,
        });
        expect(labelOf(utils)).toBe("Januari 2027");
    });

    test("wraps from January to December of the previous year", async () => {
        getImsakiyahMonth.mockResolvedValue([makeRow("2026-12-01")]);
        const utils = render(
            <WebAppImsakiyahRoute
                items={[{ id: "jan", raw: makeRow("2027-01-01") }]}
            />,
        );

        await press(utils, "web-app-imsakiyah-prev-month");

        expect(getImsakiyahMonth).toHaveBeenCalledWith({
            month: 12,
            year: 2026,
        });
        expect(labelOf(utils)).toBe("Desember 2026");
    });

    test("shows a loading state while another month is fetched", async () => {
        const pending = deferred();
        getImsakiyahMonth.mockReturnValue(pending.promise);
        const utils = render(<WebAppImsakiyahRoute items={septemberItems} />);

        await press(utils, "web-app-imsakiyah-next-month");

        expect(utils.getByText("Memuat imsakiyah...")).toBeTruthy();
        expect(utils.queryByTestId("web-app-imsakiyah-header")).toBeNull();
        expect(labelOf(utils)).toBe("Oktober 2026");

        await act(async () => {
            pending.resolve(octoberRows);
        });
        await flushAsyncWork();

        expect(utils.queryByText("Memuat imsakiyah...")).toBeNull();
        expect(utils.getAllByTestId("web-app-imsakiyah-row")).toHaveLength(3);
    });

    test("shows an error with a retry button when another month fails", async () => {
        getImsakiyahMonth.mockRejectedValueOnce(new Error("offline"));
        getImsakiyahMonth.mockResolvedValueOnce(octoberRows);
        const utils = render(<WebAppImsakiyahRoute items={septemberItems} />);

        await press(utils, "web-app-imsakiyah-next-month");

        expect(
            utils.getByText("Gagal memuat data. Periksa koneksi internet."),
        ).toBeTruthy();
        expect(utils.queryByTestId("web-app-imsakiyah-header")).toBeNull();

        await press(utils, "web-app-imsakiyah-retry");

        expect(getImsakiyahMonth).toHaveBeenCalledTimes(2);
        expect(
            utils.queryByText("Gagal memuat data. Periksa koneksi internet."),
        ).toBeNull();
        expect(utils.getAllByTestId("web-app-imsakiyah-row")).toHaveLength(3);
    });

    test("retries a failed month when the user comes back to it", async () => {
        getImsakiyahMonth.mockRejectedValueOnce(new Error("offline"));
        getImsakiyahMonth.mockResolvedValue(octoberRows);
        const utils = render(<WebAppImsakiyahRoute items={septemberItems} />);

        await press(utils, "web-app-imsakiyah-next-month");
        await press(utils, "web-app-imsakiyah-prev-month");
        await press(utils, "web-app-imsakiyah-next-month");

        expect(getImsakiyahMonth).toHaveBeenCalledTimes(2);
        expect(utils.getAllByTestId("web-app-imsakiyah-row")).toHaveLength(3);
    });

    test("ignores a slow response for a month the user already left", async () => {
        const slowOctober = deferred();
        getImsakiyahMonth.mockReturnValueOnce(slowOctober.promise);
        getImsakiyahMonth.mockResolvedValueOnce(novemberRows);
        const utils = render(<WebAppImsakiyahRoute items={septemberItems} />);

        await press(utils, "web-app-imsakiyah-next-month");
        await press(utils, "web-app-imsakiyah-next-month");
        expect(labelOf(utils)).toBe("November 2026");
        expect(utils.getAllByTestId("web-app-imsakiyah-row")).toHaveLength(1);

        await act(async () => {
            slowOctober.resolve(octoberRows);
        });
        await flushAsyncWork();

        expect(labelOf(utils)).toBe("November 2026");
        expect(utils.getAllByTestId("web-app-imsakiyah-row")).toHaveLength(1);
        expect(utils.getByText("03:55")).toBeTruthy();
    });

    test("only lets the user browse a year in either direction", async () => {
        getImsakiyahMonth.mockResolvedValue(octoberRows);
        const utils = render(<WebAppImsakiyahRoute items={septemberItems} />);
        const next = () => utils.getByTestId("web-app-imsakiyah-next-month");
        const prev = () => utils.getByTestId("web-app-imsakiyah-prev-month");

        for (let step = 0; step < 12; step += 1) {
            expect(next().props.accessibilityState.disabled).toBe(false);
            await press(utils, "web-app-imsakiyah-next-month");
        }
        expect(labelOf(utils)).toBe("September 2027");
        expect(next().props.accessibilityState.disabled).toBe(true);
        expect(prev().props.accessibilityState.disabled).toBe(false);
        const callsAtLimit = getImsakiyahMonth.mock.calls.length;

        await press(utils, "web-app-imsakiyah-next-month");
        expect(getImsakiyahMonth).toHaveBeenCalledTimes(callsAtLimit);
        expect(labelOf(utils)).toBe("September 2027");

        for (let step = 0; step < 24; step += 1) {
            expect(prev().props.accessibilityState.disabled).toBe(false);
            await press(utils, "web-app-imsakiyah-prev-month");
        }
        expect(labelOf(utils)).toBe("September 2025");
        expect(prev().props.accessibilityState.disabled).toBe(true);
        expect(next().props.accessibilityState.disabled).toBe(false);
    });

    test("labels the arrows for screen readers", () => {
        const utils = render(<WebAppImsakiyahRoute items={septemberItems} />);

        expect(
            utils.getByLabelText("Bulan sebelumnya").props.accessibilityRole,
        ).toBe("button");
        expect(
            utils.getByLabelText("Bulan berikutnya").props.accessibilityRole,
        ).toBe("button");
    });
});

describe("WebAppImsakiyahRoute without loaded items", () => {
    test("navigates relative to the device month when nothing loaded", async () => {
        getImsakiyahMonth.mockResolvedValue(octoberRows);
        const utils = render(<WebAppImsakiyahRoute error items={[]} />);

        expect(labelOf(utils)).toBe("September 2026");
        expect(
            utils.getByText("Gagal memuat data. Periksa koneksi internet."),
        ).toBeTruthy();
        expect(utils.queryByTestId("web-app-imsakiyah-retry")).toBeNull();

        await press(utils, "web-app-imsakiyah-next-month");

        expect(getImsakiyahMonth).toHaveBeenCalledWith({
            month: 10,
            year: 2026,
        });
        expect(
            utils.queryByText("Gagal memuat data. Periksa koneksi internet."),
        ).toBeNull();
        expect(utils.getAllByTestId("web-app-imsakiyah-row")).toHaveLength(3);
    });

    test("shows the loading state of the current month from props", () => {
        const utils = render(<WebAppImsakiyahRoute items={[]} loading />);

        expect(utils.getByText("Memuat imsakiyah...")).toBeTruthy();
        expect(utils.queryByTestId("web-app-imsakiyah-header")).toBeNull();
    });

    test("shows the empty state when the month has no schedule", async () => {
        getImsakiyahMonth.mockResolvedValue([]);
        const utils = render(<WebAppImsakiyahRoute items={[]} />);

        expect(
            utils.getByText("Jadwal imsakiyah belum tersedia."),
        ).toBeTruthy();

        await press(utils, "web-app-imsakiyah-next-month");

        expect(getImsakiyahMonth).toHaveBeenCalledWith({
            month: 10,
            year: 2026,
        });
        expect(labelOf(utils)).toBe("Oktober 2026");
        expect(
            utils.getByText("Jadwal imsakiyah belum tersedia."),
        ).toBeTruthy();
    });
});
