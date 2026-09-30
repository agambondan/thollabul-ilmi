const ORIGINAL_TZ = process.env.TZ;
process.env.TZ = "Asia/Jakarta";

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

jest.mock("../context/SessionContext", () => ({
    useSession: jest.fn(),
}));

jest.mock("../context/FeedbackContext", () => ({
    useFeedback: jest.fn(),
}));

jest.mock("../api/explore", () => ({
    getAllNotes: jest.fn(),
    getAsmaulNames: jest.fn(),
    getBlogCategoryItems: jest.fn(),
    getBookmarkItems: jest.fn(),
    getFeatureItemPage: jest.fn(),
    getHijriOverview: jest.fn(),
    getQuizQuestions: jest.fn(),
    getZakatGoldPrice: jest.fn(),
    searchDictionary: jest.fn(),
    fetchBookPages: jest.fn().mockResolvedValue({ pages: [] }),
}));

jest.mock("../api/social", () => ({
    createComment: jest.fn(),
    getCommentsByRef: jest.fn(),
    getFeedPostPage: jest.fn(),
    hideFeedPost: jest.fn(),
    likeFeedPost: jest.fn(),
    reportFeedPost: jest.fn(),
}));

jest.mock("../api/forum", () => ({
    acceptForumAnswer: jest.fn(),
    createForumAnswer: jest.fn(),
    createForumQuestion: jest.fn(),
    getForumQuestion: jest.fn(),
    getForumQuestions: jest.fn(),
    voteForum: jest.fn(),
}));

jest.mock("../utils/haptics", () => ({
    hapticMedium: jest.fn(),
    hapticTap: jest.fn(),
}));

jest.mock("../api/personal", () => ({
    addBookmark: jest.fn(),
    createUserWird: jest.fn(),
    deleteBookmark: jest.fn(),
    deleteFaraidh: jest.fn(),
    deleteKalkulasiZakat: jest.fn(),
    deleteUserWird: jest.fn(),
    getBookmarks: jest.fn().mockResolvedValue([]),
    getFaraidhHistory: jest.fn().mockResolvedValue([]),
    getKalkulasiZakat: jest.fn(),
    getLibraryProgress: jest.fn(),
    getLibraryProgressList: jest.fn().mockResolvedValue([]),
    getPrayerHistory: jest.fn(),
    getPrayerStats: jest.fn(),
    getTodayPrayerLog: jest.fn(),
    getUserWirds: jest.fn(),
    saveFaraidh: jest.fn(),
    saveKalkulasiZakat: jest.fn(),
    saveLibraryProgress: jest.fn(),
    savePrayerLog: jest.fn(),
    updateUserWird: jest.fn(),
}));

jest.mock("../api/client", () => ({
    getAyahById: jest.fn(),
    getSurahs: jest.fn(),
}));

jest.mock("../storage/recentFeatures", () => ({
    readPinnedFeatures: jest.fn(),
    readRecentFeatures: jest.fn(),
    rememberFeatureOpen: jest.fn(),
    togglePinnedFeature: jest.fn(),
}));

jest.mock("../components/Card", () => {
    const { View, Text } = require("react-native");
    return {
        Card: ({ children, style }) => <View style={style}>{children}</View>,
        CardTitle: ({ children, meta }) => (
            <View>
                <Text>{children}</Text>
                {meta ? <Text>{meta}</Text> : null}
            </View>
        ),
    };
});

jest.mock("../components/ContentCard", () => {
    const { Pressable, Text } = require("react-native");
    return {
        ContentCard: ({ title, onPress, children, meta }) => (
            <Pressable onPress={onPress} testID='content-card'>
                <Text testID='card-title'>{title}</Text>
                {meta ? <Text testID='card-meta'>{meta}</Text> : null}
                {children}
            </Pressable>
        ),
    };
});

