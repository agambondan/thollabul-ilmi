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

import React, { useCallback, useState } from "react";
import {
    act,
    fireEvent,
    render,
    renderHook,
    waitFor,
    within,
} from "@testing-library/react-native";

import { MAX_AUTO_LOAD_PAGES, useAutoLoadMore } from "../hooks/useAutoLoadMore";
import { WebAppDoaRoute } from "../screens/explore/WebAppDoaRoute";
import { WebAppReferenceListRoute } from "../screens/explore/WebAppReferenceListRoute";
import {
    EXPLORE_PAGE_SIZE,
    EXPLORE_REFERENCE_PAGE_SIZE,
    getFeaturePageSize,
} from "../screens/ExploreScreen.helpers";

const makeItem = (id, category, extra = {}) => ({
    id,
    title: extra.title ?? `Item ${id}`,
    body: extra.body ?? `Isi ${id}`,
    raw: { category, ...extra.raw },
});

function PagedHarness({ children, pages, spy }) {
    const [state, setState] = useState({
        items: pages[0],
        loadingMore: false,
        page: 0,
    });
    const hasMore = state.page < pages.length - 1;

    const loadMore = useCallback(() => {
        spy();
        setState((current) => ({ ...current, loadingMore: true }));
        Promise.resolve().then(() =>
            setState((current) => ({
                items: [...current.items, ...pages[current.page + 1]],
                loadingMore: false,
                page: current.page + 1,
            })),
        );
    }, [pages, spy]);

    return children({
        items: state.items,
        onLoadMore: loadMore,
        pagination: {
            hasMore,
            loadingMore: state.loadingMore,
            page: state.page,
        },
    });
}

const renderDzikir = (pages, spy, key = "dzikir") =>
    render(
        <PagedHarness pages={pages} spy={spy}>
            {(props) => (
                <WebAppReferenceListRoute
                    error=''
                    feature={{ key }}
                    loading={false}
                    onOpenItem={jest.fn()}
                    routeKey={key}
                    {...props}
                />
            )}
        </PagedHarness>,
    );

describe("feature page size for small reference datasets (B5)", () => {
    test("loads Dzikir, Wirid, Doa, Asmaul Husna and Manasik in one page", () => {
        ["dzikir", "wirid", "doa", "asmaul-husna", "manasik"].forEach((key) => {
            expect(getFeaturePageSize({ key })).toBe(
                EXPLORE_REFERENCE_PAGE_SIZE,
            );
        });
        expect(EXPLORE_REFERENCE_PAGE_SIZE).toBeGreaterThanOrEqual(99);
    });

    test("keeps the default page size for every other feature", () => {
        expect(getFeaturePageSize({ key: "kajian" })).toBe(EXPLORE_PAGE_SIZE);
        expect(getFeaturePageSize({ key: "sejarah" })).toBe(EXPLORE_PAGE_SIZE);
        expect(getFeaturePageSize(null)).toBe(EXPLORE_PAGE_SIZE);
    });
});

describe("useAutoLoadMore (B5)", () => {
    test("requests the next page while a filter is active and more pages exist", () => {
        const onLoadMore = jest.fn();
        renderHook(() =>
            useAutoLoadMore({ active: true, hasMore: true, onLoadMore }),
        );
        expect(onLoadMore).toHaveBeenCalledTimes(1);
    });

    test.each([
        ["no filter is active", { active: false }, false],
        ["there is nothing more to load", { hasMore: false }, false],
        ["a page is already loading", { busy: true }, true],
        ["the list is in an error state", { error: true }, false],
    ])("stays idle when %s", (_label, overrides, expectedAutoLoading) => {
        const onLoadMore = jest.fn();
        const { result } = renderHook(() =>
            useAutoLoadMore({
                active: true,
                hasMore: true,
                onLoadMore,
                ...overrides,
            }),
        );
        expect(onLoadMore).not.toHaveBeenCalled();
        expect(result.current.autoLoading).toBe(expectedAutoLoading);
    });

    test("keeps loading one page at a time and stops at the cap", () => {
        const onLoadMore = jest.fn();
        const { rerender } = renderHook(
            ({ busy }) =>
                useAutoLoadMore({
                    active: true,
                    busy,
                    hasMore: true,
                    maxPages: 3,
                    onLoadMore,
                }),
            { initialProps: { busy: false } },
        );

        for (let page = 0; page < 6; page += 1) {
            rerender({ busy: true });
            rerender({ busy: false });
        }

        expect(onLoadMore).toHaveBeenCalledTimes(3);
    });

    test("reports autoLoading only until the cap is reached", () => {
        const onLoadMore = jest.fn();
        const { result, rerender } = renderHook(
            ({ busy }) =>
                useAutoLoadMore({
                    active: true,
                    busy,
                    hasMore: true,
                    maxPages: 1,
                    onLoadMore,
                }),
            { initialProps: { busy: false } },
        );
        expect(onLoadMore).toHaveBeenCalledTimes(1);

        rerender({ busy: true });
        rerender({ busy: false });

        expect(result.current.autoLoading).toBe(false);
        expect(MAX_AUTO_LOAD_PAGES).toBeGreaterThan(1);
    });

    test("starts counting again when the filter changes", () => {
        const onLoadMore = jest.fn();
        const { rerender } = renderHook(
            ({ busy, resetKey }) =>
                useAutoLoadMore({
                    active: true,
                    busy,
                    hasMore: true,
                    maxPages: 1,
                    onLoadMore,
                    resetKey,
                }),
            { initialProps: { busy: false, resetKey: "a" } },
        );
        rerender({ busy: true, resetKey: "a" });
        rerender({ busy: false, resetKey: "a" });
        expect(onLoadMore).toHaveBeenCalledTimes(1);

        rerender({ busy: false, resetKey: "b" });
        expect(onLoadMore).toHaveBeenCalledTimes(2);
    });
});

