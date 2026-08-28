jest.mock("lucide-react-native", () => {
    const icons = {};
    const names = [
        "ArrowLeft",
        "BookOpen",
        "Bookmark",
        "BookmarkCheck",
        "CheckCircle2",
        "ChevronDown",
        "Circle",
        "ExternalLink",
        "FileText",
        "Flag",
        "Globe",
        "Heart",
        "HelpCircle",
        "ListChecks",
        "MessageCircle",
        "Pencil",
        "Plus",
        "Scale",
        "Star",
        "Search",
        "StickyNote",
        "ThumbsDown",
        "ThumbsUp",
        "Trash2",
        "Trophy",
        "UserCircle",
        "Users",
        "Video",
    ];
    names.forEach((n) => {
        icons[n] = n;
    });
    return icons;
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
    deleteUserWird: jest.fn(),
    getBookmarks: jest.fn(),
    getLibraryProgress: jest.fn(),
    getLibraryProgressList: jest.fn(),
    getTodayPrayerLog: jest.fn(),
    getUserWirds: jest.fn(),
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

jest.mock("../components/Screen", () => {
    const { View, Text } = require("react-native");
    return {
        Screen: ({
            children,
            title,
            subtitle,
            actions,
            searchSlot,
            listData,
            renderListItem,
            listKeyExtractor,
            listFooter,
            contentStyle,
        }) => (
            <View style={contentStyle}>
                <View>
                    <Text testID='screen-title'>{title}</Text>
                    {subtitle ? (
                        <Text testID='screen-subtitle'>{subtitle}</Text>
                    ) : null}
                    {actions}
                </View>
                {searchSlot}
                {children}
                {Array.isArray(listData) && renderListItem ? (
                    <View testID='screen-list'>
                        {listData.map((item, index) => (
                            <View
                                key={
                                    listKeyExtractor?.(item, index) ??
                                    String(index)
                                }
                            >
                                {renderListItem({ item, index })}
                            </View>
                        ))}
                        {listFooter}
                    </View>
                ) : null}
            </View>
        ),
    };
});

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
        ContentCard: ({
            title,
            subtitle,
            onPress,
            onMenuPress,
            children,
            meta,
        }) => (
            <Pressable
                onPress={onPress}
                onLongPress={onMenuPress}
                testID='content-card'
            >
                <Text testID='card-title'>{title}</Text>
                {subtitle ? (
                    <Text testID='card-subtitle'>{subtitle}</Text>
                ) : null}
                {meta ? <Text testID='card-meta'>{meta}</Text> : null}
                {children}
            </Pressable>
        ),
    };
});

jest.mock("../components/Paper", () => {
    const { Pressable, Text, TextInput, View } = require("react-native");
    return {
        PaperSearchInput: ({ value, onChangeText, placeholder }) => (
            <TextInput
                testID='search-input'
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
            />
        ),
        CompactRow: ({ title, subtitle, onPress, right }) => (
            <Pressable onPress={onPress} testID='compact-row'>
                <Text testID='row-title'>{title}</Text>
                {subtitle ? (
                    <Text testID='row-subtitle'>{subtitle}</Text>
                ) : null}
                {right}
            </Pressable>
        ),
        SectionHeader: ({ title, meta }) => (
            <View>
                <Text testID='section-title'>{title}</Text>
                {meta ? <Text testID='section-meta'>{meta}</Text> : null}
            </View>
        ),
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
    ActionSheetRow: ({ title, onPress }) => {
        const { Pressable, Text } = require("react-native");
        return (
            <Pressable onPress={onPress} testID={`sheet-row-${title}`}>
                <Text>{title}</Text>
            </Pressable>
        );
    },
}));

jest.mock("../components/NotesPanel", () => ({
    NotesPanel: () => {
        const { Text } = require("react-native");
        return <Text testID='notes-panel'>NotesPanel</Text>;
    },
}));

jest.mock("../components/NotificationCenter", () => ({
    NotificationCenter: () => {
        const { Text } = require("react-native");
        return <Text testID='notification-center'>NotificationCenter</Text>;
    },
}));

jest.mock("../data/mobileFeatures", () => {
    const allFeatures = [
        {
            key: "tafsir",
            title: "Tafsir",
            subtitle: "Tafsir per surah",
            group: "Ilmu",
            type: "surah-content",
            contentType: "tafsir",
        },
        {
            key: "kamus",
            title: "Kamus Arab",
            subtitle: "Cari kosakata Arab",
            group: "Alat",
            type: "kamus",
        },
        {
            key: "zakat",
            title: "Kalkulator Zakat",
            subtitle: "Hitung zakat maal",
            group: "Alat",
            type: "zakat",
        },
    ];
    const belajarFeatureGroups = [
        {
            key: "referensi",
            label: "Referensi",
            meta: "Kamus dan tafsir",
            features: allFeatures.filter((feature) =>
                ["kamus", "tafsir"].includes(feature.key),
            ),
        },
        {
            key: "evaluasi",
            label: "Evaluasi",
            meta: "Alat",
            features: allFeatures.filter((feature) => feature.key === "zakat"),
        },
    ];

    return { allFeatures, belajarFeatureGroups };
});