jest.mock("../components/Paper", () => {
    const { Pressable, Text, TextInput } = require("react-native");
    return {
        PaperSearchInput: ({ value, onChangeText, placeholder }) => (
            <TextInput
                onChangeText={onChangeText}
                placeholder={placeholder}
                testID='search-input'
                value={value}
            />
        ),
        CompactRow: ({ title, onPress }) => (
            <Pressable onPress={onPress} testID='compact-row'>
                <Text>{title}</Text>
            </Pressable>
        ),
        SectionHeader: ({ title }) => <Text>{title}</Text>,
        IconActionButton: ({ label, onPress }) => (
            <Pressable onPress={onPress} testID={`action-${label}`}>
                <Text>{label}</Text>
            </Pressable>
        ),
        ActionPill: ({ label, onPress }) => (
            <Pressable onPress={onPress} testID={`pill-${label}`}>
                <Text>{label}</Text>
            </Pressable>
        ),
    };
});

jest.mock("../components/AppActionSheet", () => ({
    AppActionSheet: ({ visible, children }) => (visible ? children : null),
    ActionSheetRow: () => null,
}));

jest.mock("../components/NotesPanel", () => ({
    NotesPanel: () => null,
}));

jest.mock("../components/NotificationCenter", () => ({
    NotificationCenter: () => null,
}));

jest.mock("../data/mobileFeatures", () => {
    const allFeatures = [
        {
            key: "doa",
            title: "Doa",
            subtitle: "Doa harian",
            group: "Bacaan",
            type: "list",
            endpoint: "/api/v1/doa",
        },
        {
            key: "dzikir",
            title: "Dzikir",
            subtitle: "Kumpulan dzikir",
            group: "Bacaan",
            type: "list",
            endpoint: "/api/v1/dzikir",
        },
        {
            key: "manasik",
            title: "Manasik",
            subtitle: "Panduan haji dan umrah",
            group: "Ilmu",
            type: "list",
            endpoint: "/api/v1/manasik",
        },
        {
            key: "sholat-tracker",
            title: "Sholat Tracker",
            subtitle: "Catat sholat",
            group: "Alat",
            type: "sholat-tracker",
        },
        {
            key: "faraidh",
            title: "Kalkulator Waris",
            subtitle: "Hitung waris",
            group: "Alat",
            type: "faraidh",
        },
        {
            key: "tasbih",
            title: "Tasbih",
            subtitle: "Penghitung",
            group: "Alat",
            type: "tasbih",
        },
        {
            key: "siroh",
            title: "Siroh",
            subtitle: "Biografi Nabi",
            group: "Ilmu",
            type: "list",
            endpoint: "/api/v1/siroh",
        },
        {
            key: "kamus",
            title: "Kamus Arab",
            subtitle: "Cari kosakata",
            group: "Alat",
            type: "kamus",
        },
    ];
    const belajarFeatureGroups = [
        { key: "semua", label: "Semua", meta: "Fitur", features: allFeatures },
    ];
    return { allFeatures, belajarFeatureGroups };
});

jest.mock("../hooks/useLayoutModePreference", () => ({
    useLayoutModePreference: jest.fn(),
}));

import React, { useCallback, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    act,
    fireEvent,
    render,
    waitFor,
    within,
} from "@testing-library/react-native";

import { ExploreScreen } from "../screens/ExploreScreen";
import { WebAppDoaRoute } from "../screens/explore/WebAppDoaRoute";
import { flushAsyncWork } from "../test-utils/async";

jest.setTimeout(20000);

const { useSession } = require("../context/SessionContext");
const { useFeedback } = require("../context/FeedbackContext");
const exploreApi = require("../api/explore");
const personalApi = require("../api/personal");
const { useLayoutModePreference } = require("../hooks/useLayoutModePreference");
const {
    readPinnedFeatures,
    readRecentFeatures,
    rememberFeatureOpen,
    togglePinnedFeature,
} = require("../storage/recentFeatures");

const ibadahRoute = { tab: "ibadah" };
const homeDirectoryRoute = { tab: "home", view: "feature-directory" };

let feedback;
let navigation;
let onOpenTab;

const setLayout = (isWebAppLayout) =>
    useLayoutModePreference.mockReturnValue({
        isDarkTheme: false,
        isWebAppLayout,
    });

const setSession = (token) =>
    useSession.mockReturnValue({
        error: "",
        loading: false,
        session: token ? { token } : null,
        signIn: jest.fn(),
        signOut: jest.fn(),
        user: token ? { id: "1", name: "Tester" } : null,
    });

