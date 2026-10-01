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

import React from "react";
import { act, fireEvent, render } from "@testing-library/react-native";

import { createExploreClassicRenderers } from "../screens/explore/ExploreClassicRenderers";

const SETTLE_MS = 350;
const waitForDebounce = async () => {
    await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, SETTLE_MS));
    });
};

const ASMAUL_HUSNA_FEATURE = {
    key: "asmaul-husna",
    title: "Asmaul Husna",
    type: "list",
};
const asmaulHusnaItems = () => [
    {
        id: 1,
        title: "Ar-Rahman",
        body: "Yang Maha Pengasih",
        arabic: "الرحمن",
        raw: {},
    },
    {
        id: 2,
        title: "Ar-Rahim",
        body: "Yang Maha Penyayang",
        arabic: "الرحيم",
        raw: {},
    },
    {
        id: 3,
        title: "Al-Malik",
        body: "Yang Maha Merajai",
        arabic: "الملك",
        raw: {},
    },
];

const DZIKIR_FEATURE = { key: "dzikir", title: "Dzikir", type: "list" };
const dzikirItems = () => [
    {
        id: 1,
        title: "Subhanallah",
        body: "Maha Suci Allah",
        raw: { category: "pagi" },
    },
    {
        id: 2,
        title: "Alhamdulillah",
        body: "Segala puji bagi Allah",
        raw: { category: "dzikir_umum" },
    },
    {
        id: 3,
        title: "Allahu Akbar",
        body: "Allah Maha Besar",
        raw: { category: "umum" },
    },
];

const DOA_FEATURE = { key: "doa", title: "Doa", type: "list" };
const doaItems = () => [
    {
        id: 1,
        title: "Doa Bangun Tidur",
        body: "Alhamdulillahilladzi ahyana...",
        raw: { category: "" },
    },
    {
        id: 2,
        title: "Doa Sebelum Makan",
        body: "Allahumma barik lana...",
        raw: { category: "makan" },
    },
    {
        id: 3,
        title: "Doa Naik Kendaraan",
        body: "Subhanalladzi sakhkhara lana...",
        raw: { category: "safar" },
    },
];

function ClassicReferenceList({ feature, items, onOpenItem, onItemMenu }) {
    const renderers = createExploreClassicRenderers({
        activeFeature: feature,
        isDarkTheme: false,
        isWebAppLayout: false,
        items,
        openItemDetail: onOpenItem ?? jest.fn(),
        session: null,
        setItemActionSheet: onItemMenu ?? jest.fn(),
    });
    return renderers.renderFeatureContent();
}

