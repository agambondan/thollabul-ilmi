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

jest.mock("../screens/HistoricalMapScreen", () => {
    const React = require("react");
    const { Text, View } = require("react-native");

    return {
        HistoricalMapContent: () => (
            <View testID='historical-map-web-app-surface'>
                <Text>Peta Islam Interaktif</Text>
                <Text>Lokasi bersejarah dalam peradaban Islam</Text>
            </View>
        ),
    };
});

jest.mock("../screens/TokohTarikhContent", () => {
    const React = require("react");
    const { Text, View } = require("react-native");

    return {
        TokohTarikhContent: () => (
            <View testID='tokoh-web-app-surface'>
                <Text>Tokoh Tarikh</Text>
                <Text>Biografi ulama, ilmuwan, dan tokoh Islam</Text>
            </View>
        ),
    };
});

import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { StyleSheet, Text } from "react-native";

import { allFeatures } from "../data/mobileFeatures";
import { renderExploreWebAppRoute } from "../screens/explore/ExploreWebAppRoutes";
import {
    WEB_APP_EXPLORE_THEMES,
    createExploreWebAppThemeStyles,
} from "../screens/explore/ExploreWebAppTheme";
import { WEB_APP_REFERENCE_ROUTE_CONFIGS } from "../screens/explore/WebAppReferenceListRoute";
import { WEB_APP_TOOL_ROUTE_CONFIGS } from "../screens/explore/WebAppToolRoute";