const deepLink = (featureKey, extra = {}, id = `link-${featureKey}`) => ({
    id,
    params: { featureKey, ...extra },
});

const renderExplore = async (props = {}) => {
    const view = render(
        <ExploreScreen
            isActive
            navigation={navigation}
            onOpenTab={onOpenTab}
            {...props}
        />,
    );
    await flushAsyncWork();
    return view;
};

const lastBackHandler = () => navigation.setBack.mock.calls.at(-1)?.[0];
const lastHeader = () => navigation.setHeader.mock.calls.at(-1)?.[0];

beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
    navigation = {
        clearBack: jest.fn(),
        close: jest.fn(),
        current: null,
        open: jest.fn(),
        setBack: jest.fn(),
        setHeader: jest.fn(),
    };
    onOpenTab = jest.fn();
    feedback = {
        showError: jest.fn(),
        showInfo: jest.fn(),
        showSuccess: jest.fn(),
    };
    useFeedback.mockReturnValue(feedback);
    setLayout(false);
    setSession(null);
    readPinnedFeatures.mockResolvedValue([]);
    readRecentFeatures.mockResolvedValue([]);
    rememberFeatureOpen.mockResolvedValue([]);
    togglePinnedFeature.mockResolvedValue({ items: [], pinned: false });
    exploreApi.getBlogCategoryItems.mockResolvedValue([]);
    exploreApi.getFeatureItemPage.mockResolvedValue({
        items: [],
        meta: { hasMore: false },
    });
    personalApi.getTodayPrayerLog.mockResolvedValue({ prayers: {} });
    personalApi.getPrayerHistory.mockResolvedValue([]);
    personalApi.getPrayerStats.mockResolvedValue({});
    personalApi.savePrayerLog.mockResolvedValue({});
});

afterEach(() => {
    jest.useRealTimers();
});

afterAll(() => {
    if (ORIGINAL_TZ === undefined) delete process.env.TZ;
    else process.env.TZ = ORIGINAL_TZ;
});

const freezeDate = (isoString) =>
    jest.useFakeTimers({
        doNotFake: [
            "cancelAnimationFrame",
            "clearImmediate",
            "clearInterval",
            "clearTimeout",
            "nextTick",
            "performance",
            "queueMicrotask",
            "requestAnimationFrame",
            "setImmediate",
            "setInterval",
            "setTimeout",
        ],
        now: new Date(isoString),
    });

describe("Classic inputs keep their focus target (B6)", () => {
    test("the dictionary input survives the re-render caused by typing", async () => {
        exploreApi.searchDictionary.mockResolvedValue([]);
        const view = await renderExplore({
            deepLinkTarget: deepLink("kamus"),
        });
        const before = view.getByPlaceholderText(/Cari kata|Cari/);

        fireEvent.changeText(before, "ilmu");
        await flushAsyncWork();

        const after = view.getByDisplayValue("ilmu");
        expect(after).toBe(before);
    });
});

describe("reference features load in one page and filter everything (B5)", () => {
    const petangItem = {
        id: "p1",
        title: "Dzikir Petang",
        body: "Bacaan petang",
        raw: { category: "petang" },
    };
    const pagiItem = {
        id: "g1",
        title: "Dzikir Pagi",
        body: "Bacaan pagi",
        raw: { category: "pagi" },
    };

    test("requests the small dataset with the reference page size", async () => {
        setLayout(true);
        exploreApi.getFeatureItemPage.mockResolvedValueOnce({
            items: [pagiItem],
            meta: { hasMore: false },
        });
        await renderExplore({ deepLinkTarget: deepLink("dzikir") });

        expect(exploreApi.getFeatureItemPage).toHaveBeenCalledWith(
            expect.objectContaining({ key: "dzikir" }),
            { page: 0, size: 100 },
        );
    });

    test("a category that only exists on the second page is loaded when its chip is pressed", async () => {
        setLayout(true);
        exploreApi.getFeatureItemPage
            .mockResolvedValueOnce({
                items: [pagiItem],
                meta: { hasMore: true },
            })
            .mockResolvedValueOnce({
                items: [petangItem],
                meta: { hasMore: false },
            });
        const view = await renderExplore({
            deepLinkTarget: deepLink("dzikir"),
        });
        expect(view.getByText("Dzikir Pagi")).toBeTruthy();
        expect(view.queryByText("Dzikir Petang")).toBeNull();

        const chips = view.getAllByTestId("web-app-dzikir-category");
        fireEvent.press(
            chips.find((chip) => within(chip).queryByText("Petang") !== null),
        );
        expect(view.queryByText("Data tidak ditemukan.")).toBeNull();

        await waitFor(() => {
            expect(view.getByText("Dzikir Petang")).toBeTruthy();
        });
        expect(exploreApi.getFeatureItemPage).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({ key: "dzikir" }),
            { page: 1, size: 100 },
        );
        expect(view.queryByText("Data tidak ditemukan.")).toBeNull();
    });
});