describe("reference list filters cover pages that are not loaded yet (B5)", () => {
    const dzikirPages = [
        [
            makeItem(1, "pagi", { title: "Dzikir Pagi 1" }),
            makeItem(2, "dzikir_umum", { title: "Tahlil" }),
        ],
        [makeItem(3, "tidur", { title: "Dzikir Tidur" })],
        [
            makeItem(4, "petang", { title: "Dzikir Petang 1" }),
            makeItem(5, "petang", { title: "Dzikir Petang 2" }),
        ],
    ];

    test("a category whose items exist only on later pages becomes populated", async () => {
        const spy = jest.fn();
        const view = renderDzikir(dzikirPages, spy);

        expect(view.getByText("2 dzikir tersedia")).toBeTruthy();
        expect(spy).not.toHaveBeenCalled();
        expect(view.getByTestId("web-app-dzikir-load-more")).toBeTruthy();

        fireEvent.press(view.getByText("Petang"));

        expect(view.queryByText("Data tidak ditemukan.")).toBeNull();
        expect(view.getByText("Memuat dzikir...")).toBeTruthy();
        expect(view.queryByTestId("web-app-dzikir-load-more")).toBeNull();

        await waitFor(() => {
            expect(view.getByText("Dzikir Petang 1")).toBeTruthy();
            expect(view.getByText("Dzikir Petang 2")).toBeTruthy();
        });
        expect(view.queryByText("Dzikir Pagi 1")).toBeNull();
        expect(view.queryByText("Data tidak ditemukan.")).toBeNull();
        expect(view.queryByText("Memuat dzikir...")).toBeNull();
        expect(spy).toHaveBeenCalledTimes(2);
        expect(view.getByText("Menampilkan 2 dari 5 dzikir")).toBeTruthy();
    });

    test("a search term that only matches a later page finds it", async () => {
        const spy = jest.fn();
        const view = renderDzikir(dzikirPages, spy);

        fireEvent.changeText(
            view.getByTestId("web-app-dzikir-search"),
            "tidur",
        );

        await waitFor(() => {
            expect(view.getByText("Dzikir Tidur")).toBeTruthy();
        });
        expect(view.queryByText("Data tidak ditemukan.")).toBeNull();
        expect(spy.mock.calls.length).toBeGreaterThanOrEqual(1);
    });

    test("keeps loading until the data is exhausted, then shows the empty state", async () => {
        const spy = jest.fn();
        const view = renderDzikir(dzikirPages, spy);

        fireEvent.changeText(
            view.getByTestId("web-app-dzikir-search"),
            "tidak ada yang cocok",
        );

        await waitFor(() => {
            expect(view.getByText("Data tidak ditemukan.")).toBeTruthy();
        });
        expect(spy).toHaveBeenCalledTimes(2);
        expect(view.queryByTestId("web-app-dzikir-load-more")).toBeNull();
    });

    test("does not load extra pages while no filter is active", async () => {
        const spy = jest.fn();
        renderDzikir(dzikirPages, spy);

        await act(async () => {
            await Promise.resolve();
        });
        expect(spy).not.toHaveBeenCalled();
    });

    test("finds Asmaul Husna names on a later page by search", async () => {
        const spy = jest.fn();
        const pages = [
            [
                {
                    id: 1,
                    title: "Ar-Rahman",
                    raw: { name: "Ar-Rahman", number: 1 },
                },
            ],
            [
                {
                    id: 54,
                    title: "Al-Qawiyy",
                    body: "Yang Maha Kuat",
                    raw: { name: "Al-Qawiyy", number: 54 },
                },
            ],
        ];
        const view = renderDzikir(pages, spy, "asmaul-husna");

        fireEvent.changeText(
            view.getByTestId("web-app-asmaul-husna-search"),
            "kuat",
        );

        await waitFor(() => {
            expect(view.getByText("Al-Qawiyy")).toBeTruthy();
        });
        expect(view.queryByText("Data tidak ditemukan.")).toBeNull();
    });

    test("falls back to the manual load more button when loading fails", () => {
        const onLoadMore = jest.fn();
        const view = render(
            <WebAppReferenceListRoute
                error='gagal'
                feature={{ key: "dzikir" }}
                items={[makeItem(1, "pagi")]}
                loading={false}
                onLoadMore={onLoadMore}
                pagination={{ hasMore: true, loadingMore: false }}
                routeKey='dzikir'
            />,
        );

        fireEvent.press(view.getByText("Petang"));
        expect(onLoadMore).not.toHaveBeenCalled();
    });
});