jest.mock("../hooks/useLayoutModePreference", () => ({
    useLayoutModePreference: jest.fn(),
}));

import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { flushAsyncWork } from "../test-utils/async";
import { ExploreScreen } from "../screens/ExploreScreen";

const { useSession } = require("../context/SessionContext");
const { useFeedback } = require("../context/FeedbackContext");
const exploreApi = require("../api/explore");
const clientApi = require("../api/client");
const { useLayoutModePreference } = require("../hooks/useLayoutModePreference");
const {
    readPinnedFeatures,
    readRecentFeatures,
    rememberFeatureOpen,
    togglePinnedFeature,
} = require("../storage/recentFeatures");

const defaultNavigation = {
    current: { view: undefined, params: {} },
    open: jest.fn(),
    close: jest.fn(),
    setBack: jest.fn(),
    clearBack: jest.fn(),
};

const renderExploreScreen = async (props = {}) => {
    const view = render(
        <ExploreScreen
            isActive
            navigation={defaultNavigation}
            onOpenTab={jest.fn()}
            {...props}
        />,
    );
    await flushAsyncWork();
    return view;
};

const mockUseSession = () => ({
    error: "",
    loading: false,
    session: null,
    signIn: jest.fn(),
    signOut: jest.fn(),
    user: null,
});

beforeEach(() => {
    jest.clearAllMocks();
    useSession.mockReturnValue(mockUseSession());
    useFeedback.mockReturnValue({
        showError: jest.fn(),
        showInfo: jest.fn(),
        showSuccess: jest.fn(),
    });
    useLayoutModePreference.mockReturnValue({ isWebAppLayout: false });
    readPinnedFeatures.mockResolvedValue([]);
    readRecentFeatures.mockResolvedValue([]);
    rememberFeatureOpen.mockResolvedValue([]);
    togglePinnedFeature.mockResolvedValue({ items: [], pinned: false });
    exploreApi.getBlogCategoryItems.mockResolvedValue([]);
});

describe("ExploreScreen tool and detail routes", () => {
    test("opens tafsir detail with kitab selector and stacked comparison", async () => {
        clientApi.getSurahs.mockResolvedValueOnce([
            { number: 1, name: "Al-Fatihah", latin: "Al-Fatihah" },
        ]);
        exploreApi.getFeatureItemPage.mockResolvedValueOnce({
            items: [
                {
                    id: "tafsir-1",
                    title: "Ayat 1",
                    arabic: "بِسْمِ اللّٰهِ",
                    body: "Dengan nama Allah",
                    meta: "Al-Fatihah · Tafsir Kemenag · Tafsir Al-Mishbah",
                    tafsir: "Kemenag detail",
                    secondaryTafsir: "Al-Mishbah detail",
                    raw: { ayah_id: 1 },
                },
            ],
            meta: { hasMore: false },
        });

        const { getByText, getAllByTestId, queryByText } =
            await renderExploreScreen();

        fireEvent.press(getByText("Tafsir"));

        await waitFor(() => {
            expect(clientApi.getSurahs).toHaveBeenCalled();
            expect(getByText("1. Al-Fatihah")).toBeTruthy();
        });

        fireEvent.press(getByText("1. Al-Fatihah"));

        await waitFor(() => {
            expect(exploreApi.getFeatureItemPage).toHaveBeenCalledWith(
                expect.objectContaining({ endpoint: "/api/v1/tafsir/surah/1" }),
                { page: 0, size: 20 },
            );
            expect(getByText("Ayat 1")).toBeTruthy();
            expect(getByText("Tafsir Kemenag")).toBeTruthy();
        });

        fireEvent.press(getAllByTestId("content-card")[0]);

        await waitFor(() => {
            expect(getByText("Semua")).toBeTruthy();
            expect(getByText("Kemenag")).toBeTruthy();
            expect(getByText("Al-Mishbah")).toBeTruthy();
            expect(getByText("Kemenag detail")).toBeTruthy();
            expect(getByText("Al-Mishbah detail")).toBeTruthy();
        });

        fireEvent.press(getByText("Al-Mishbah"));

        expect(queryByText("Kemenag detail")).toBeNull();
        expect(getByText("Al-Mishbah detail")).toBeTruthy();
    });

    test("loads backend gold price when opening zakat calculator", async () => {
        exploreApi.getZakatGoldPrice.mockResolvedValueOnce(1400000);

        const { getByText } = await renderExploreScreen();

        fireEvent.press(getByText("Kalkulator Zakat"));

        await waitFor(() => {
            expect(exploreApi.getZakatGoldPrice).toHaveBeenCalledTimes(1);
            expect(getByText("Rp 119.000.000")).toBeTruthy();
        });
    });

    test("shows profile action button when no feature is active", async () => {
        const { getByTestId } = await renderExploreScreen();
        expect(getByTestId("action-Buka Profil")).toBeTruthy();
    });

    test("shows back button when a feature is active", async () => {
        const { getByText, getByTestId } = await renderExploreScreen();

        fireEvent.press(getByText("Kamus Arab"));

        await waitFor(() => {
            expect(getByTestId("action-Kembali ke Belajar")).toBeTruthy();
        });
    });
});