describe("Sholat Tracker dates and history (B16)", () => {
    const logs = (date, prayers) =>
        prayers.map((prayer) => ({ date, prayer, status: "munfarid" }));

    const openTracker = async (token = "abc") => {
        setLayout(true);
        setSession(token);
        return renderExplore({ deepLinkTarget: deepLink("sholat-tracker") });
    };

    test("marks Subuh with the local calendar date, not the UTC date", async () => {
        freezeDate("2026-10-01T05:00:00+07:00");
        expect(new Date().toISOString().slice(0, 10)).toBe("2026-09-30");
        const view = await openTracker();

        fireEvent.press(view.getAllByTestId("web-app-sholat-prayer-row")[0]);
        await flushAsyncWork();

        expect(personalApi.savePrayerLog).toHaveBeenCalledWith({
            date: "2026-10-01",
            prayer: "subuh",
            status: "munfarid",
        });
    });

    test("asks the API for history from the start of the window up to local today", async () => {
        freezeDate("2026-10-01T05:00:00+07:00");
        await openTracker();

        expect(personalApi.getPrayerHistory).toHaveBeenCalledWith({
            from: "2026-09-25",
            to: "2026-10-01",
        });
        expect(personalApi.getPrayerStats).toHaveBeenCalledTimes(1);
    });

    test("widens the window to the first of the month when that is earlier", async () => {
        freezeDate("2026-10-20T10:00:00+07:00");
        await openTracker();

        expect(personalApi.getPrayerHistory).toHaveBeenCalledWith({
            from: "2026-10-01",
            to: "2026-10-20",
        });
    });

    test("fills the last seven days and the month heatmap from the history", async () => {
        freezeDate("2026-10-15T10:00:00+07:00");
        personalApi.getPrayerHistory.mockResolvedValue([
            ...logs("2026-10-14", [
                "subuh",
                "dzuhur",
                "ashar",
                "maghrib",
                "isya",
            ]),
            ...logs("2026-10-10", ["subuh", "isya"]),
            ...logs("2026-10-03", ["subuh", "dzuhur", "ashar", "maghrib"]),
            { date: "2026-10-12", prayer: "subuh", status: "missed" },
        ]);
        personalApi.getPrayerStats.mockResolvedValue({
            berjamaah_pct: 40.4,
            best_streak_days: 6,
            current_streak_days: 2,
            total_days: 9,
        });
        const view = await openTracker();

        await waitFor(() => {
            expect(view.getByText("1 hari sempurna")).toBeTruthy();
        });
        expect(view.getAllByText("5/5").length).toBeGreaterThan(0);
        expect(view.getAllByText("2/5").length).toBeGreaterThan(0);
        expect(view.queryByTestId("web-app-sholat-history-empty")).toBeNull();
        expect(view.getAllByTestId("web-app-sholat-month-day")).toHaveLength(
            31,
        );

        const stats = view.getByTestId("web-app-sholat-stats");
        expect(within(stats).getByText("9")).toBeTruthy();
        expect(within(stats).getByText("40%")).toBeTruthy();
        expect(within(stats).getByText("2/6")).toBeTruthy();
    });

    test("shows a graceful empty state when nothing was logged yet", async () => {
        freezeDate("2026-10-15T10:00:00+07:00");
        const view = await openTracker();

        await waitFor(() => {
            expect(
                view.getByTestId("web-app-sholat-history-empty"),
            ).toBeTruthy();
        });
        expect(view.queryByTestId("web-app-sholat-stats")).toBeNull();
        expect(view.getAllByTestId("web-app-sholat-prayer-row")).toHaveLength(
            5,
        );
    });

    test("keeps the tracker usable when the history request fails", async () => {
        personalApi.getPrayerHistory.mockRejectedValue(new Error("offline"));
        personalApi.getPrayerStats.mockRejectedValue(new Error("offline"));
        const view = await openTracker();

        expect(view.getAllByTestId("web-app-sholat-prayer-row")).toHaveLength(
            5,
        );
        expect(view.queryByTestId("web-app-sholat-history-empty")).toBeNull();
    });

    test("guests see the login notice instead of a failed save", async () => {
        const view = await openTracker(null);

        expect(view.getByTestId("web-app-sholat-login-notice")).toBeTruthy();
        expect(
            view.getByText("Buka Profil untuk masuk dan melacak sholat."),
        ).toBeTruthy();

        fireEvent.press(view.getAllByTestId("web-app-sholat-prayer-row")[0]);
        await flushAsyncWork();

        expect(personalApi.savePrayerLog).not.toHaveBeenCalled();
        expect(personalApi.getPrayerHistory).not.toHaveBeenCalled();
        expect(feedback.showError).not.toHaveBeenCalled();
        expect(feedback.showInfo).toHaveBeenCalledWith(
            "Buka Profil untuk masuk dan melacak sholat.",
        );
    });

    test("guests get the same notice from the Classic tracker", async () => {
        setLayout(false);
        setSession(null);
        const view = await renderExplore({
            deepLinkTarget: deepLink("sholat-tracker"),
        });
        expect(
            view.getByText("Buka Profil untuk masuk dan melacak sholat."),
        ).toBeTruthy();

        fireEvent.press(view.getByText("Subuh"));
        await flushAsyncWork();

        expect(personalApi.savePrayerLog).not.toHaveBeenCalled();
        expect(feedback.showInfo).toHaveBeenCalledWith(
            "Buka Profil untuk masuk dan melacak sholat.",
        );
    });

    test("the Classic tracker also saves with the local date", async () => {
        freezeDate("2026-10-01T05:00:00+07:00");
        setLayout(false);
        setSession("abc");
        const view = await renderExplore({
            deepLinkTarget: deepLink("sholat-tracker"),
        });

        fireEvent.press(view.getByText("Subuh"));
        await flushAsyncWork();

        expect(personalApi.savePrayerLog).toHaveBeenCalledWith(
            expect.objectContaining({ date: "2026-10-01", prayer: "subuh" }),
        );
    });
});