describe("reference category keys are normalized (B5)", () => {
    const umumItems = [
        makeItem(1, "dzikir_umum", { title: "Tahlil" }),
        makeItem(2, "pagi", { title: "Dzikir Pagi" }),
    ];

    test.each([
        ["dzikir", 7],
        ["wirid", 6],
    ])(
        "the Umum chip of %s matches items stored as dzikir_umum",
        (key, chipCount) => {
            const view = render(
                <WebAppReferenceListRoute
                    error=''
                    feature={{ key }}
                    items={umumItems}
                    loading={false}
                    onOpenItem={jest.fn()}
                    pagination={{ hasMore: false, loadingMore: false }}
                    routeKey={key}
                />,
            );
            const chips = view.getAllByTestId(`web-app-${key}-category`);

            expect(chips).toHaveLength(chipCount);
            expect(view.queryByText("Dzikir Umum")).toBeNull();

            const umumChip = chips.find(
                (chip) => within(chip).queryByText("Umum") !== null,
            );
            fireEvent.press(umumChip);

            expect(view.getByText("Tahlil")).toBeTruthy();
            expect(view.queryByText("Dzikir Pagi")).toBeNull();
            expect(view.getByText(`Menampilkan 1 dari 2 ${key}`)).toBeTruthy();
        },
    );
});

describe("Doa route filters cover pages that are not loaded yet (B5)", () => {
    const doaPages = [
        [makeItem(1, "pagi", { title: "Doa Pagi" })],
        [makeItem(2, "makan", { title: "Doa Sebelum Makan" })],
    ];

    const renderDoa = (spy) =>
        render(
            <PagedHarness pages={doaPages} spy={spy}>
                {(props) => (
                    <WebAppDoaRoute
                        error=''
                        loading={false}
                        navigation={{ setHeader: jest.fn() }}
                        onOpenItem={jest.fn()}
                        {...props}
                    />
                )}
            </PagedHarness>,
        );

    test("a category on the second page becomes populated without pressing load more", async () => {
        const spy = jest.fn();
        const view = renderDoa(spy);

        expect(view.getByText("1 doa tersedia")).toBeTruthy();
        fireEvent.press(view.getByText("Makan"));

        expect(view.queryByText("Tidak ada doa yang cocok.")).toBeNull();
        expect(view.getByText("Memuat doa...")).toBeTruthy();

        await waitFor(() => {
            expect(view.getByText("Doa Sebelum Makan")).toBeTruthy();
        });
        expect(view.queryByText("Memuat doa...")).toBeNull();
        expect(view.queryByTestId("web-app-doa-load-more")).toBeNull();
        expect(spy).toHaveBeenCalledTimes(1);
    });

    test("shows the empty state once every page is loaded and nothing matches", async () => {
        const spy = jest.fn();
        const view = renderDoa(spy);

        fireEvent.press(view.getByText("Safar"));

        await waitFor(() => {
            expect(view.getByText("Tidak ada doa yang cocok.")).toBeTruthy();
        });
        expect(spy).toHaveBeenCalledTimes(1);
    });
});