describe("Classic reference-list search and filter (B14)", () => {
    test("asmaul-husna has no category chips but search filters by name", async () => {
        const view = render(
            <ClassicReferenceList
                feature={ASMAUL_HUSNA_FEATURE}
                items={asmaulHusnaItems()}
            />,
        );

        expect(view.getByText("Ar-Rahman")).toBeTruthy();
        expect(view.getByText("Ar-Rahim")).toBeTruthy();
        expect(view.getByText("Al-Malik")).toBeTruthy();
        expect(view.queryByText("Semua")).toBeNull();
        expect(view.getByText("3 nama tersedia")).toBeTruthy();

        fireEvent.changeText(
            view.getByPlaceholderText(
                "Cari nama Allah, arti, atau transliterasi...",
            ),
            "rahim",
        );
        await waitForDebounce();

        expect(view.queryByText("Ar-Rahman")).toBeNull();
        expect(view.queryByText("Al-Malik")).toBeNull();
        expect(view.getByText("Ar-Rahim")).toBeTruthy();
        expect(view.getByText("Menampilkan 1 dari 3 nama")).toBeTruthy();
    });

    test("asmaul-husna search echoes every keystroke immediately but filters after debounce", async () => {
        const view = render(
            <ClassicReferenceList
                feature={ASMAUL_HUSNA_FEATURE}
                items={asmaulHusnaItems()}
            />,
        );
        const input = view.getByPlaceholderText(
            "Cari nama Allah, arti, atau transliterasi...",
        );

        fireEvent.changeText(input, "r");
        fireEvent.changeText(input, "ra");
        fireEvent.changeText(input, "rah");

        expect(input.props.value).toBe("rah");
        expect(view.getByText("Ar-Rahman")).toBeTruthy();
        expect(view.getByText("Al-Malik")).toBeTruthy();

        await waitForDebounce();

        expect(view.queryByText("Al-Malik")).toBeNull();
        expect(view.getByText("Ar-Rahman")).toBeTruthy();
    });

    test("asmaul-husna shows a no-results message when the filter matches nothing", async () => {
        const view = render(
            <ClassicReferenceList
                feature={ASMAUL_HUSNA_FEATURE}
                items={asmaulHusnaItems()}
            />,
        );

        fireEvent.changeText(
            view.getByPlaceholderText(
                "Cari nama Allah, arti, atau transliterasi...",
            ),
            "zzz-tidak-ada",
        );
        await waitForDebounce();

        expect(view.queryByText("Ar-Rahman")).toBeNull();
        expect(
            view.getByText(
                "Tidak ada nama yang cocok dengan pencarian atau kategori ini.",
            ),
        ).toBeTruthy();
    });

    test("tapping an asmaul-husna card opens its detail via openItemDetail", async () => {
        const onOpenItem = jest.fn();
        const items = asmaulHusnaItems();
        const view = render(
            <ClassicReferenceList
                feature={ASMAUL_HUSNA_FEATURE}
                items={items}
                onOpenItem={onOpenItem}
            />,
        );
        await waitForDebounce();

        fireEvent.press(view.getByText("Ar-Rahim"));

        expect(onOpenItem).toHaveBeenCalledTimes(1);
        expect(onOpenItem).toHaveBeenCalledWith(items[1]);
    });

    test("dzikir category chips filter items and alias dzikir_umum to the Umum chip", async () => {
        const view = render(
            <ClassicReferenceList
                feature={DZIKIR_FEATURE}
                items={dzikirItems()}
            />,
        );
        await waitForDebounce();

        expect(view.getByText("3 dzikir tersedia")).toBeTruthy();
        expect(view.getByText("Subhanallah")).toBeTruthy();
        expect(view.getByText("Alhamdulillah")).toBeTruthy();
        expect(view.getByText("Allahu Akbar")).toBeTruthy();

        fireEvent.press(view.getByText("Umum"));

        expect(view.queryByText("Subhanallah")).toBeNull();
        expect(view.getByText("Alhamdulillah")).toBeTruthy();
        expect(view.getByText("Allahu Akbar")).toBeTruthy();
        expect(view.getByText("Menampilkan 2 dari 3 dzikir")).toBeTruthy();

        fireEvent.press(view.getByText("Umum"));

        expect(view.getByText("Subhanallah")).toBeTruthy();
        expect(view.getByText("3 dzikir tersedia")).toBeTruthy();
    });

    test("doa uses its own bespoke category list and matches Bangun by title fallback", async () => {
        const view = render(
            <ClassicReferenceList feature={DOA_FEATURE} items={doaItems()} />,
        );
        await waitForDebounce();

        expect(view.getByText("3 doa tersedia")).toBeTruthy();
        expect(view.getByText("Bangun")).toBeTruthy();
        expect(view.getByText("Makan")).toBeTruthy();
        expect(view.getByText("Safar")).toBeTruthy();

        fireEvent.press(view.getByText("Bangun"));

        expect(view.getByText("Doa Bangun Tidur")).toBeTruthy();
        expect(view.queryByText("Doa Sebelum Makan")).toBeNull();
        expect(view.queryByText("Doa Naik Kendaraan")).toBeNull();
        expect(view.getByText("Menampilkan 1 dari 3 doa")).toBeTruthy();
    });

    test("doa search filters by body text after the debounce settles", async () => {
        const view = render(
            <ClassicReferenceList feature={DOA_FEATURE} items={doaItems()} />,
        );

        fireEvent.changeText(
            view.getByPlaceholderText("Cari doa, kategori, atau sumber..."),
            "kendaraan",
        );
        await waitForDebounce();

        expect(view.getByText("Doa Naik Kendaraan")).toBeTruthy();
        expect(view.queryByText("Doa Bangun Tidur")).toBeNull();
        expect(view.queryByText("Doa Sebelum Makan")).toBeNull();
    });

    test("renderItem no longer renders a duplicate unfiltered card for reference-list features", () => {
        const items = asmaulHusnaItems();
        const renderers = createExploreClassicRenderers({
            activeFeature: ASMAUL_HUSNA_FEATURE,
            isDarkTheme: false,
            isWebAppLayout: false,
            items,
            openItemDetail: jest.fn(),
            session: null,
            setItemActionSheet: jest.fn(),
        });

        expect(renderers.renderItem(items[0], 0)).toBeNull();
    });
});