describe("Back from features opened through the Ibadah hub (B18)", () => {
    const openFromIbadah = (extra = {}) => ({
        deepLinkTarget: deepLink(
            "doa",
            { returnTo: ibadahRoute },
            "doa-ibadah",
        ),
        ...extra,
    });

    test("Classic shows a back label for Ibadah and returns to the Ibadah hub", async () => {
        const view = await renderExplore(openFromIbadah());

        expect(view.queryByTestId("action-Kembali ke Belajar")).toBeNull();
        fireEvent.press(view.getByTestId("action-Kembali ke Ibadah"));

        expect(onOpenTab).toHaveBeenCalledTimes(1);
        expect(onOpenTab).toHaveBeenCalledWith("ibadah", null);
        expect(view.getByTestId("action-Buka Profil")).toBeTruthy();
    });

    test("hardware back follows the same path", async () => {
        await renderExplore(openFromIbadah());

        let handled;
        await act(async () => {
            handled = lastBackHandler()();
        });

        expect(handled).toBe(true);
        expect(onOpenTab).toHaveBeenCalledWith("ibadah", null);
    });

    test("the header back button of the Modern layout returns to Ibadah", async () => {
        setLayout(true);
        exploreApi.getFeatureItemPage.mockResolvedValue({
            items: [],
            meta: { hasMore: false },
        });
        await renderExplore(openFromIbadah());

        const header = lastHeader();
        expect(header.title).toBe("Doa");
        expect(header.showBack).toBe(true);

        await act(async () => {
            header.onBack();
        });

        expect(onOpenTab).toHaveBeenCalledWith("ibadah", null);
    });

    test("opening the same feature from the Belajar hub still goes back to Belajar", async () => {
        const view = await renderExplore({
            deepLinkTarget: deepLink("doa", {}, "doa-belajar"),
        });

        fireEvent.press(view.getByTestId("action-Kembali ke Belajar"));

        expect(onOpenTab).not.toHaveBeenCalled();
        expect(navigation.open).not.toHaveBeenCalled();
        expect(view.getByTestId("action-Buka Profil")).toBeTruthy();
    });

    test("features opened from the Home directory keep their own return route", async () => {
        const view = await renderExplore({
            deepLinkTarget: deepLink(
                "doa",
                { returnTo: homeDirectoryRoute },
                "doa-home",
            ),
        });

        fireEvent.press(view.getByTestId("action-Kembali ke Beranda"));

        expect(navigation.open).toHaveBeenCalledWith(
            "home",
            "feature-directory",
            { returnTab: null },
        );
        expect(onOpenTab).not.toHaveBeenCalled();
    });

    test("leaving the tab drops the Ibadah return route", async () => {
        const view = await renderExplore(openFromIbadah());
        expect(view.getByTestId("action-Kembali ke Ibadah")).toBeTruthy();

        view.rerender(
            <ExploreScreen
                {...openFromIbadah()}
                isActive={false}
                navigation={navigation}
                onOpenTab={onOpenTab}
            />,
        );
        await flushAsyncWork();
        view.rerender(
            <ExploreScreen
                {...openFromIbadah()}
                isActive
                navigation={navigation}
                onOpenTab={onOpenTab}
            />,
        );
        await flushAsyncWork();

        expect(view.queryByTestId("action-Kembali ke Ibadah")).toBeNull();
        fireEvent.press(view.getByTestId("action-Kembali ke Belajar"));
        expect(onOpenTab).not.toHaveBeenCalled();
    });

    test("a new feature opened from Ibadah replaces the previous return route", async () => {
        const view = await renderExplore(openFromIbadah());

        view.rerender(
            <ExploreScreen
                deepLinkTarget={deepLink(
                    "dzikir",
                    { returnTo: ibadahRoute },
                    "dzikir-ibadah",
                )}
                isActive
                navigation={navigation}
                onOpenTab={onOpenTab}
            />,
        );
        await flushAsyncWork();

        fireEvent.press(view.getByTestId("action-Kembali ke Ibadah"));
        expect(onOpenTab).toHaveBeenCalledWith("ibadah", null);
    });
});