const baseContext = (activeFeature, overrides = {}) => ({
    activeFeature,
    answers: {},
    asmaulCounts: {},
    asmaulFlashcardRevealed: false,
    asmaulIndex: 0,
    asmaulLoading: false,
    asmaulNames: [
        {
            id: 1,
            number: 1,
            arabic: "الرَّحْمَنُ",
            transliteration: "Ar-Rahman",
            meaning: "Maha Pengasih",
        },
        {
            id: 2,
            number: 2,
            arabic: "الرَّحِيمُ",
            transliteration: "Ar-Rahim",
            meaning: "Maha Penyayang",
        },
    ],
    blogCategory: "all",
    blogCategoryOptions: [],
    blogSearch: "",
    clearFeature: jest.fn(),
    dictionaryQuery: "",
    editingUserWirdId: "",
    error: "",
    faraidh: {
        bequest: "",
        debts: "",
        estate: "",
        heirs: {
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
        },
    },
    faraidhCatatan: "",
    faraidhHistory: [],
    featureSearch: "",
    fillUserWirdForm: jest.fn(),
    focusDictionaryInput: jest.fn(),
    forumAnswerDraft: "",
    forumAnswers: [],
    forumAskBody: "",
    forumAskTags: "",
    forumAskTitle: "",
    forumDetail: null,
    forumError: "",
    forumHasMore: false,
    forumLoading: false,
    forumPage: 0,
    forumQuestions: [],
    forumSaving: false,
    forumSearch: "",
    forumSlug: "",
    forumTotal: 0,
    forumView: "list",
    forumVotingId: null,
    handleHideFeedItem: jest.fn(),
    handleLikeFeedItem: jest.fn(),
    handleReportFeedItem: jest.fn(),
    handleTogglePinnedFeature: jest.fn(),
    items: [],
    kajianCategory: "all",
    kajianSearch: "",
    leaderboardTab: "streak",
    libraryProgressFilter: "",
    libraryProgressMap: {},
    likingFeedId: null,
    loadFeature: jest.fn(),
    loadZakatHistory: jest.fn(),
    loading: false,
    notesSearch: "",
    onOpenKajianUrl: jest.fn(),
    onOpenTab: jest.fn(),
    loadMoreFeature: jest.fn(),
    openItemDetail: jest.fn(),
    pagination: { hasMore: false, loadingMore: false },
    pinnedFeatureKeys: {},
    recentFeatureKeys: {},
    removeUserWird: jest.fn(),
    renderFeatureContent: () => <Text>Tool content</Text>,
    renderItem: jest.fn(),
    renderItemActionSheet: () => null,
    runDictionarySearch: jest.fn(),
    scoreQuiz: jest.fn(() => 0),
    selectedSurahNumber: null,
    session: null,
    savingFaraidh: false,
    savingUserWird: false,
    setActiveNoteRef: jest.fn(),
    setAnswers: jest.fn(),
    setAsmaulCounts: jest.fn(),
    setAsmaulFlashcardRevealed: jest.fn(),
    setAsmaulIndex: jest.fn(),
    setBlogCategory: jest.fn(),
    setBlogSearch: jest.fn(),
    setDictionaryQuery: jest.fn(),
    setFaraidh: jest.fn(),
    setFaraidhCatatan: jest.fn(),
    setFaraidhHistory: jest.fn(),
    setFeatureSearch: jest.fn(),
    setForumAnswerDraft: jest.fn(),
    setForumAnswers: jest.fn(),
    setForumAskBody: jest.fn(),
    setForumAskTags: jest.fn(),
    setForumAskTitle: jest.fn(),
    setForumDetail: jest.fn(),
    setForumError: jest.fn(),
    setForumHasMore: jest.fn(),
    setForumLoading: jest.fn(),
    setForumPage: jest.fn(),
    setForumQuestions: jest.fn(),
    setForumSaving: jest.fn(),
    setForumSearch: jest.fn(),
    setForumSlug: jest.fn(),
    setForumTotal: jest.fn(),
    setForumView: jest.fn(),
    setForumVotingId: jest.fn(),
    setItemActionSheet: jest.fn(),
    setKajianCategory: jest.fn(),
    setKajianSearch: jest.fn(),
    setLeaderboardTab: jest.fn(),
    setLibraryProgressFilter: jest.fn(),
    setNotesSearch: jest.fn(),
    setSavingFaraidh: jest.fn(),
    setSelectedItem: jest.fn(),
    setShowFaraidhHistory: jest.fn(),
    setSurahSearch: jest.fn(),
    setTasbih: jest.fn(),
    setUserWirdForm: jest.fn(),
    setZakat: jest.fn(),
    setZakatFamilyCount: jest.fn(),
    setZakatGoldGrams: jest.fn(),
    setZakatGoldHaul: jest.fn(),
    setZakatGoldPrice: jest.fn(),
    setZakatHarvestIrrigated: jest.fn(),
    setZakatHarvestWeight: jest.fn(),
    setZakatHaul: jest.fn(),
    setZakatHistory: jest.fn(),
    setZakatMonthlyIncome: jest.fn(),
    setZakatRiceKgPrice: jest.fn(),
    setZakatRicePrice: jest.fn(),
    setZakatSavedMsg: jest.fn(),
    setZakatSaving: jest.fn(),
    setZakatSilverGrams: jest.fn(),
    setZakatSilverPrice: jest.fn(),
    setZakatTab: jest.fn(),
    setZakatTradeCapital: jest.fn(),
    setZakatTradeDebt: jest.fn(),
    setZakatTradeHaul: jest.fn(),
    setZakatTradeReceivable: jest.fn(),
    setZakatTradeStock: jest.fn(),
    sholatLog: {},
    showError: jest.fn(),
    showFaraidhHistory: false,
    showInfo: jest.fn(),
    showSuccess: jest.fn(),
    submitUserWird: jest.fn(),
    surahSearch: "",
    surahs: [],
    tasbih: { count: 7, target: 33 },
    togglePrayer: jest.fn(),
    userWirdForm: {
        arabic: "",
        count: "1",
        note: "",
        occasion: "",
        source: "",
        title: "",
        translation: "",
        transliteration: "",
    },
    visibleItems: [],
    resetUserWirdForm: jest.fn(),
    zakat: { assets: "", debts: "", nisab: "85000000" },
    zakatFamilyCount: 1,
    zakatGoldGrams: "",
    zakatGoldHaul: true,
    zakatGoldPrice: "1050000",
    zakatHarvestIrrigated: false,
    zakatHarvestWeight: "",
    zakatHaul: true,
    zakatHistory: [],
    zakatMonthlyIncome: "",
    zakatRiceKgPrice: "16000",
    zakatRicePrice: "16000",
    zakatSavedMsg: "",
    zakatSaving: false,
    zakatSilverGrams: "",
    zakatSilverPrice: "14000",
    zakatTab: 0,
    zakatTimerRef: { current: null },
    zakatTradeCapital: "",
    zakatTradeDebt: "",
    zakatTradeHaul: true,
    zakatTradeReceivable: "",
    zakatTradeStock: "",
    ...overrides,
});

const getExpectedSurfaceTestID = (feature) => {
    if (feature.key === "asbabun-nuzul")
        return "explore-web-app-asbabun-surface";
    if (feature.key === "community-feed")
        return "explore-web-app-community-feed-surface";
    return `explore-web-app-${feature.key}-surface`;
};