describe("Modern route headers (B18)", () => {
    test.each(["doa", "siroh"])(
        "%s does not re-set the header on every render of its parent",
        async (featureKey) => {
            setLayout(true);
            exploreApi.getFeatureItemPage.mockResolvedValue({
                items: [{ id: 1, raw: {}, title: "Satu" }],
                meta: { hasMore: false },
            });
            let setHeaderCalls = 0;
            function Parent() {
                const [, setHeader] = useState(null);
                const setHeaderConfig = useCallback((config) => {
                    setHeaderCalls += 1;
                    if (setHeaderCalls > 25) throw new Error("header loop");
                    setHeader(config);
                }, []);
                const scopedNavigation = useMemo(
                    () => ({ ...navigation, setHeader: setHeaderConfig }),
                    [setHeaderConfig],
                );
                return (
                    <ExploreScreen
                        deepLinkTarget={deepLink(
                            featureKey,
                            { returnTo: ibadahRoute },
                            `${featureKey}-loop`,
                        )}
                        isActive
                        navigation={scopedNavigation}
                        onOpenTab={onOpenTab}
                    />
                );
            }

            render(<Parent />);
            await flushAsyncWork(6);

            expect(setHeaderCalls).toBeGreaterThan(0);
            expect(setHeaderCalls).toBeLessThan(10);
        },
    );

    test("the route header always calls the latest clearFeature", () => {
        const setHeader = jest.fn();
        const first = jest.fn();
        const second = jest.fn();
        const routeProps = {
            error: "",
            items: [],
            loading: false,
            navigation: { setHeader },
            onLoadMore: jest.fn(),
            onOpenItem: jest.fn(),
            pagination: { hasMore: false, loadingMore: false },
        };
        const view = render(
            <WebAppDoaRoute {...routeProps} clearFeature={first} />,
        );
        view.rerender(<WebAppDoaRoute {...routeProps} clearFeature={second} />);

        expect(setHeader).toHaveBeenCalledTimes(1);
        act(() => {
            setHeader.mock.calls[0][0].onBack();
        });
        expect(first).not.toHaveBeenCalled();
        expect(second).toHaveBeenCalledTimes(1);
    });
});

describe("Faraidh history flag is scoped to the Faraidh feature (B23)", () => {
    const openHistory = async () => {
        const view = await renderExplore({
            deepLinkTarget: deepLink("faraidh"),
        });
        fireEvent.press(view.getByLabelText("Riwayat kalkulasi faraidh"));
        await flushAsyncWork();
        return view;
    };

    test("shows the history title while the history is open", async () => {
        await openHistory();
        expect(lastHeader().title).toBe("Riwayat Faraidh");
    });

    test("the next feature gets its own title and the first Back leaves it", async () => {
        setSession("abc");
        const view = await openHistory();
        expect(lastHeader().title).toBe("Riwayat Faraidh");

        view.rerender(
            <ExploreScreen
                deepLinkTarget={deepLink("sholat-tracker")}
                isActive
                navigation={navigation}
                onOpenTab={onOpenTab}
            />,
        );
        await flushAsyncWork();

        expect(lastHeader().title).toBe("Sholat Tracker");

        await act(async () => {
            lastBackHandler()();
        });
        await flushAsyncWork();

        expect(view.getByTestId("action-Buka Profil")).toBeTruthy();
    });

    test("closing the feature resets the flag for the next visit", async () => {
        const view = await openHistory();
        fireEvent.press(view.getByTestId("action-Kembali ke Belajar"));
        await flushAsyncWork();

        view.rerender(
            <ExploreScreen
                deepLinkTarget={deepLink("faraidh", {}, "faraidh-again")}
                isActive
                navigation={navigation}
                onOpenTab={onOpenTab}
            />,
        );
        await flushAsyncWork();

        expect(lastHeader().title).toBe("Kalkulator Waris");
    });
});

describe("Tasbih state comes back after a restart (B17, B25)", () => {
    const seedTasbih = (state) =>
        AsyncStorage.setItem(
            "tholabul:pref:tasbih-state",
            JSON.stringify(state),
        );
    const today = () => {
        const now = new Date();
        const month = `${now.getMonth() + 1}`.padStart(2, "0");
        const day = `${now.getDate()}`.padStart(2, "0");
        return `${now.getFullYear()}-${month}-${day}`;
    };

    test("the Modern route restores count, target and today's total", async () => {
        setLayout(true);
        await seedTasbih({ count: 9, target: 7, totals: { [today()]: 21 } });
        const view = await renderExplore({
            deepLinkTarget: deepLink("tasbih"),
        });

        expect(view.getByText("/ 7")).toBeTruthy();
        expect(view.getByText("21")).toBeTruthy();
        expect(
            view.getByLabelText("Tambah hitungan tasbih, saat ini 9 dari 7"),
        ).toBeTruthy();
    });

    test("taps on the Classic counter are saved and kept in the daily total", async () => {
        const view = await renderExplore({
            deepLinkTarget: deepLink("tasbih"),
        });

        fireEvent.press(view.getByText("0"));
        fireEvent.press(view.getByText("1"));
        fireEvent.press(view.getByText("2"));
        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 500));
        });

        const stored = JSON.parse(
            await AsyncStorage.getItem("tholabul:pref:tasbih-state"),
        );
        expect(stored).toEqual({
            count: 3,
            target: 33,
            totals: { [today()]: 3 },
        });
    });

    test("the Classic counter copes with an unlimited target saved by the Modern layout", async () => {
        await seedTasbih({ count: 4, target: 0, totals: {} });
        const view = await renderExplore({
            deepLinkTarget: deepLink("tasbih"),
        });

        expect(view.getByText("Tanpa batas")).toBeTruthy();
        expect(view.getByText("0%")).toBeTruthy();
        expect(view.queryByText(/NaN|Infinity/)).toBeNull();
    });
});