describe("Explore web app reference list routes", () => {
    test("uses light and dark theme palettes for the web app Belajar catalog", () => {
        const lightTheme = WEB_APP_EXPLORE_THEMES.light;
        const lightRoute = renderExploreWebAppRoute(
            baseContext(null, {
                webAppExploreTheme: lightTheme,
                webAppExploreThemeStyles:
                    createExploreWebAppThemeStyles(lightTheme),
            }),
        );
        const lightView = render(lightRoute);

        expect(
            StyleSheet.flatten(
                lightView.getByTestId("explore-web-app-surface").props.style,
            ).backgroundColor,
        ).toBe("#ffffff");
        expect(
            StyleSheet.flatten(lightView.getByText("Belajar").props.style)
                .color,
        ).toBe("#111827");
        lightView.unmount();

        const darkTheme = WEB_APP_EXPLORE_THEMES.dark;
        const darkRoute = renderExploreWebAppRoute(
            baseContext(null, {
                webAppExploreTheme: darkTheme,
                webAppExploreThemeStyles:
                    createExploreWebAppThemeStyles(darkTheme),
            }),
        );
        const darkView = render(darkRoute);

        expect(
            StyleSheet.flatten(
                darkView.getByTestId("explore-web-app-surface").props.style,
            ).backgroundColor,
        ).toBe("#020617");
        expect(
            StyleSheet.flatten(darkView.getByText("Belajar").props.style).color,
        ).toBe("#f8fafc");
    });

    test("renders every mobile Explore feature through a web app route surface", () => {
        for (const feature of allFeatures) {
            const route = renderExploreWebAppRoute(baseContext(feature));
            expect(route).toBeTruthy();

            const view = render(route);
            expect(
                view.getByTestId(getExpectedSurfaceTestID(feature)),
            ).toBeTruthy();
            expect(view.queryByTestId("screen-title")).toBeNull();
            view.unmount();
        }
    });

    test("renders every configured reference/list route without generic Screen fallback", () => {
        for (const key of Object.keys(WEB_APP_REFERENCE_ROUTE_CONFIGS)) {
            const route = renderExploreWebAppRoute(
                baseContext({
                    key,
                    type: key === "amalan" ? "protected-list" : "list",
                }),
            );
            const view = render(route);
            expect(
                view.getByTestId(`explore-web-app-${key}-surface`),
            ).toBeTruthy();
            expect(view.queryByTestId("screen-title")).toBeNull();
            view.unmount();
        }
    });

    test("renders local tool routes in dashboard shell without generic Screen fallback", () => {
        for (const type of Object.keys(WEB_APP_TOOL_ROUTE_CONFIGS)) {
            const route = renderExploreWebAppRoute(
                baseContext(
                    {
                        key: type,
                        title: WEB_APP_TOOL_ROUTE_CONFIGS[type].title,
                        type,
                    },
                    {
                        renderFeatureContent: () => <Text>Tool content</Text>,
                        renderItem: jest.fn(),
                    },
                ),
            );
            const view = render(route);
            expect(
                view.getByTestId(`explore-web-app-${type}-surface`),
            ).toBeTruthy();
            expect(view.queryByTestId("screen-title")).toBeNull();
            expect(view.getByText("Tool content")).toBeTruthy();
            view.unmount();
        }
    });

    test("filters Dzikir route by dashboard category and search", () => {
        const openItemDetail = jest.fn();
        const route = renderExploreWebAppRoute(
            baseContext(
                { key: "dzikir", type: "list" },
                {
                    items: [
                        {
                            id: "dzikir-1",
                            title: "Dzikir Pagi",
                            body: "Bacaan perlindungan pagi.",
                            raw: {
                                category: "pagi",
                                source: "Hisnul Muslim",
                                translation: {
                                    ar: "سُبْحَانَ اللهِ",
                                    latin_idn: "Subhanallah",
                                },
                            },
                        },
                        {
                            id: "dzikir-2",
                            title: "Dzikir Petang",
                            body: "Bacaan perlindungan petang.",
                            raw: {
                                category: "petang",
                                source: "Hisnul Muslim",
                                translation: {
                                    ar: "الْحَمْدُ لِلَّهِ",
                                    latin_idn: "Alhamdulillah",
                                },
                            },
                        },
                    ],
                    openItemDetail,
                },
            ),
        );
        const { getAllByTestId, getByTestId, getByText, queryByText } =
            render(route);

        expect(getByTestId("explore-web-app-dzikir-surface")).toBeTruthy();
        expect(getByText("2 dzikir tersedia")).toBeTruthy();

        fireEvent.press(getAllByTestId("web-app-dzikir-category")[2]);
        expect(getByText("Dzikir Petang")).toBeTruthy();
        expect(queryByText("Dzikir Pagi")).toBeNull();

        fireEvent.changeText(
            getByTestId("web-app-dzikir-search"),
            "alhamdulillah",
        );
        expect(getByText("Menampilkan 1 dari 2 dzikir")).toBeTruthy();

        fireEvent.press(getAllByTestId("web-app-reference-card")[0]);
        expect(openItemDetail).toHaveBeenCalledWith(
            expect.objectContaining({ id: "dzikir-2" }),
        );
    });

    test("renders Amalan route as dashboard checklist and toggles an item", () => {
        const onToggleAmalan = jest.fn();
        const route = renderExploreWebAppRoute(
            baseContext(
                {
                    key: "amalan",
                    title: "Amalan Harian",
                    type: "protected-list",
                },
                {
                    items: [
                        {
                            id: "amalan-1",
                            title: "Subuh berjamaah",
                            raw: {
                                id: 1,
                                name_id: "Subuh berjamaah",
                                is_checked: true,
                            },
                        },
                        {
                            id: "amalan-2",
                            title: "Sholat Dhuha",
                            raw: {
                                id: 2,
                                name_id: "Sholat Dhuha",
                                is_checked: false,
                            },
                        },
                    ],
                    onToggleAmalan,
                    visibleItems: [
                        {
                            id: "amalan-1",
                            title: "Subuh berjamaah",
                            raw: {
                                id: 1,
                                name_id: "Subuh berjamaah",
                                is_checked: true,
                            },
                        },
                        {
                            id: "amalan-2",
                            title: "Sholat Dhuha",
                            raw: {
                                id: 2,
                                name_id: "Sholat Dhuha",
                                is_checked: false,
                            },
                        },
                    ],
                },
            ),
        );
        const { getAllByTestId, getByText, queryByTestId } = render(route);

        expect(queryByTestId("screen-title")).toBeNull();
        expect(getByText("Amalan Harian")).toBeTruthy();
        expect(getByText("1/2")).toBeTruthy();
        expect(getAllByTestId("web-app-amalan-row")).toHaveLength(2);

        fireEvent.press(getAllByTestId("web-app-amalan-row")[1]);
        expect(onToggleAmalan).toHaveBeenCalledWith(
            expect.objectContaining({ id: "amalan-2" }),
        );
    });

    test("renders Imsakiyah route as dashboard schedule table", () => {
        const route = renderExploreWebAppRoute(
            baseContext(
                { key: "imsakiyah", title: "Imsakiyah", type: "list" },
                {
                    items: [
                        {
                            id: "imsak-1",
                            raw: {
                                city: "Bandung (WIB)",
                                date: "2026-05-01",
                                prayers: {
                                    imsak: "04:20",
                                    fajr: "04:30",
                                    sunrise: "05:44",
                                    dhuhr: "11:51",
                                    asr: "15:12",
                                    maghrib: "17:49",
                                    isha: "18:59",
                                },
                            },
                        },
                        {
                            id: "imsak-2",
                            raw: {
                                day: 2,
                                date: "2 Ramadan 1447",
                                prayers: {
                                    imsak: "04:21",
                                    fajr: "04:31",
                                    sunrise: "05:44",
                                    dhuhr: "11:51",
                                    asr: "15:12",
                                    maghrib: "17:49",
                                    isha: "18:59",
                                },
                            },
                        },
                    ],
                    visibleItems: [
                        {
                            id: "imsak-1",
                            raw: {
                                city: "Bandung (WIB)",
                                date: "2026-05-01",
                                prayers: {
                                    imsak: "04:20",
                                    fajr: "04:30",
                                    sunrise: "05:44",
                                    dhuhr: "11:51",
                                    asr: "15:12",
                                    maghrib: "17:49",
                                    isha: "18:59",
                                },
                            },
                        },
                        {
                            id: "imsak-2",
                            raw: {
                                day: 2,
                                date: "2 Ramadan 1447",
                                prayers: {
                                    imsak: "04:21",
                                    fajr: "04:31",
                                    sunrise: "05:44",
                                    dhuhr: "11:51",
                                    asr: "15:12",
                                    maghrib: "17:49",
                                    isha: "18:59",
                                },
                            },
                        },
                    ],
                },
            ),
        );
        const { getAllByTestId, getByTestId, getByText, queryByTestId } =
            render(route);

        expect(getByTestId("explore-web-app-imsakiyah-surface")).toBeTruthy();
        expect(queryByTestId("screen-title")).toBeNull();
        expect(
            getByText("Jadwal imsak & sholat bulanan · Bandung (WIB)"),
        ).toBeTruthy();
        expect(getByText("Mei 2026")).toBeTruthy();
        expect(getByText("2")).toBeTruthy();
        expect(getAllByTestId("web-app-imsakiyah-row")).toHaveLength(2);
        expect(getByText("04:20")).toBeTruthy();
    });

    test("renders Hijri route as dashboard calendar surface", () => {
        const route = renderExploreWebAppRoute(
            baseContext(
                { key: "hijri", title: "Kalender Hijri", type: "hijri" },
                {
                    items: [
                        {
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
                        },
                        {
                            id: "event-1",
                            title: "Idul Adha",
                            body: "Hari raya kurban.",
                            raw: {
                                category: "eid",
                                hijri_day: 10,
                                hijri_month: 12,
                                translation: {
                                    title_idn: "Idul Adha",
                                    description_idn: "Hari raya kurban.",
                                },
                            },
                        },
                    ],
                    visibleItems: [
                        {
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
                        },
                        {
                            id: "event-1",
                            title: "Idul Adha",
                            body: "Hari raya kurban.",
                            raw: {
                                category: "eid",
                                hijri_day: 10,
                                hijri_month: 12,
                                translation: {
                                    title_idn: "Idul Adha",
                                    description_idn: "Hari raya kurban.",
                                },
                            },
                        },
                    ],
                },
            ),
        );
        const { getAllByText, getByTestId, getByText, queryByTestId } =
            render(route);

        expect(getByTestId("explore-web-app-hijri-surface")).toBeTruthy();
        expect(queryByTestId("screen-title")).toBeNull();
        expect(getAllByText("12 Dzulhijjah 1447 هـ").length).toBeGreaterThan(0);
        expect(getByText("Puasa Sunnah")).toBeTruthy();
        expect(getByText("Konversi Tanggal")).toBeTruthy();
        expect(getByText("Idul Adha")).toBeTruthy();
    });

    test("renders Tasbih route as dashboard counter surface", () => {
        const setTasbih = jest.fn();
        const route = renderExploreWebAppRoute(
            baseContext(
                { key: "tasbih", title: "Tasbih", type: "tasbih" },
                {
                    renderFeatureContent: () => <Text>Tool content</Text>,
                    setTasbih,
                    tasbih: { count: 32, target: 33 },
                },
            ),
        );
        const { getAllByText, getByTestId, getByText, queryByText } =
            render(route);

        expect(getByTestId("explore-web-app-tasbih-surface")).toBeTruthy();
        expect(queryByText("Tool content")).toBeNull();
        expect(getByText("Tasbih Digital")).toBeTruthy();
        expect(getAllByText("سُبْحَانَ اللَّهِ").length).toBeGreaterThan(0);
        expect(getByText("/ 33")).toBeTruthy();
        expect(getByText("Pilihan Dzikir")).toBeTruthy();

        fireEvent.press(getByTestId("web-app-tasbih-counter"));
        expect(setTasbih).toHaveBeenCalledWith(expect.any(Function));
    });

    test("renders Quiz route as dashboard question surface", () => {
        const setAnswers = jest.fn();
        const route = renderExploreWebAppRoute(
            baseContext(
                { key: "quiz", title: "Quiz Islami", type: "quiz" },
                {
                    items: [
                        {
                            id: "quiz-1",
                            title: "Apa rukun Islam pertama?",
                            raw: {
                                category: "aqidah",
                                correct_answer: "Syahadat",
                                explanation:
                                    "Syahadat adalah pintu masuk Islam.",
                                options: [
                                    "Syahadat",
                                    "Shalat",
                                    "Zakat",
                                    "Puasa",
                                ],
                                question: "Apa rukun Islam pertama?",
                            },
                        },
                    ],
                    scoreQuiz: jest.fn(() => 0),
                    setAnswers,
                    visibleItems: [
                        {
                            id: "quiz-1",
                            title: "Apa rukun Islam pertama?",
                            raw: {
                                category: "aqidah",
                                correct_answer: "Syahadat",
                                explanation:
                                    "Syahadat adalah pintu masuk Islam.",
                                options: [
                                    "Syahadat",
                                    "Shalat",
                                    "Zakat",
                                    "Puasa",
                                ],
                                question: "Apa rukun Islam pertama?",
                            },
                        },
                    ],
                },
            ),
        );
        const { getAllByTestId, getByTestId, getByText, queryByText } =
            render(route);

        expect(getByTestId("explore-web-app-quiz-surface")).toBeTruthy();
        expect(queryByText("Tool content")).toBeNull();
        expect(getByText("Quiz Islami")).toBeTruthy();
        expect(getByText("Pertanyaan 1 / 1")).toBeTruthy();
        expect(getByText("Apa rukun Islam pertama?")).toBeTruthy();

        fireEvent.press(getAllByTestId("web-app-quiz-option")[0]);
        expect(setAnswers).toHaveBeenCalledWith(expect.any(Function));
    });

    test("renders Sholat Tracker route as dashboard tracker surface", () => {
        const togglePrayer = jest.fn();
        const route = renderExploreWebAppRoute(
            baseContext(
                {
                    key: "sholat-tracker",
                    title: "Sholat Tracker",
                    type: "sholat-tracker",
                },
                {
                    renderFeatureContent: () => <Text>Tool content</Text>,
                    sholatLog: { subuh: true, dzuhur: true, maghrib: true },
                    togglePrayer,
                },
            ),
        );
        const {
            getAllByTestId,
            getAllByText,
            getByTestId,
            getByText,
            queryByText,
        } = render(route);

        expect(
            getByTestId("explore-web-app-sholat-tracker-surface"),
        ).toBeTruthy();
        expect(queryByText("Tool content")).toBeNull();
        expect(getByText("Sholat Tracker")).toBeTruthy();
        expect(getAllByText("3/5").length).toBeGreaterThan(0);
        expect(getByText("60% sholat tercatat")).toBeTruthy();
        expect(getByText("7 Hari Terakhir")).toBeTruthy();
        expect(getAllByTestId("web-app-sholat-prayer-row")).toHaveLength(5);

        fireEvent.press(getAllByTestId("web-app-sholat-prayer-row")[0]);
        expect(togglePrayer).toHaveBeenCalledWith("subuh");
    });

    test("renders Historical Map route as the dedicated dashboard map surface", () => {
        const route = renderExploreWebAppRoute(
            baseContext(
                {
                    key: "historical-map",
                    title: "Peta Islam Interaktif",
                    type: "historical-map",
                },
                { renderFeatureContent: () => <Text>Tool content</Text> },
            ),
        );
        const { getByTestId, getByText, queryByText } = render(route);

        expect(
            getByTestId("explore-web-app-historical-map-surface"),
        ).toBeTruthy();
        expect(getByTestId("historical-map-web-app-surface")).toBeTruthy();
        expect(queryByText("Tool content")).toBeNull();
        expect(getByText("Peta Islam Interaktif")).toBeTruthy();
        expect(
            getByText("Lokasi bersejarah dalam peradaban Islam"),
        ).toBeTruthy();
    });

    test("renders Tokoh route as the dedicated dashboard biography surface", () => {
        const route = renderExploreWebAppRoute(
            baseContext(
                { key: "tokoh", title: "Tokoh Tarikh", type: "tokoh" },
                { renderFeatureContent: () => <Text>Tool content</Text> },
            ),
        );
        const { getByTestId, getByText, queryByText } = render(route);

        expect(getByTestId("explore-web-app-tokoh-surface")).toBeTruthy();
        expect(getByTestId("tokoh-web-app-surface")).toBeTruthy();
        expect(queryByText("Tool content")).toBeNull();
        expect(getByText("Tokoh Tarikh")).toBeTruthy();
        expect(
            getByText("Biografi ulama, ilmuwan, dan tokoh Islam"),
        ).toBeTruthy();
    });

    test("renders User Wird route as dashboard login prompt when signed out", () => {
        const onOpenTab = jest.fn();
        const route = renderExploreWebAppRoute(
            baseContext(
                { key: "user-wird", title: "Wirid Saya", type: "user-wird" },
                {
                    onOpenTab,
                    renderFeatureContent: () => <Text>Tool content</Text>,
                },
            ),
        );
        const { getAllByText, getByTestId, getByText, queryByText } =
            render(route);

        expect(getByTestId("explore-web-app-user-wird-surface")).toBeTruthy();
        expect(queryByText("Tool content")).toBeNull();
        expect(getAllByText("Wirid Pribadi").length).toBeGreaterThan(0);
        expect(
            getByText(
                "Login untuk membuat dan menyimpan wirid pribadi dari dashboard.",
            ),
        ).toBeTruthy();

        fireEvent.press(getByText("Masuk"));
        expect(onOpenTab).toHaveBeenCalledWith("profile");
    });

    test("renders User Wird route as dashboard list and opens edit actions", () => {
        const fillUserWirdForm = jest.fn();
        const removeUserWird = jest.fn();
        const route = renderExploreWebAppRoute(
            baseContext(
                { key: "user-wird", title: "Wirid Saya", type: "user-wird" },
                {
                    fillUserWirdForm,
                    items: [
                        {
                            arabic: "سُبْحَانَ اللَّهِ",
                            id: "wird-1",
                            title: "Wirid Pagi",
                            raw: {
                                arabic: "سُبْحَانَ اللَّهِ",
                                count: 33,
                                id: "wird-1",
                                occasion: "pagi",
                                source: "Hisnul Muslim",
                                title: "Wirid Pagi",
                                translation: "Maha suci Allah",
                                transliteration: "Subhanallah",
                            },
                        },
                    ],
                    removeUserWird,
                    renderFeatureContent: () => <Text>Tool content</Text>,
                    session: { token: "abc" },
                    userWirdForm: {
                        arabic: "سُبْحَانَ اللَّهِ",
                        count: "33",
                        note: "",
                        occasion: "pagi",
                        source: "Hisnul Muslim",
                        title: "Wirid Pagi",
                        translation: "Maha suci Allah",
                        transliteration: "Subhanallah",
                    },
                },
            ),
        );
        const { getByTestId, getByText, queryByText } = render(route);

        expect(getByTestId("explore-web-app-user-wird-surface")).toBeTruthy();
        expect(queryByText("Tool content")).toBeNull();
        expect(getByText("Kumpulan wirid yang kamu buat sendiri")).toBeTruthy();
        expect(getByText("33x")).toBeTruthy();
        expect(getByText("Wirid Pagi")).toBeTruthy();
        expect(getByText("Subhanallah")).toBeTruthy();

        fireEvent.press(getByTestId("web-app-user-wird-edit"));
        expect(fillUserWirdForm).toHaveBeenCalledWith(
            expect.objectContaining({ title: "Wirid Pagi" }),
        );
        expect(getByText("Buat Wirid Baru")).toBeTruthy();

        fireEvent.press(getByTestId("web-app-user-wird-delete"));
        expect(removeUserWird).toHaveBeenCalledWith(
            expect.objectContaining({ id: "wird-1" }),
        );
    });

    test("renders Zakat route as dedicated dashboard calculator and opens history", () => {
        const setZakatTab = jest.fn();
        const route = renderExploreWebAppRoute(
            baseContext(
                { key: "zakat", title: "Kalkulator Zakat", type: "zakat" },
                {
                    renderFeatureContent: () => <Text>Tool content</Text>,
                    setZakatTab,
                    zakat: {
                        assets: "100000000",
                        debts: "10000000",
                        nisab: "85000000",
                    },
                    zakatGoldPrice: "1050000",
                },
            ),
        );
        const { getByTestId, getByText, queryByText } = render(route);

        expect(getByTestId("explore-web-app-zakat-surface")).toBeTruthy();
        expect(queryByText("Tool content")).toBeNull();
        expect(getByText("Kalkulator Zakat")).toBeTruthy();
        expect(getByText("Zakat Maal")).toBeTruthy();
        expect(getByText("Rp 2.250.000")).toBeTruthy();

        fireEvent.press(getByTestId("web-app-zakat-history-link"));
        expect(setZakatTab).toHaveBeenCalledWith(6);
    });

    test("renders Zakat history route through dedicated dashboard history surface", () => {
        const setZakatTab = jest.fn();
        const route = renderExploreWebAppRoute(
            baseContext(
                { key: "zakat", title: "Kalkulator Zakat", type: "zakat" },
                {
                    setZakatTab,
                    zakatHistory: [
                        {
                            id: "zakat-1",
                            jenis: "maal",
                            jumlah_zakat: 2500000,
                            nama_jenis: "Zakat Maal",
                        },
                    ],
                    zakatTab: 6,
                },
            ),
        );
        const { getAllByText, getByTestId, getByText } = render(route);

        expect(getByTestId("explore-web-app-zakat-surface")).toBeTruthy();
        expect(
            getByTestId("explore-web-app-zakat-history-surface"),
        ).toBeTruthy();
        expect(getByText("Riwayat Zakat")).toBeTruthy();
        expect(getAllByText("Rp 2.500.000").length).toBeGreaterThan(0);

        fireEvent.press(getByTestId("web-app-zakat-history-back"));
        expect(setZakatTab).toHaveBeenCalledWith(0);
    });

    test("renders Faraidh route as dedicated dashboard calculator and updates heirs", () => {
        const setFaraidh = jest.fn();
        const route = renderExploreWebAppRoute(
            baseContext(
                { key: "faraidh", title: "Faraidh", type: "faraidh" },
                {
                    faraidh: {
                        bequest: "",
                        debts: "",
                        estate: "120000000",
                        heirs: {
                            anakL: 1,
                            anakP: 1,
                            ayah: 0,
                            ibu: 0,
                            istri: 0,
                            kakek: 0,
                            nenek: 0,
                            saudaraL: 0,
                            saudaraP: 0,
                            suami: 0,
                        },
                    },
                    renderFeatureContent: () => <Text>Tool content</Text>,
                    setFaraidh,
                },
            ),
        );
        const { getByTestId, getByText, queryByText } = render(route);

        expect(getByTestId("explore-web-app-faraidh-surface")).toBeTruthy();
        expect(queryByText("Tool content")).toBeNull();
        expect(getByText("Kalkulator Waris")).toBeTruthy();
        expect(getByText("Harta dan Pengurang")).toBeTruthy();
        expect(getByText("Ahli Waris")).toBeTruthy();
        expect(getByText("Rp 80.000.000")).toBeTruthy();
        expect(getByText("Rp 40.000.000")).toBeTruthy();

        fireEvent.press(getByTestId("web-app-faraidh-heir-anakL-plus"));
        expect(setFaraidh).toHaveBeenCalledWith(expect.any(Function));
    });

    test("renders Faraidh history route through dedicated dashboard history surface", () => {
        const setShowFaraidhHistory = jest.fn();
        const route = renderExploreWebAppRoute(
            baseContext(
                { key: "faraidh", title: "Faraidh", type: "faraidh" },
                {
                    faraidhHistory: [
                        {
                            id: "local-faraidh-1",
                            is_local: true,
                            result_summary:
                                "Anak Laki-laki: 67%, Anak Perempuan: 33%",
                            wealth: 120000000,
                        },
                    ],
                    setShowFaraidhHistory,
                    showFaraidhHistory: true,
                },
            ),
        );
        const { getByTestId, getByText } = render(route);

        expect(getByTestId("explore-web-app-faraidh-surface")).toBeTruthy();
        expect(
            getByTestId("explore-web-app-faraidh-history-surface"),
        ).toBeTruthy();
        expect(getByText("Riwayat Faraidh")).toBeTruthy();
        expect(getByText("Rp 120.000.000")).toBeTruthy();

        fireEvent.press(getByTestId("web-app-faraidh-history-back"));
        expect(setShowFaraidhHistory).toHaveBeenCalledWith(false);
    });

    test("renders Asmaul Flashcard route as dashboard card surface", () => {
        const setAsmaulFlashcardRevealed = jest.fn();
        const setAsmaulIndex = jest.fn();
        const route = renderExploreWebAppRoute(
            baseContext(
                {
                    key: "asmaul-flashcard",
                    title: "Flashcard Asmaul Husna",
                    type: "asmaul-flashcard",
                },
                {
                    renderFeatureContent: () => <Text>Tool content</Text>,
                    setAsmaulFlashcardRevealed,
                    setAsmaulIndex,
                },
            ),
        );
        const { getByTestId, getByText, queryByText } = render(route);

        expect(
            getByTestId("explore-web-app-asmaul-flashcard-surface"),
        ).toBeTruthy();
        expect(queryByText("Tool content")).toBeNull();
        expect(getByText("Flashcard Asmaul Husna")).toBeTruthy();
        expect(getByText("Uji hafalan 99 nama Allah")).toBeTruthy();
        expect(getByText("الرَّحْمَنُ")).toBeTruthy();
        expect(getByText("Ingat-ingat artinya...")).toBeTruthy();

        fireEvent.press(getByTestId("web-app-asmaul-flashcard-card"));
        expect(setAsmaulFlashcardRevealed).toHaveBeenCalledWith(
            expect.any(Function),
        );
    });

    test("renders Asmaul Wirid route as dashboard counter surface", () => {
        const setAsmaulCounts = jest.fn();
        const route = renderExploreWebAppRoute(
            baseContext(
                {
                    key: "asmaul-wirid",
                    title: "Wirid Asmaul Husna",
                    type: "asmaul-wirid",
                },
                {
                    asmaulCounts: { 1: 32 },
                    renderFeatureContent: () => <Text>Tool content</Text>,
                    setAsmaulCounts,
                },
            ),
        );
        const { getAllByText, getByTestId, getByText, queryByText } =
            render(route);

        expect(
            getByTestId("explore-web-app-asmaul-wirid-surface"),
        ).toBeTruthy();
        expect(queryByText("Tool content")).toBeNull();
        expect(getByText("وِرْدُ الْأَسْمَاءِ")).toBeTruthy();
        expect(getByText("Wirid Asmaul Husna")).toBeTruthy();
        expect(getByText("الرَّحْمَنُ")).toBeTruthy();
        expect(getAllByText("32").length).toBeGreaterThan(0);
        expect(getByText("/ 99")).toBeTruthy();

        fireEvent.press(getByTestId("web-app-asmaul-wirid-counter"));
        expect(setAsmaulCounts).toHaveBeenCalledWith(expect.any(Function));
    });
});