describe("Manasik renders markdown instead of raw symbols (B21)", () => {
    const manasikItem = {
        id: 8,
        title: "Ihram dari Miqat (8 Dzulhijjah)",
        arabic: "لَبَّيْكَ اللَّهُمَّ حَجًّا",
        body:
            "## Niat Ihram Haji pada Hari Tarwiyah\n\n" +
            "Pada **8 Dzulhijjah** (Hari Tarwiyah), jemaah memulai ihram:\n\n" +
            "- Mandi sunnah ihram.\n- Shalat sunnah ihram 2 rakaat.",
        meta: "haji",
        raw: {
            description: "## Niat Ihram Haji pada Hari Tarwiyah",
            id: 8,
            step_order: 1,
            type: "haji",
        },
    };

    beforeEach(() => {
        exploreApi.getFeatureItemPage.mockResolvedValue({
            items: [manasikItem],
            meta: { hasMore: false },
        });
    });

    test("the Classic list card shows plain preview text and a tidy tag", async () => {
        const view = await renderExplore({
            deepLinkTarget: deepLink("manasik"),
        });

        expect(view.queryByText(/##/)).toBeNull();
        expect(view.queryByText(/\*\*/)).toBeNull();
        expect(
            view.getByText(/Niat Ihram Haji pada Hari Tarwiyah\. Pada 8/),
        ).toBeTruthy();
        expect(view.getByTestId("card-meta").props.children).toBe("Haji");
    });

    test("the Classic detail renders the markdown through MarkdownView", async () => {
        const view = await renderExplore({
            deepLinkTarget: deepLink("manasik"),
        });

        fireEvent.press(view.getByTestId("content-card"));
        await flushAsyncWork();

        const markdown = view.getByTestId("manasik-markdown-view");
        expect(
            within(markdown).getByText("Niat Ihram Haji pada Hari Tarwiyah"),
        ).toBeTruthy();
        expect(within(markdown).getByText("8 Dzulhijjah")).toBeTruthy();
        expect(within(markdown).getByText("Mandi sunnah ihram.")).toBeTruthy();
        expect(view.queryByText(/##/)).toBeNull();
        expect(view.queryByText(/\*\*/)).toBeNull();
        expect(view.getAllByText("Haji").length).toBeGreaterThan(0);
        expect(view.queryByText("haji")).toBeNull();
    });

    test("the Modern card and detail do the same", async () => {
        setLayout(true);
        const view = await renderExplore({
            deepLinkTarget: deepLink("manasik"),
        });

        expect(view.queryByText(/##/)).toBeNull();
        expect(view.queryByText(/\*\*/)).toBeNull();
        expect(view.getAllByText("Haji").length).toBeGreaterThan(0);

        fireEvent.press(view.getByTestId("web-app-reference-card"));
        await flushAsyncWork();

        expect(view.getByTestId("explore-web-app-detail")).toBeTruthy();
        const markdown = view.getByTestId("manasik-markdown-view");
        expect(
            within(markdown).getByText("Niat Ihram Haji pada Hari Tarwiyah"),
        ).toBeTruthy();
        expect(view.queryByText(/##/)).toBeNull();
        expect(view.queryByText(/\*\*/)).toBeNull();
    });

    test("other features keep their plain body text", async () => {
        exploreApi.getFeatureItemPage.mockResolvedValue({
            items: [
                {
                    id: 1,
                    title: "Doa Makan",
                    body: "Bismillah **tanpa** markdown",
                    meta: "makan",
                    raw: {},
                },
            ],
            meta: { hasMore: false },
        });
        const view = await renderExplore({ deepLinkTarget: deepLink("doa") });

        expect(view.getByText("Bismillah **tanpa** markdown")).toBeTruthy();
        expect(view.getByTestId("card-meta").props.children).toBe("makan");
    });
});
